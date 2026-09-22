import { env } from "cloudflare:workers";
import { NextRequest } from "next/server";

function owner(request:NextRequest){
  return request.headers.get("oai-authenticated-user-id")
    || request.headers.get("oai-authenticated-user-email")
    || (process.env.NODE_ENV!=="production"?"local-preview":null);
}

export async function GET(request:NextRequest){
  const user=owner(request);
  if(!user)return Response.json({error:"Sign in required"},{status:401});
  const db=env.DB!;
  const [expenses,income,mileage,jobs,customers,tasks,activity]=await Promise.all([
    db.prepare("SELECT * FROM expenses WHERE owner_id=? ORDER BY id").bind(user).all(),
    db.prepare("SELECT * FROM income WHERE owner_id=? ORDER BY id").bind(user).all(),
    db.prepare("SELECT * FROM mileage WHERE owner_id=? ORDER BY id").bind(user).all(),
    db.prepare("SELECT * FROM jobs WHERE owner_id=? ORDER BY id").bind(user).all(),
    db.prepare("SELECT * FROM customers WHERE owner_id=? ORDER BY id").bind(user).all(),
    db.prepare("SELECT * FROM agent_tasks WHERE owner_id=? ORDER BY id").bind(user).all(),
    db.prepare("SELECT * FROM agent_activity WHERE owner_id=? ORDER BY id").bind(user).all(),
  ]);
  const payload={
    format:"1099-field-ledger-backup",
    version:1,
    generated_at:new Date().toISOString(),
    note:"Receipt files remain in secure object storage; receipt_key values are included so records stay linked.",
    records:{
      expenses:expenses.results,
      income:income.results,
      mileage:mileage.results,
      jobs:jobs.results,
      customers:customers.results,
      agent_tasks:tasks.results,
      agent_activity:activity.results,
    },
  };
  const stamp=new Date().toISOString().slice(0,10);
  return new Response(JSON.stringify(payload,null,2),{headers:{
    "content-type":"application/json; charset=utf-8",
    "content-disposition":`attachment; filename="1099-field-ledger-backup-${stamp}.json"`,
    "cache-control":"no-store",
  }});
}
