import { Archive, Atom, BookOpen, Calculator, Dna, FlaskConical } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const SUBJECT_ICONS: { match: RegExp; icon: LucideIcon }[] = [
  { match: /math/i, icon: Calculator },
  { match: /physics/i, icon: Atom },
  { match: /chem/i, icon: FlaskConical },
  { match: /bio/i, icon: Dna },
  { match: /general/i, icon: BookOpen },
];

export function QuestionArchiveSubjectIcon({
  subject,
  className = "h-6 w-6",
}: {
  subject: string;
  className?: string;
}) {
  const Icon = SUBJECT_ICONS.find(({ match }) => match.test(subject))?.icon ?? Archive;

  return <Icon aria-hidden="true" className={className} strokeWidth={1.65} />;
}
