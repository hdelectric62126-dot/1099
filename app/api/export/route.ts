import { env } from "cloudflare:workers";
import { NextRequest } from "next/server";

const exports={
  expenses:["transaction_date","vendor","amount","category","business_purpose","review_status","review_note","receipt_key"],
  income:["received_date","payer","amount","method","notes"],
  mileage:["trip_date","miles","vehicle","purpose"],
  jobs:["name","phase","status","quoted_amount","start_date","address","notes"],
  customers:["name","phone","email","address","notes"],
} as const;
type Kind=keyof typeof exports;
const csv=(value:unknown)=>`"${String(value??"").replaceAll('"','""')}"`;

export async function GET(request:NextRequest){
  const user=request.headers.get("oai-authenticated-user-id")||request.headers.get("oai-authenticated-user-email")||(process.env.NODE_ENV!=="production"?"local-preview":null);
  if(!user)return Response.json({error:"Sign in required"},{status:401});
  const requested=request.nextUrl.searchParams.get("kind")||"expenses";
  if(!(requested in exports))return Response.json({error:"Unknown export type"},{status:400});
  const kind=requested as Kind;const fields=exports[kind];
  const result=await env.DB!.prepare(`SELECT ${fields.join(",")} FROM ${kind} WHERE owner_id=? ORDER BY id DESC`).bind(user).all<Record<string,unknown>>();
  const content=[fields.join(","),...result.results.map(row=>fields.map(field=>csv(row[field])).join(","))].join("\r\n");
  return new Response(content,{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="1099-${kind}.csv"`,"cache-control":"no-store"}});
}
