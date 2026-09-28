import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { isEligibleForOlympiad } from "@/lib/exam/eligibility";
import { OlympiadRegistrationForm } from "@/components/dashboard/OlympiadRegistrationForm";
import {
  getOlympiadPhase,
  isRegistrationOpen,
} from "@/lib/olympiads/lifecycle";

export default async function OlympiadRegistrationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const olympiad = await db.olympiad.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          questions: true,
          registrations: true,
        },
      },
    },
  });

  if (!olympiad || olympiad.status !== "published") {
    notFound();
  }

  const existing = await db.olympiadRegistration.findUnique({
    where: {
      olympiadId_userId: {
        olympiadId: id,
        userId: session.id,
      },
    },
    include: {
      payments: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  const eligible = await isEligibleForOlympiad(olympiad, session.id);

  const latestPayment = existing?.payments[0] ?? null;

  return (
    <div className="mx-auto max-w-2xl">
      <OlympiadRegistrationForm
        olympiad={{
          ...olympiad,
          registrationFee: olympiad.registrationFee?.toString() ?? null,
        }}
        questionCount={olympiad._count.questions}
        registered={existing?.status === "confirmed"}
        registrationStatus={existing?.status ?? null}
        latestPaymentStatus={latestPayment?.status ?? null}
        eligible={eligible}
        registrationOpen={isRegistrationOpen(olympiad)}
        phase={getOlympiadPhase(olympiad)}
      />
    </div>
  );
}
