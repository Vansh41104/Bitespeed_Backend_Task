export interface IdentifyRequestPayload {
  email?: string | null;
  phoneNumber?: string | null;
}

export interface ContactResponse {
  primaryContactId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

export interface ValidationError {
  error: string;
}
