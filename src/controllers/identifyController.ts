import { Request, Response } from 'express';
import { identifyContact } from '../services/contactService';
import { IdentifyRequestPayload, ValidationError } from '../types';

const validateAndNormalizeInput = (email: any, phoneNumber: any): IdentifyRequestPayload | ValidationError => {
  if (
    (email === undefined || email === null || email === '') &&
    (phoneNumber === undefined || phoneNumber === null || phoneNumber === '')
  ) {
    return { error: 'Either email or phoneNumber must be provided.' };
  }

  let normalizedEmail: string | null = null;
  if (email !== undefined && email !== null && email !== '') {
    const emailStr = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      return { error: 'Invalid email format.' };
    }
    normalizedEmail = emailStr;
  }

  let normalizedPhone: string | null = null;
  if (phoneNumber !== undefined && phoneNumber !== null && phoneNumber !== '') {
    const phoneStr = String(phoneNumber).trim();
    const cleanPhone = phoneStr.replace(/[\s\-\(\)\+]/g, '');
    if (!/^\d{6,15}$/.test(cleanPhone)) {
      return { error: 'Invalid phone number format.' };
    }
    normalizedPhone = cleanPhone;
  }

  return {
    email: normalizedEmail,
    phoneNumber: normalizedPhone,
  };
};

export const handleIdentify = async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  const validationResult = validateAndNormalizeInput(email, phoneNumber);
  if ('error' in validationResult) {
    return res.status(400).json(validationResult);
  }

  try {
    const result = await identifyContact(validationResult);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /identify:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('validation') || error.message.includes('Invalid')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Database')) {
        return res.status(503).json({ error: 'Service temporarily unavailable' });
      }
    }
    
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};