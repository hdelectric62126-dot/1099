import assert from "node:assert/strict";
import test from "node:test";
import { ReceiptUploadError, storeReceipt } from "../app/receipt-upload.ts";

test("synthetic receipt bytes and metadata reach object storage intact", async () => {
  const original = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
  let saved: { key: string; bytes: Uint8Array; options: unknown } | undefined;
  const bucket = {
    async put(key: string, bytes: Uint8Array, options: unknown) {
      saved = { key, bytes, options };
    },
  };

  const result = await storeReceipt(bucket, "synthetic-user", {
    name: "field receipt.PDF",
    type: "application/pdf",
    data: Buffer.from(original).toString("base64"),
  });

  assert.match(result.key, /^receipts\/synthetic-user\/[0-9a-f-]+\.pdf$/);
  assert.equal(result.bytesWritten, original.byteLength);
  assert.deepEqual(saved?.bytes, original);
  assert.deepEqual(saved?.options, {
    httpMetadata: { contentType: "application/pdf" },
    customMetadata: { ownerId: "synthetic-user", originalName: "field receipt.PDF" },
  });
});

test("receipt transfer rejects unsafe types and oversized payloads", async () => {
  const bucket = { async put() { throw new Error("must not write"); } };
  await assert.rejects(
    storeReceipt(bucket, "synthetic-user", { name: "x.exe", type: "application/x-msdownload", data: "AA==" }),
    (error: unknown) => error instanceof ReceiptUploadError && error.status === 415,
  );
  await assert.rejects(
    storeReceipt(bucket, "synthetic-user", { name: "huge.pdf", type: "application/pdf", data: "A".repeat(13_981_017) }),
    (error: unknown) => error instanceof ReceiptUploadError && error.status === 413,
  );
});
