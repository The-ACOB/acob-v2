export type TeamMember = {
  name: string;
  role: string;
  bio?: string;
  image?: string;
  links?: { label: string; href: string }[];
};

export const TEAM_MEMBERS: TeamMember[] = [];
