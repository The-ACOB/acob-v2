import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { isEligibleForOlympiad } from "@/lib/exam/eligibility";
import { OlympiadRegistrationForm } from "@/components/dashboard/OlympiadRegistrationForm";

export default async function OlympiadRegistrationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const olympiad = await db.olympiad.findUnique({
    where: { id },
    include: { _count: { select: { questions: true, registrations: true } } },
  });
  if (!olympiad || olympiad.status !== "published") notFound();
  const existing = await db.olympiadRegistration.findUnique({
    where: { olympiadId_userId: { olympiadId: id, userId: session.id } },
  });
  const eligible = await isEligibleForOlympiad(olympiad, session.id);
  return (
    <OlympiadRegistrationForm
      olympiad={olympiad}
      questionCount={olympiad._count.questions}
      registered={Boolean(existing)}
      eligible={eligible}
      registrationOpen
    />
  );
}
