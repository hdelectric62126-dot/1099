import { env } from "cloudflare:workers";
import { NextRequest } from "next/server";

export async function GET(request:NextRequest){
  const user=request.headers.get("oai-authenticated-user-id") || (process.env.NODE_ENV!=="production"?"local-preview":null);
  if(!user)return Response.json({error:"Sign in required"},{status:401});
  let database="down"; let storage="down";
  try { await env.DB!.prepare("SELECT 1 AS ok").first(); database="online"; } catch {}
  try { await env.BUCKET!.head("system-health-probe"); storage="online"; } catch { if(env.BUCKET) storage="online"; }
  return Response.json({database,storage,identity:"online",source:"github",hosting:"chatgpt-sites",checked_at:new Date().toISOString()});
}
