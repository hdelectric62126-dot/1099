import { env } from "cloudflare:workers";
import { NextRequest } from "next/server";

const exports={
  expenses:{fields:["transaction_date","vendor","amount","category","business_purpose","review_status","review_note","receipt_key"],dateField:"transaction_date"},
  income:{fields:["received_date","payer","amount","method","notes"],dateField:"received_date"},
  mileage:{fields:["trip_date","miles","vehicle","purpose"],dateField:"trip_date"},
  jobs:{fields:["name","phase","status","quoted_amount","start_date","address","notes"],dateField:"start_date"},
  customers:{fields:["name","phone","email","address","notes"],dateField:null},
} as const;
type Kind=keyof typeof exports;
const csv=(value:unknown)=>`"${String(value??"").replaceAll('"','""')}"`;

export async function GET(request:NextRequest){
  const user=request.headers.get("oai-authenticated-user-id")||request.headers.get("oai-authenticated-user-email")||(process.env.NODE_ENV!=="production"?"local-preview":null);
  if(!user)return Response.json({error:"Sign in required"},{status:401});
  const requested=request.nextUrl.searchParams.get("kind")||"expenses";
  if(!(requested in exports))return Response.json({error:"Unknown export type"},{status:400});
  const year=request.nextUrl.searchParams.get("year");
  if(year&&!/^\\d{4}$/.test(year))return Response.json({error:"Invalid tax year"},{status:400});
  const kind=requested as Kind;const config=exports[kind];const fields=config.fields;
  const where=["owner_id=?"];const values:unknown[]=[user];
  if(year&&config.dateField){where.push(`substr(${config.dateField},1,4)=?`);values.push(year);}
  const result=await env.DB!.prepare(`SELECT ${fields.join(",")} FROM ${kind} WHERE ${where.join(" AND ")} ORDER BY id DESC`).bind(...values).all<Record<string,unknown>>();
  const body=[fields.join(","),...result.results.map(row=>fields.map(field=>csv(row[field])).join(","))].join("\r\n");
  const suffix=year&&config.dateField?`-${year}`:"";
  return new Response(body,{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="1099-${kind}${suffix}.csv"`,"cache-control":"no-store"}});
}
