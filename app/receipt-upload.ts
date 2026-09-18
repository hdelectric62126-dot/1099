export const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;

const allowedReceiptTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export type ReceiptPayload = {
  name?: string;
  type?: string;
  data?: string;
};

type ReceiptBucket = {
  put(
    key: string,
    value: Uint8Array,
    options: {
      httpMetadata: { contentType: string };
      customMetadata: { ownerId: string; originalName: string };
    },
  ): Promise<unknown>;
};

export class ReceiptUploadError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function storeReceipt(
  bucket: ReceiptBucket,
  user: string,
  payload: ReceiptPayload,
) {
  const name = payload.name?.trim() || "receipt.bin";
  const type = payload.type || "";
  if (!allowedReceiptTypes.has(type)) {
    throw new ReceiptUploadError("Use JPG, PNG, WEBP, or PDF", 415);
  }
  if (!payload.data) {
    throw new ReceiptUploadError("Choose a receipt file", 400);
  }

  // Reject oversized encoded payloads before decoding them into Worker memory.
  const maxEncodedLength = Math.ceil(RECEIPT_MAX_BYTES / 3) * 4;
  if (payload.data.length > maxEncodedLength) {
    throw new ReceiptUploadError("Receipt must be under 10 MB", 413);
  }

  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(payload.data), character => character.charCodeAt(0));
  } catch {
    throw new ReceiptUploadError("Receipt file could not be read", 400);
  }
  if (bytes.byteLength > RECEIPT_MAX_BYTES) {
    throw new ReceiptUploadError("Receipt must be under 10 MB", 413);
  }

  const extension = name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  const key = `receipts/${user}/${crypto.randomUUID()}.${extension}`;
  await bucket.put(key, bytes, {
    httpMetadata: { contentType: type },
    customMetadata: { ownerId: user, originalName: name },
  });
  return { key, bytesWritten: bytes.byteLength };
}
