import { env } from "cloudflare:workers";
import { NextRequest } from "next/server";

type CountRow = { count: number };
type SumRow = { total: number | null };
type Activity = { agent_key:string; role:string; status:string; summary:string; priority:string; created_at?:string; run_id?:string };

function owner(request:NextRequest){return request.headers.get("oai-authenticated-user-id") || (process.env.NODE_ENV!=="production"?"local-preview":null);}
function denied(){return Response.json({error:"Sign in required"},{status:401});}

export async function GET(request:NextRequest){
  const user=owner(request); if(!user)return denied();
  const result=await env.DB!.prepare("SELECT run_id, agent_key, role, status, summary, priority, created_at FROM agent_activity WHERE owner_id=? ORDER BY id DESC LIMIT 25").bind(user).all<Activity>();
  return Response.json(result.results);
}

export async function POST(request:NextRequest){
  const user=owner(request); if(!user)return denied();
  const db=env.DB!;
  const [review,receipts,jobs,income,expenses,mileage]=await Promise.all([
    db.prepare("SELECT COUNT(*) AS count FROM expenses WHERE owner_id=? AND review_status!='ready'").bind(user).first<CountRow>(),
    db.prepare("SELECT COUNT(*) AS count FROM expenses WHERE owner_id=? AND receipt_key IS NULL").bind(user).first<CountRow>(),
    db.prepare("SELECT COUNT(*) AS count FROM jobs WHERE owner_id=? AND status!='Complete'").bind(user).first<CountRow>(),
    db.prepare("SELECT COALESCE(SUM(amount),0) AS total FROM income WHERE owner_id=?").bind(user).first<SumRow>(),
    db.prepare("SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE owner_id=?").bind(user).first<SumRow>(),
    db.prepare("SELECT COUNT(*) AS count FROM mileage WHERE owner_id=?").bind(user).first<CountRow>(),
  ]);
  const reviewCount=Number(review?.count||0), missingReceipts=Number(receipts?.count||0), openJobs=Number(jobs?.count||0);
  const gross=Number(income?.total||0), spent=Number(expenses?.total||0), net=gross-spent, mileageCount=Number(mileage?.count||0);
  const runId=crypto.randomUUID();
  const workerResults:Activity[]=[
    {agent_key:"receipt-worker",role:"Worker",status:"complete",priority:reviewCount||missingReceipts?"attention":"normal",summary:reviewCount||missingReceipts?`${reviewCount} expense${reviewCount===1?"":"s"} need review; ${missingReceipts} record${missingReceipts===1?"":"s"} have no receipt attached.`:"Receipt records are documented and clear for the current review queue."},
    {agent_key:"job-worker",role:"Worker",status:"complete",priority:openJobs?"normal":"low",summary:openJobs?`${openJobs} open job${openJobs===1?"":"s"} are on the board. Check dates, phases, and scope notes before dispatch.`:"No open jobs are recorded. Add the next estimate or active project."},
    {agent_key:"money-worker",role:"Worker",status:"complete",priority:net<0?"attention":"normal",summary:`Recorded income is $${gross.toFixed(2)}, expenses are $${spent.toFixed(2)}, and net before tax is $${net.toFixed(2)}. ${mileageCount} mileage log${mileageCount===1?"":"s"} saved.`},
  ];
  const attention=workerResults.filter(item=>item.priority==="attention").length;
  const manager:Activity={agent_key:"manager",role:"Manager",status:"complete",priority:attention?"attention":"normal",summary:`Reviewed all 3 worker reports. ${attention?`${attention} area${attention===1?"":"s"} need attention before the records are tax-ready.`:"No urgent recordkeeping exceptions were found."}`};
  const boss:Activity={agent_key:"boss",role:"Boss",status:"complete",priority:attention?"attention":"normal",summary:attention?"Priority approved: clear documentation exceptions first. No tax treatment, deletion, filing, or payment is authorized automatically.":"Team run approved. Continue recording new receipts, job changes, payments, and mileage; high-risk actions still require your approval."};
  const activities=[...workerResults,manager,boss];
  await db.batch(activities.map(item=>db.prepare("INSERT INTO agent_activity (owner_id,run_id,agent_key,role,status,summary,priority) VALUES (?,?,?,?,?,?,?)").bind(user,runId,item.agent_key,item.role,item.status,item.summary,item.priority)));
  return Response.json({run_id:runId,activities},{status:201});
}
