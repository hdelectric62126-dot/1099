import { env } from "cloudflare:workers";
import { NextRequest } from "next/server";

const tables = {
  expenses: { fields:["job_id","vendor","amount","transaction_date","category","business_purpose","is_business_meal","receipt_key","review_status","review_note"], required:["vendor","amount","transaction_date","category"], order:"transaction_date" },
  customers: { fields:["name","phone","email","address","notes"], required:["name"], order:"name" },
  jobs: { fields:["customer_id","name","phase","status","quoted_amount","start_date","address","notes"], required:["name"], order:"created_at" },
  income: { fields:["job_id","payer","amount","received_date","method","notes"], required:["payer","amount","received_date"], order:"received_date" },
  mileage: { fields:["job_id","trip_date","miles","vehicle","purpose"], required:["trip_date","miles","purpose"], order:"trip_date" },
} as const;
type Kind = keyof typeof tables;

function owner(request:NextRequest){return request.headers.get("oai-authenticated-user-id") || (process.env.NODE_ENV!=="production"?"local-preview":null);}
function error(message:string,status=400){return Response.json({error:message},{status});}
function kindOf(value:string|null):Kind|null{return value && value in tables ? value as Kind : null;}

export async function GET(request:NextRequest){const user=owner(request);if(!user)return error("Sign in required",401);const kind=kindOf(request.nextUrl.searchParams.get("kind"));if(!kind)return error("Unknown record type");const config=tables[kind];const result=await env.DB!.prepare(`SELECT * FROM ${kind} WHERE owner_id = ? ORDER BY ${config.order} DESC, id DESC LIMIT 500`).bind(user).all();return Response.json(result.results);}

export async function POST(request:NextRequest){const user=owner(request);if(!user)return error("Sign in required",401);const body=await request.json() as Record<string,unknown>;const kind=kindOf(String(body.kind||""));if(!kind)return error("Unknown record type");const config=tables[kind];for(const field of config.required){if(body[field]===undefined||body[field]==="")return error(`${field.replaceAll("_"," ")} is required`);}if((kind==="expenses"||kind==="income")&&!(Number(body.amount)>0))return error("Amount must be greater than zero");if(kind==="mileage"&&!(Number(body.miles)>0))return error("Miles must be greater than zero");
  if(kind==="expenses"){const purpose=String(body.business_purpose||"").trim();const meal=body.is_business_meal==="1"||body.category==="Business meal";body.is_business_meal=meal?1:0;body.review_status=purpose?"ready":"review";body.review_note=meal?"Business meal: confirm business relationship, purpose, attendees, and deductible percentage":purpose?"":"Add the business purpose before tax export";}
  const selected=config.fields.filter(field=>body[field]!==undefined&&body[field]!=="");const columns=["owner_id",...selected];const placeholders=columns.map(()=>"?").join(",");const values=[user,...selected.map(field=>{const value=body[field];return typeof value==="string"?value.trim():value;})];const result=await env.DB!.prepare(`INSERT INTO ${kind} (${columns.join(",")}) VALUES (${placeholders}) RETURNING *`).bind(...values).first();return Response.json(result,{status:201});}

export async function DELETE(request:NextRequest){const user=owner(request);if(!user)return error("Sign in required",401);const kind=kindOf(request.nextUrl.searchParams.get("kind"));const id=Number(request.nextUrl.searchParams.get("id"));if(!kind||!Number.isInteger(id))return error("Invalid delete request");const receipt=kind==="expenses"?await env.DB!.prepare("SELECT receipt_key FROM expenses WHERE id=? AND owner_id=?").bind(id,user).first<{receipt_key:string|null}>():null;await env.DB!.prepare(`DELETE FROM ${kind} WHERE id=? AND owner_id=?`).bind(id,user).run();if(receipt?.receipt_key)await env.BUCKET!.delete(receipt.receipt_key);return Response.json({ok:true});}
