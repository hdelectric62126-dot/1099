import { env } from "cloudflare:workers";
import { NextRequest } from "next/server";

const agents = new Set(["boss", "manager", "receipt-worker", "job-worker", "money-worker"]);
const statuses = new Set(["queued", "working", "done"]);
const priorities = new Set(["normal", "high", "urgent"]);
function owner(request:NextRequest){return request.headers.get("oai-authenticated-user-id") || (process.env.NODE_ENV!=="production"?"local-preview":null);}
function error(message:string,status=400){return Response.json({error:message},{status});}

export async function GET(request:NextRequest){
  const user=owner(request); if(!user)return error("Sign in required",401);
  const result=await env.DB!.prepare("SELECT * FROM agent_tasks WHERE owner_id=? ORDER BY CASE status WHEN 'working' THEN 0 WHEN 'queued' THEN 1 ELSE 2 END, CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END, id DESC LIMIT 200").bind(user).all();
  return Response.json(result.results);
}

export async function POST(request:NextRequest){
  const user=owner(request); if(!user)return error("Sign in required",401);
  const body=await request.json() as Record<string,unknown>;
  const title=String(body.title||"").trim(); const details=String(body.details||"").trim(); const assigned=String(body.assigned_agent||""); const priority=String(body.priority||"normal");
  if(!title)return error("Task title is required"); if(!agents.has(assigned))return error("Choose a valid agent"); if(!priorities.has(priority))return error("Choose a valid priority");
  const result=await env.DB!.prepare("INSERT INTO agent_tasks (owner_id,title,details,assigned_agent,priority,status) VALUES (?,?,?,?,?,'queued') RETURNING *").bind(user,title,details,assigned,priority).first();
  return Response.json(result,{status:201});
}

export async function PATCH(request:NextRequest){
  const user=owner(request); if(!user)return error("Sign in required",401);
  const body=await request.json() as Record<string,unknown>; const id=Number(body.id); const status=String(body.status||"");
  if(!Number.isInteger(id)||!statuses.has(status))return error("Invalid task update");
  const result=await env.DB!.prepare("UPDATE agent_tasks SET status=? WHERE id=? AND owner_id=? RETURNING *").bind(status,id,user).first();
  if(!result)return error("Task not found",404); return Response.json(result);
}

export async function DELETE(request:NextRequest){
  const user=owner(request); if(!user)return error("Sign in required",401); const id=Number(request.nextUrl.searchParams.get("id"));
  if(!Number.isInteger(id))return error("Invalid task",400); await env.DB!.prepare("DELETE FROM agent_tasks WHERE id=? AND owner_id=?").bind(id,user).run(); return Response.json({ok:true});
}
