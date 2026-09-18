import { requireChatGPTUser } from "./chatgpt-auth";
import FieldLedger from "./field-ledger";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireChatGPTUser("/");
  return <FieldLedger displayName={user.fullName ?? "Daniel"} />;
}
