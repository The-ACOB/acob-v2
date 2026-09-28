import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CheckSquare,
  ScrollText,
  Users,
  UserPlus,
  Inbox,
  MessageCircle,
  Briefcase,
  MonitorPlay,
  Mic,
  BookOpen,
  Trophy,
  BarChart3,
  Award,
  FileText,
  Bell,
  Archive,
  Megaphone,
} from "lucide-react";
import type { RoleKey } from "@/lib/authz/roles";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

/* -------------------------------------------------------------------------- */
/* Canonical navigation items                                                 */
/* -------------------------------------------------------------------------- */

const OVERVIEW: NavItem = {
  href: "/dashboard",
  label: "Overview",
  icon: LayoutDashboard,
};

const NOTIFICATIONS: NavItem = {
  href: "/dashboard/notifications",
  label: "Notifications",
  icon: Bell,
};

const MY_PROFILE: NavItem = {
  href: "/dashboard/profile",
  label: "My Profile",
  icon: UserPlus,
};

const ORGANISATION_TEAM: NavItem = {
  href: "/dashboard/organisation-team",
  label: "Organisation Team",
  icon: Users,
};

const PARTICIPANTS: NavItem = {
  href: "/dashboard/participants",
  label: "Participants",
  icon: Users,
};

const APPROVALS: NavItem = {
  href: "/dashboard/approvals",
  label: "Approvals",
  icon: CheckSquare,
};

const AUDIT_LOG: NavItem = {
  href: "/dashboard/audit",
  label: "Audit Log",
  icon: ScrollText,
};

const OLYMPIADS: NavItem = {
  href: "/dashboard/olympiads",
  label: "Olympiads",
  icon: Trophy,
};

const QUESTION_ARCHIVE: NavItem = {
  href: "/dashboard/question-archive",
  label: "Question Archive",
  icon: Archive,
};

const RESULTS: NavItem = {
  href: "/dashboard/results",
  label: "Results & Rankings",
  icon: BarChart3,
};

const CERTIFICATES: NavItem = {
  href: "/dashboard/certificates",
  label: "Certificates",
  icon: Award,
};

const RECOMMENDATION_LETTERS: NavItem = {
  href: "/dashboard/recommendation-letters",
  label: "Recommendation Letters",
  icon: FileText,
};

const CONTACT_MESSAGES: NavItem = {
  href: "/dashboard/contact",
  label: "Contact Messages",
  icon: Inbox,
};

const SUPPORT: NavItem = {
  href: "/dashboard/support",
  label: "Support",
  icon: MessageCircle,
};

const ANNOUNCEMENTS: NavItem = {
  href: "/dashboard/popups",
  label: "Announcements",
  icon: Megaphone,
};

const RESOURCES: NavItem = {
  href: "/dashboard/resources",
  label: "Resources",
  icon: FileText,
};

const STUDY_GUIDES: NavItem = {
  href: "/dashboard/study-guides",
  label: "Study Guides",
  icon: BookOpen,
};

const TUTORIALS: NavItem = {
  href: "/dashboard/tutorials",
  label: "Tutorials",
  icon: MonitorPlay,
};

const PODCASTS: NavItem = {
  href: "/dashboard/podcasts",
  label: "Podcasts",
  icon: Mic,
};

const CAREERS: NavItem = {
  href: "/dashboard/careers",
  label: "Careers",
  icon: Briefcase,
};

const REGISTER_PARTICIPANT: NavItem = {
  href: "/dashboard/register-participant",
  label: "Register Participant",
  icon: UserPlus,
};

const REFERRED_PARTICIPANTS: NavItem = {
  href: "/dashboard/referrals",
  label: "Referred Participants",
  icon: Users,
};

const MESSAGES: NavItem = {
  href: "/dashboard/messages",
  label: "Messages",
  icon: MessageCircle,
};

/* -------------------------------------------------------------------------- */
/* Canonical section builders                                                  */
/* -------------------------------------------------------------------------- */

const GENERAL_SECTION: NavSection = {
  label: "General",
  items: [OVERVIEW, NOTIFICATIONS, MY_PROFILE],
};

const PEOPLE_SECTION: NavSection = {
  label: "People",
  items: [ORGANISATION_TEAM, PARTICIPANTS],
};

const PARTICIPANTS_ONLY_SECTION: NavSection = {
  label: "People",
  items: [PARTICIPANTS],
};

const EXECUTIVE_SECTION: NavSection = {
  label: "Executive",
  items: [APPROVALS, AUDIT_LOG],
};

const OLYMPIADS_SECTION: NavSection = {
  label: "Olympiads",
  items: [OLYMPIADS, QUESTION_ARCHIVE, RESULTS],
};

const OLYMPIADS_WITHOUT_ARCHIVE_SECTION: NavSection = {
  label: "Olympiads",
  items: [OLYMPIADS, RESULTS],
};

const OLYMPIADS_WITH_ARCHIVE_NO_RESULTS_SECTION: NavSection = {
  label: "Olympiads",
  items: [OLYMPIADS, QUESTION_ARCHIVE],
};

const RECOGNITION_SECTION: NavSection = {
  label: "Recognition",
  items: [CERTIFICATES, RECOMMENDATION_LETTERS],
};

const COMMUNICATIONS_SECTION: NavSection = {
  label: "Communications",
  items: [CONTACT_MESSAGES, SUPPORT, ANNOUNCEMENTS],
};

const CONTACT_SUPPORT_SECTION: NavSection = {
  label: "Communications",
  items: [CONTACT_MESSAGES, SUPPORT],
};

const ANNOUNCEMENTS_SECTION: NavSection = {
  label: "Communications",
  items: [ANNOUNCEMENTS],
};

const CONTENT_SECTION: NavSection = {
  label: "Content",
  items: [RESOURCES, STUDY_GUIDES, TUTORIALS, PODCASTS],
};

const RESOURCES_SECTION: NavSection = {
  label: "Content",
  items: [RESOURCES],
};

const CAREERS_SECTION: NavSection = {
  label: "Careers",
  items: [CAREERS],
};

const REFERRALS_SECTION: NavSection = {
  label: "Referrals",
  items: [REGISTER_PARTICIPANT, REFERRED_PARTICIPANTS],
};

const ACCOUNT_SECTION: NavSection = {
  label: "Account",
  items: [MESSAGES],
};

/* -------------------------------------------------------------------------- */
/* Role navigation                                                             */
/* -------------------------------------------------------------------------- */

const EXECUTIVE_NAV: NavSection[] = [
  GENERAL_SECTION,
  PEOPLE_SECTION,
  EXECUTIVE_SECTION,
  OLYMPIADS_SECTION,
  RECOGNITION_SECTION,
  COMMUNICATIONS_SECTION,
  CONTENT_SECTION,
  CAREERS_SECTION,
];

const NAV_BY_ROLE: Record<RoleKey, NavSection[]> = {
  CEO: EXECUTIVE_NAV,
  COO: EXECUTIVE_NAV,
  CTO: EXECUTIVE_NAV,

  HR_PR: [
    GENERAL_SECTION,
    PARTICIPANTS_ONLY_SECTION,
    CONTACT_SUPPORT_SECTION,
    ANNOUNCEMENTS_SECTION,
    CAREERS_SECTION,
  ],

  CONTENT_MEDIA: [
    GENERAL_SECTION,
    {
      label: "Communications",
      items: [ANNOUNCEMENTS],
    },
    CONTENT_SECTION,
  ],

  SUPPORT: [
    GENERAL_SECTION,
    CONTACT_SUPPORT_SECTION,
  ],

  ACADEMIC: [
    GENERAL_SECTION,
    OLYMPIADS_WITH_ARCHIVE_NO_RESULTS_SECTION,
    RECOGNITION_SECTION,
    RESOURCES_SECTION,
  ],

  AMBASSADOR: [
    GENERAL_SECTION,
    OLYMPIADS_WITHOUT_ARCHIVE_SECTION,
    REFERRALS_SECTION,
    RECOGNITION_SECTION,
    ACCOUNT_SECTION,
  ],

  PARTICIPANT: [
    GENERAL_SECTION,
    OLYMPIADS_WITHOUT_ARCHIVE_SECTION,
    RECOGNITION_SECTION,
    ACCOUNT_SECTION,
  ],
};

export function resolveNavSections(roleKeys: string[]): NavSection[] {
  const priority: RoleKey[] = [
    "CEO",
    "COO",
    "CTO",
    "HR_PR",
    "CONTENT_MEDIA",
    "SUPPORT",
    "ACADEMIC",
    "AMBASSADOR",
    "PARTICIPANT",
  ];

  const primaryRole =
    priority.find((role) => roleKeys.includes(role)) ?? "PARTICIPANT";

  return NAV_BY_ROLE[primaryRole] ?? NAV_BY_ROLE.PARTICIPANT;
}

export function primaryRoleLabel(roleKeys: string[]): string {
  const priority: RoleKey[] = [
    "CEO",
    "COO",
    "CTO",
    "HR_PR",
    "CONTENT_MEDIA",
    "SUPPORT",
    "ACADEMIC",
    "AMBASSADOR",
    "PARTICIPANT",
  ];

  const key =
    priority.find((role) => roleKeys.includes(role)) ?? "PARTICIPANT";

  const labels: Record<RoleKey, string> = {
    CEO: "Chief Executive Officer",
    COO: "Chief Operating Officer",
    CTO: "Chief Technology Officer",
    HR_PR: "HR & PR",
    CONTENT_MEDIA: "Content & Media",
    SUPPORT: "Support",
    ACADEMIC: "Academic Staff",
    AMBASSADOR: "Ambassador",
    PARTICIPANT: "Participant",
  };

  return labels[key];
}
