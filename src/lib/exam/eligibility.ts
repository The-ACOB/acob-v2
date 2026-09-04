import { db } from "@/lib/db/client";
import type { Olympiad } from "@prisma/client";

export async function isEligibleForOlympiad(
  olympiad: Olympiad,
  userId: string,
): Promise<boolean> {
  if (olympiad.eligibilityMode === "open") return true;
  const participant = await db.participant.findUnique({ where: { userId } });
  if (!participant) return false;
  return (
    (!olympiad.eligibilityGradeLevel ||
      participant.gradeLevel === olympiad.eligibilityGradeLevel) &&
    (!olympiad.eligibilityInstitution ||
      participant.institution === olympiad.eligibilityInstitution) &&
    (!olympiad.eligibilityAcademicLevel ||
      participant.academicLevel === olympiad.eligibilityAcademicLevel)
  );
}
