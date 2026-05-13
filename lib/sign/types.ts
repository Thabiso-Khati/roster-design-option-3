/**
 * Shared E-Sign types — used by both client and server.
 */

export type SigningStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "signed"
  | "declined"
  | "expired"
  | "cancelled";

export type SigningAuditAction =
  | "created"
  | "sent"
  | "viewed"
  | "signed"
  | "declined"
  | "expired"
  | "cancelled"
  | "downloaded"
  | "reminder_sent";

export interface SigningRequest {
  id: string;
  requesterUserId: string;
  requesterName: string;
  requesterEmail: string;
  recipientEmail: string;
  recipientName: string;
  contractType: string;
  contractTitle: string;
  contractHtml: string;
  contractMetadata: Record<string, unknown>;
  token: string;
  expiresAt: string;
  status: SigningStatus;
  sentAt: string | null;
  firstViewedAt: string | null;
  signedAt: string | null;
  declinedAt: string | null;
  declineReason: string | null;
  signatureImageData: string | null;
  signatureTypedName: string | null;
  signerIp: string | null;
  signerUserAgent: string | null;
  signedPdfStoragePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SigningAuditEntry {
  id: string;
  signingRequestId: string;
  userId: string | null;
  action: SigningAuditAction;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CreateSigningRequestInput {
  recipientEmail: string;
  recipientName: string;
  contractType: string;
  contractTitle: string;
  contractHtml: string;
  contractMetadata?: Record<string, unknown>;
  ttlDays?: number;            // defaults to 30 days
}

export interface PublicSigningRequestView {
  id: string;
  requesterName: string;
  requesterEmail: string;
  recipientName: string;
  contractType: string;
  contractTitle: string;
  contractHtml: string;
  status: SigningStatus;
  expiresAt: string;
  sentAt: string | null;
  signedAt: string | null;
  /** Signature data — only populated once status === "signed". */
  signatureImageData?: string | null;
  signatureTypedName?: string | null;
}
