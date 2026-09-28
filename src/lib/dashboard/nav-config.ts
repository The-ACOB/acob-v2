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
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import type { Permission } from "@/lib/authz/permissions";
import type { RoleKey } from "@/lib/authz/roles";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permissions?: Permission[];
  roles?: RoleKey[];
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

const OVERVIEW: NavItem = {
  href: "/dashboard",
  label: "Overview",
  icon: LayoutDashboard,
};

const NOTIFICATIONS: NavItem = {
  href: "/dashboard/notifications",
  label: "Notifications",
  icon: Bell,
  permissions: ["notifications:view"],
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
  permissions: ["user:view"],
};

const PARTICIPANTS: NavItem = {
  href: "/dashboard/participants",
  label: "Participants",
  icon: Users,
  permissions: ["participant:view"],
};

const APPROVALS: NavItem = {
  href: "/dashboard/approvals",
  label: "Approvals",
  icon: CheckSquare,
  permissions: ["approval:view"],
};

const AUDIT_LOG: NavItem = {
  href: "/dashboard/audit",
  label: "Audit Log",
  icon: ScrollText,
  roles: ["CEO", "COO", "CTO"],
};

const ROLE_CONTROLS: NavItem = {
  href: "/dashboard/role-controls",
  label: "Role Controls",
  icon: ShieldCheck,
  roles: ["CEO", "COO", "CTO"],
};

const OLYMPIADS: NavItem = {
  href: "/dashboard/olympiads",
  label: "Olympiads",
  icon: Trophy,
  permissions: ["olympiad:create", "olympiad:results:view"],
  roles: ["AMBASSADOR", "PARTICIPANT"],
};

const QUESTION_ARCHIVE: NavItem = {
  href: "/dashboard/question-archive",
  label: "Question Archive",
  icon: Archive,
  permissions: ["question:create"],
};

const RESULTS: NavItem = {
  href: "/dashboard/results",
  label: "Results & Rankings",
  icon: BarChart3,
  permissions: ["olympiad:results:view"],
};

const PAYMENT_APPROVALS: NavItem = {
  href: "/dashboard/payment-approvals",
  label: "Payment Approvals",
  icon: CreditCard,
  permissions: ["payment:view"],
};

const CERTIFICATES: NavItem = {
  href: "/dashboard/certificates",
  label: "Certificates",
  icon: Award,
  permissions: ["certificate:view"],
};

const RECOMMENDATION_LETTERS: NavItem = {
  href: "/dashboard/recommendation-letters",
  label: "Recommendation Letters",
  icon: FileText,
  permissions: ["recommendation_letter:view"],
};

const CONTACT_MESSAGES: NavItem = {
  href: "/dashboard/contact",
  label: "Contact Messages",
  icon: Inbox,
  permissions: ["contact:view"],
};

const SUPPORT: NavItem = {
  href: "/dashboard/support",
  label: "Support",
  icon: MessageCircle,
  permissions: ["support:view"],
};

const ANNOUNCEMENTS: NavItem = {
  href: "/dashboard/popups",
  label: "Announcements",
  icon: Megaphone,
  permissions: ["popup:manage"],
};

const RESOURCES: NavItem = {
  href: "/dashboard/resources",
  label: "Resources",
  icon: FileText,
  permissions: [
    "content:create",
    "content:update",
    "content:publish",
    "content:delete",
  ],
};

const STUDY_GUIDES: NavItem = {
  href: "/dashboard/study-guides",
  label: "Study Guides",
  icon: BookOpen,
  permissions: [
    "content:create",
    "content:update",
    "content:publish",
    "content:delete",
  ],
};

const TUTORIALS: NavItem = {
  href: "/dashboard/tutorials",
  label: "Tutorials",
  icon: MonitorPlay,
  permissions: [
    "content:create",
    "content:update",
    "content:publish",
    "content:delete",
  ],
};

const PODCASTS: NavItem = {
  href: "/dashboard/podcasts",
  label: "Podcasts",
  icon: Mic,
  permissions: ["podcast:create", "podcast:update", "podcast:delete"],
};

const CAREERS: NavItem = {
  href: "/dashboard/careers",
  label: "Careers",
  icon: Briefcase,
  permissions: ["career:create", "career:update", "career:delete"],
};

const REGISTER_PARTICIPANT: NavItem = {
  href: "/dashboard/register-participant",
  label: "Register Participant",
  icon: UserPlus,
  permissions: ["participant:create"],
};

const REFERRED_PARTICIPANTS: NavItem = {
  href: "/dashboard/referrals",
  label: "Referred Participants",
  icon: Users,
  permissions: ["participant:referrals:view"],
};

const MESSAGES: NavItem = {
  href: "/dashboard/messages",
  label: "Messages",
  icon: MessageCircle,
};

const GENERAL_SECTION: NavSection = {
  label: "General",
  items: [OVERVIEW, NOTIFICATIONS, MY_PROFILE],
};

const PEOPLE_SECTION: NavSection = {
  label: "People",
  items: [ORGANISATION_TEAM, PARTICIPANTS],
};

const EXECUTIVE_SECTION: NavSection = {
  label: "Executive",
  items: [APPROVALS, AUDIT_LOG, ROLE_CONTROLS],
};

const OLYMPIADS_SECTION: NavSection = {
  label: "Olympiads",
  items: [OLYMPIADS, QUESTION_ARCHIVE, RESULTS],
};

const FINANCE_SECTION: NavSection = {
  label: "Finance",
  items: [PAYMENT_APPROVALS],
};

const RECOGNITION_SECTION: NavSection = {
  label: "Recognition",
  items: [CERTIFICATES, RECOMMENDATION_LETTERS],
};

const COMMUNICATIONS_SECTION: NavSection = {
  label: "Communications",
  items: [CONTACT_MESSAGES, SUPPORT, ANNOUNCEMENTS],
};

const CONTENT_SECTION: NavSection = {
  label: "Content",
  items: [RESOURCES, STUDY_GUIDES, TUTORIALS, PODCASTS],
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

const NAV_BY_ROLE: Record<RoleKey, NavSection[]> = {
  CEO: [
    GENERAL_SECTION,
    PEOPLE_SECTION,
    EXECUTIVE_SECTION,
    OLYMPIADS_SECTION,
    FINANCE_SECTION,
    RECOGNITION_SECTION,
    COMMUNICATIONS_SECTION,
    CONTENT_SECTION,
    CAREERS_SECTION,
  ],

  COO: [
    GENERAL_SECTION,
    PEOPLE_SECTION,
    EXECUTIVE_SECTION,
    OLYMPIADS_SECTION,
    FINANCE_SECTION,
    RECOGNITION_SECTION,
    COMMUNICATIONS_SECTION,
    CONTENT_SECTION,
    CAREERS_SECTION,
  ],

  CTO: [
    GENERAL_SECTION,
    PEOPLE_SECTION,
    EXECUTIVE_SECTION,
    OLYMPIADS_SECTION,
    FINANCE_SECTION,
    RECOGNITION_SECTION,
    COMMUNICATIONS_SECTION,
    CONTENT_SECTION,
    CAREERS_SECTION,
  ],

  HR_PR: [
    GENERAL_SECTION,
    {
      label: "People",
      items: [PARTICIPANTS],
    },
    {
      label: "Communications",
      items: [CONTACT_MESSAGES, SUPPORT, ANNOUNCEMENTS],
    },
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
    {
      label: "Communications",
      items: [CONTACT_MESSAGES, SUPPORT],
    },
  ],

  ACADEMIC: [
    GENERAL_SECTION,
    OLYMPIADS_SECTION,
    FINANCE_SECTION,
    RECOGNITION_SECTION,
    {
      label: "Content",
      items: [RESOURCES],
    },
  ],

  AMBASSADOR: [
    GENERAL_SECTION,
    {
      label: "Olympiads",
      items: [OLYMPIADS, RESULTS],
    },
    REFERRALS_SECTION,
    RECOGNITION_SECTION,
    ACCOUNT_SECTION,
  ],

  PARTICIPANT: [
    GENERAL_SECTION,
    {
      label: "Olympiads",
      items: [OLYMPIADS, RESULTS],
    },
    RECOGNITION_SECTION,
    ACCOUNT_SECTION,
  ],
};

function hasAccess(
  item: NavItem,
  roleKeys: string[],
  permissions: Set<string>,
): boolean {
  if (item.roles?.some((role) => roleKeys.includes(role))) {
    return true;
  }

  if (!item.permissions?.length) {
    return true;
  }

  return item.permissions.some((permission) => permissions.has(permission));
}

export function resolveNavSections(
  roleKeys: string[],
  permissionKeys: string[] = [],
): NavSection[] {
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

  const sections = NAV_BY_ROLE[primaryRole] ?? NAV_BY_ROLE.PARTICIPANT;
  const permissions = new Set(permissionKeys);

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        hasAccess(item, roleKeys, permissions),
      ),
    }))
    .filter((section) => section.items.length > 0);
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

  const key = priority.find((role) => roleKeys.includes(role)) ?? "PARTICIPANT";

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
