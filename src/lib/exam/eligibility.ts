import { db } from "@/lib/db/client";
type EligibleOlympiad = {
  eligibilityMode: string;
  eligibilityGradeLevel: string | null;
  eligibilityInstitution: string | null;
  eligibilityAcademicLevel: string | null;
};

export async function isEligibleForOlympiad(
  olympiad: EligibleOlympiad,
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
