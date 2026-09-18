import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const owned = () => ({
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: text("owner_id").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const customers = sqliteTable("customers", { ...owned(), name:text("name").notNull(), phone:text("phone"), email:text("email"), address:text("address"), notes:text("notes") }, t=>[index("idx_customers_owner_name").on(t.ownerId,t.name)]);
export const jobs = sqliteTable("jobs", { ...owned(), customerId:integer("customer_id"), name:text("name").notNull(), phase:text("phase").notNull().default("Estimate"), status:text("status").notNull().default("Open"), quotedAmount:real("quoted_amount").notNull().default(0), startDate:text("start_date"), address:text("address"), notes:text("notes") }, t=>[index("idx_jobs_owner_created").on(t.ownerId,t.createdAt)]);
export const expenses = sqliteTable("expenses", { ...owned(), jobId:integer("job_id"), vendor:text("vendor").notNull(), amount:real("amount").notNull(), transactionDate:text("transaction_date").notNull(), category:text("category").notNull(), businessPurpose:text("business_purpose"), isBusinessMeal:integer("is_business_meal").notNull().default(0), receiptKey:text("receipt_key"), reviewStatus:text("review_status").notNull().default("review"), reviewNote:text("review_note") }, t=>[index("idx_expenses_owner_date").on(t.ownerId,t.transactionDate)]);
export const income = sqliteTable("income", { ...owned(), jobId:integer("job_id"), payer:text("payer").notNull(), amount:real("amount").notNull(), receivedDate:text("received_date").notNull(), method:text("method"), notes:text("notes") }, t=>[index("idx_income_owner_date").on(t.ownerId,t.receivedDate)]);
export const mileage = sqliteTable("mileage", { ...owned(), jobId:integer("job_id"), tripDate:text("trip_date").notNull(), miles:real("miles").notNull(), vehicle:text("vehicle"), purpose:text("purpose").notNull() }, t=>[index("idx_mileage_owner_date").on(t.ownerId,t.tripDate)]);
export const agentActivity = sqliteTable("agent_activity", { ...owned(), runId:text("run_id").notNull(), agentKey:text("agent_key").notNull(), role:text("role").notNull(), status:text("status").notNull().default("complete"), summary:text("summary").notNull(), priority:text("priority").notNull().default("normal") }, t=>[index("idx_agent_activity_owner_created").on(t.ownerId,t.createdAt),index("idx_agent_activity_owner_run").on(t.ownerId,t.runId)]);
export const agentTasks = sqliteTable("agent_tasks", { ...owned(), title:text("title").notNull(), details:text("details"), assignedAgent:text("assigned_agent").notNull(), priority:text("priority").notNull().default("normal"), status:text("status").notNull().default("queued") }, t=>[index("idx_agent_tasks_owner_status").on(t.ownerId,t.status),index("idx_agent_tasks_owner_agent").on(t.ownerId,t.assignedAgent)]);
