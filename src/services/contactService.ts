import prisma from '../utils/prismaClient';
import { Contact } from '@prisma/client';
import { IdentifyRequestPayload, ContactResponse } from '../types';

const LinkPrecedence = {
  primary: 'primary' as const,
  secondary: 'secondary' as const
} as const;

export async function identifyContact(payload: IdentifyRequestPayload): Promise<ContactResponse> {
  const { email, phoneNumber } = payload;

  if (!email && !phoneNumber) {
    throw new Error('Email or phone number must be provided.');
  }
  return await prisma.$transaction(async (tx) => {
    const directMatches = await tx.contact.findMany({
      where: {
        deletedAt: null,
        OR: [
          email ? { email } : {},
          phoneNumber ? { phoneNumber } : {},
        ].filter(condition => Object.keys(condition).length > 0),
      },
      orderBy: { createdAt: 'asc' },
    });

    if (directMatches.length === 0) {
      const newPrimaryContact = await tx.contact.create({
        data: {
          email: email ?? null,
          phoneNumber: phoneNumber ?? null,
          linkPrecedence: LinkPrecedence.primary,
        },
      });

      return buildResponse(newPrimaryContact, []);
    }

    const allContactIds = new Set<number>();    directMatches.forEach(contact => {
      allContactIds.add(contact.id);
      if (contact.linkedId) {
        allContactIds.add(contact.linkedId);
      }
    });

    const allNetworkContacts = await tx.contact.findMany({
      where: {
        id: { in: Array.from(allContactIds) },
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    const primaryIds = allNetworkContacts
      .filter(c => c.linkPrecedence === LinkPrecedence.primary)
      .map(c => c.id);

    const secondaryContacts = await tx.contact.findMany({
      where: {
        linkedId: { in: primaryIds },
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    const allContacts = [...allNetworkContacts, ...secondaryContacts]
      .filter((contact, index, self) => 
        index === self.findIndex(c => c.id === contact.id)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const primaryContacts = allContacts.filter(c => c.linkPrecedence === LinkPrecedence.primary);
    
    if (primaryContacts.length === 0) {
      throw new Error('Database integrity error: No primary contact found in network');
    }    const truePrimary = primaryContacts[0];
    const otherPrimaries = primaryContacts.slice(1);

    if (otherPrimaries.length > 0) {
      await tx.contact.updateMany({
        where: { id: { in: otherPrimaries.map(c => c.id) } },
        data: {
          linkPrecedence: LinkPrecedence.secondary,
          linkedId: truePrimary.id,
          updatedAt: new Date(),        },
      });

      await tx.contact.updateMany({
        where: { linkedId: { in: otherPrimaries.map(c => c.id) } },
        data: {
          linkedId: truePrimary.id,
          updatedAt: new Date(),
        },      });
    }

    const needsNewSecondary = shouldCreateNewSecondary(
      email ?? null, 
      phoneNumber ?? null, 
      allContacts
    );

    if (needsNewSecondary) {
      await tx.contact.create({
        data: {
          email: email ?? null,
          phoneNumber: phoneNumber ?? null,
          linkedId: truePrimary.id,
          linkPrecedence: LinkPrecedence.secondary,
        },      });
    }

    const finalSecondaryContacts = await tx.contact.findMany({
      where: {
        linkedId: truePrimary.id,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    return buildResponse(truePrimary, finalSecondaryContacts);
  });
}
function shouldCreateNewSecondary(
  email: string | null,
  phoneNumber: string | null,
  existingContacts: Contact[]
): boolean {
  const exactMatch = existingContacts.find(contact => 
    contact.email === email && contact.phoneNumber === phoneNumber
  );
    if (exactMatch) {
    return false;
  }

  const existingEmails = new Set(existingContacts.map(c => c.email).filter(Boolean));
  const existingPhones = new Set(existingContacts.map(c => c.phoneNumber).filter(Boolean));

  const hasNewEmail = Boolean(email && !existingEmails.has(email));
  const hasNewPhone = Boolean(phoneNumber && !existingPhones.has(phoneNumber));

  return hasNewEmail || hasNewPhone;
}


//Builds the final response object with proper ordering

function buildResponse(primaryContact: Contact, secondaryContacts: Contact[]): ContactResponse {
  const emails = new Set<string>();
  const phoneNumbers = new Set<string>();
  
  if (primaryContact.email) emails.add(primaryContact.email);
  if (primaryContact.phoneNumber) phoneNumbers.add(primaryContact.phoneNumber);
  
  secondaryContacts.forEach(contact => {
    if (contact.email) emails.add(contact.email);
    if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);
  });
  const emailsArray = Array.from(emails);
  const phoneNumbersArray = Array.from(phoneNumbers);
  
  if (primaryContact.email && emailsArray[0] !== primaryContact.email) {
    const index = emailsArray.indexOf(primaryContact.email);
    if (index > 0) {
      emailsArray.splice(index, 1);
      emailsArray.unshift(primaryContact.email);
    }
  }
  
  if (primaryContact.phoneNumber && phoneNumbersArray[0] !== primaryContact.phoneNumber) {
    const index = phoneNumbersArray.indexOf(primaryContact.phoneNumber);
    if (index > 0) {
      phoneNumbersArray.splice(index, 1);
      phoneNumbersArray.unshift(primaryContact.phoneNumber);
    }
  }

  return {
    primaryContactId: primaryContact.id,
    emails: emailsArray,
    phoneNumbers: phoneNumbersArray,
    secondaryContactIds: secondaryContacts.map(c => c.id),
  };
}