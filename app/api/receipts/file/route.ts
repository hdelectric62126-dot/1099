import { env } from "cloudflare:workers";
import { NextRequest } from "next/server";

export async function GET(request:NextRequest){
  const user=request.headers.get("oai-authenticated-user-id")||request.headers.get("oai-authenticated-user-email")||(process.env.NODE_ENV!=="production"?"local-preview":null);
  if(!user)return Response.json({error:"Sign in required"},{status:401});
  const key=request.nextUrl.searchParams.get("key");
  if(!key||!key.startsWith(`receipts/${user}/`))return Response.json({error:"Receipt not found"},{status:404});
  const object=await env.BUCKET!.get(key);
  if(!object||object.customMetadata?.ownerId!==user)return Response.json({error:"Receipt not found"},{status:404});
  const headers=new Headers();
  headers.set("content-type",object.httpMetadata?.contentType||"application/octet-stream");
  headers.set("content-disposition",`inline; filename="${(object.customMetadata?.originalName||"receipt").replace(/["\\\r\n]/g,"_")}"`);
  headers.set("cache-control","private, max-age=60");
  headers.set("x-content-type-options","nosniff");
  return new Response(object.body,{headers});
}
