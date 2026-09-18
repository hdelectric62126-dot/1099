import { env } from "cloudflare:workers";
import { NextRequest } from "next/server";
import { ReceiptUploadError, storeReceipt } from "../../receipt-upload";

export async function POST(request: NextRequest) {
  const user = request.headers.get("oai-authenticated-user-id")
    || request.headers.get("oai-authenticated-user-email")
    || (process.env.NODE_ENV !== "production" ? "local-preview" : null);
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });

  try {
    const stored = await storeReceipt(env.BUCKET!, user, await request.json());
    return Response.json({ key: stored.key }, { status: 201 });
  } catch (error) {
    if (error instanceof ReceiptUploadError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
