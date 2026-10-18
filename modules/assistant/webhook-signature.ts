export type SignatureVerifier = (payload: string, signature: string, secretReference: string) => boolean;
export function verifyWebhookSignature(payload: string, signature: string | null, secretReference: string | null, verifier?: SignatureVerifier): boolean { if (!signature || !secretReference || !verifier) return false; return verifier(payload, signature, secretReference); }
