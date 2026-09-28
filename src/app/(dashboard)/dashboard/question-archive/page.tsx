import { requirePermission } from "@/lib/authz/guards";
import { QuestionArchiveManager } from "@/components/dashboard/QuestionArchiveManager";

export default async function QuestionArchivePage() {
  await requirePermission("question:create");

  return <QuestionArchiveManager />;
}
