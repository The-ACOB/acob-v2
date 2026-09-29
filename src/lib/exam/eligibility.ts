import { db } from "@/lib/db/client";

type EligibleOlympiad = {
  eligibilityMode: string;
  eligibilityGradeLevel: string | null;
  eligibilityInstitution: string | null;
  eligibilityAcademicLevel: string | null;
};

function parseEligibleGrades(value: string | null): Set<string> {
  if (!value) return new Set();

  const grades = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .flatMap((item) => {
      const range = item.match(/(?:class\s*)?(\d+)\s*(?:to|[-–])\s*(\d+)/i);
      if (!range) return [item.replace(/[^0-9]/g, "")];

      const start = Number(range[1]);
      const end = Number(range[2]);
      if (!Number.isInteger(start) || !Number.isInteger(end)) return [];

      const result: string[] = [];
      for (let grade = Math.min(start, end); grade <= Math.max(start, end); grade += 1) {
        result.push(String(grade));
      }
      return result;
    });

  return new Set(grades.filter((grade) => grade.length > 0));
}

function matchesAcademicLevel(
  participantLevel: string | null,
  requiredLevel: string | null,
): boolean {
  if (!requiredLevel) return true;
  if (!participantLevel) return false;

  const required = requiredLevel
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const participant = participantLevel.trim().toLowerCase();

  return required.includes(participant);
}

export async function isEligibleForOlympiad(
  olympiad: EligibleOlympiad,
  userId: string,
): Promise<boolean> {
  if (olympiad.eligibilityMode === "open") return true;

  const participant = await db.participant.findUnique({ where: { userId } });
  if (!participant) return false;

  const eligibleGrades = parseEligibleGrades(olympiad.eligibilityGradeLevel);
  const gradeMatches =
    eligibleGrades.size === 0 || eligibleGrades.has(participant.gradeLevel ?? "");

  const institutionMatches =
    !olympiad.eligibilityInstitution ||
    participant.institution?.trim().toLowerCase() ===
      olympiad.eligibilityInstitution.trim().toLowerCase();

  const gradeNumber = Number.parseInt(participant.gradeLevel ?? "", 10);
  const derivedAcademicLevel =
    gradeNumber >= 6 && gradeNumber <= 8
      ? "Junior Secondary"
      : gradeNumber >= 9 && gradeNumber <= 10
        ? "Secondary"
        : gradeNumber >= 11 && gradeNumber <= 12
          ? "Higher Secondary"
          : participant.academicLevel;

  const academicLevelMatches = matchesAcademicLevel(
    derivedAcademicLevel,
    olympiad.eligibilityAcademicLevel,
  );

  return gradeMatches && institutionMatches && academicLevelMatches;
}
