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
  Image as ImageIcon,
  Trophy,
  BarChart3,
  Award,
  FileText,
  GraduationCap,
  Bell,
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

/**
 * Dashboard navigation, entirely driven by role. Nothing here is a
 * permission check by itself (the routes behind these links still
 * enforce their own guards) — this is purely "don't show irrelevant
 * navigation" so each role sees a dashboard shaped around their job,
 * not a shared admin template with everything visible.
 */
const OVERVIEW: NavItem = { href: "/dashboard", label: "Overview", icon: LayoutDashboard };
const NOTIFICATIONS: NavItem = { href: "/dashboard/notifications", label: "Notifications", icon: Bell };

const EXECUTIVE_SECTION: NavSection = {
  label: "Executive",
  items: [
    { href: "/dashboard/approvals", label: "Approvals", icon: CheckSquare },
    { href: "/dashboard/audit", label: "Audit Log", icon: ScrollText },
  ],
};

const COMMAND_CENTER_SECTIONS: NavSection[] = [
  { label: "People", items: [{ href: "/dashboard/participants", label: "Participants", icon: Users }] },
  {
    label: "Olympiads",
    items: [
      { href: "/dashboard/olympiads", label: "Olympiads & Questions", icon: Trophy },
      { href: "/dashboard/results", label: "Results & Rankings", icon: BarChart3 },
    ],
  },
  {
    label: "Recognition",
    items: [
      { href: "/dashboard/certificates", label: "Certificates", icon: Award },
      { href: "/dashboard/recommendation-letters", label: "Recommendation Letters", icon: FileText },
    ],
  },
  {
    label: "Communications",
    items: [
      { href: "/dashboard/contact", label: "Contact Messages", icon: Inbox },
      { href: "/dashboard/support", label: "Support", icon: MessageCircle },
      { href: "/dashboard/popups", label: "Announcements", icon: MonitorPlay },
    ],
  },
  {
    label: "Content & Careers",
    items: [
      { href: "/dashboard/resources", label: "Resources", icon: FileText },
      { href: "/dashboard/study-guides", label: "Study Guides", icon: BookOpen },
      { href: "/dashboard/tutorials", label: "Tutorials", icon: MonitorPlay },
      { href: "/dashboard/podcasts", label: "Podcasts", icon: Mic },
      { href: "/dashboard/careers", label: "Careers", icon: Briefcase },
    ],
  },
];

const NAV_BY_ROLE: Record<RoleKey, NavSection[]> = {
  CEO: [
    { label: "General", items: [OVERVIEW, NOTIFICATIONS] },
    EXECUTIVE_SECTION,
    ...COMMAND_CENTER_SECTIONS,
  ],
  COO: [
    { label: "General", items: [OVERVIEW, NOTIFICATIONS] },
    EXECUTIVE_SECTION,
    ...COMMAND_CENTER_SECTIONS,
  ],
  CTO: [
    { label: "General", items: [OVERVIEW, NOTIFICATIONS] },
    EXECUTIVE_SECTION,
    { label: "Organization", items: [{ href: "/dashboard/participants", label: "Participants", icon: Users }] },
  ],
  HR_PR: [
    { label: "General", items: [OVERVIEW, NOTIFICATIONS] },
    {
      label: "People",
      items: [
        { href: "/dashboard/participants", label: "Participants", icon: Users },
      ],
    },
    {
      label: "Communications",
      items: [
        { href: "/dashboard/contact", label: "Contact Inbox", icon: Inbox },
        { href: "/dashboard/support", label: "Support", icon: MessageCircle },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "/dashboard/careers", label: "Careers", icon: Briefcase },
        { href: "/dashboard/popups", label: "Popup Management", icon: MonitorPlay },
      ],
    },
  ],
  CONTENT_MEDIA: [
    { label: "General", items: [OVERVIEW, NOTIFICATIONS] },
    {
      label: "Media",
      items: [
        { href: "/dashboard/podcasts", label: "Inside Excellence", icon: Mic },
        { href: "/dashboard/study-guides", label: "Study Guides", icon: BookOpen },
        { href: "/dashboard/tutorials", label: "Video Tutorials", icon: MonitorPlay },
        { href: "/dashboard/resources", label: "Resources", icon: FileText },
        { href: "/dashboard/popups", label: "Popup Content", icon: ImageIcon },
      ],
    },
  ],
  SUPPORT: [
    { label: "General", items: [OVERVIEW, NOTIFICATIONS] },
    {
      label: "Support",
      items: [
        { href: "/dashboard/contact", label: "Contact Messages", icon: Inbox },
        { href: "/dashboard/support", label: "Support Conversations", icon: MessageCircle },
      ],
    },
  ],
  ACADEMIC: [
    { label: "General", items: [OVERVIEW, NOTIFICATIONS] },
    {
      label: "Olympiads",
      items: [{ href: "/dashboard/olympiads", label: "Olympiads", icon: Trophy }],
    },
    {
      label: "Recognition",
      items: [
        { href: "/dashboard/certificates", label: "Certificates", icon: Award },
        { href: "/dashboard/recommendation-letters", label: "Recommendation Letters", icon: FileText },
      ],
    },
    {
      label: "Reference",
      items: [{ href: "/dashboard/resources", label: "Resources", icon: GraduationCap }],
    },
  ],
  AMBASSADOR: [
    { label: "General", items: [OVERVIEW, NOTIFICATIONS] },
    {
      label: "Olympiads",
      items: [
        { href: "/dashboard/olympiads", label: "Active Olympiads", icon: Trophy },
        { href: "/dashboard/results", label: "Results", icon: BarChart3 },
      ],
    },
    {
      label: "Referrals",
      items: [
        { href: "/dashboard/register-participant", label: "Register Participant", icon: UserPlus },
        { href: "/dashboard/referrals", label: "Referred Participants", icon: Users },
      ],
    },
    {
      label: "Recognition",
      items: [
        { href: "/dashboard/certificates", label: "Certificates", icon: Award },
        { href: "/dashboard/recommendation-letters", label: "Recommendation Letters", icon: FileText },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
      ],
    },
  ],
  PARTICIPANT: [
    { label: "General", items: [OVERVIEW, NOTIFICATIONS] },
    {
      label: "Olympiads",
      items: [
        { href: "/dashboard/olympiads", label: "Active Olympiads", icon: Trophy },
        { href: "/dashboard/results", label: "Results", icon: BarChart3 },
      ],
    },
    {
      label: "Recognition",
      items: [
        { href: "/dashboard/certificates", label: "Certificates", icon: Award },
        { href: "/dashboard/recommendation-letters", label: "Recommendation Letters", icon: FileText },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
      ],
    },
  ],
};

/** A user's dashboard nav is the union of every role they hold, deduped by href, in a stable role-priority order. */
export function resolveNavSections(roleKeys: string[]): NavSection[] {
  const priority: RoleKey[] = ["CEO", "COO", "CTO", "HR_PR", "CONTENT_MEDIA", "SUPPORT", "ACADEMIC", "AMBASSADOR", "PARTICIPANT"];
  const primaryRole = priority.find((r) => roleKeys.includes(r)) ?? "PARTICIPANT";
  return NAV_BY_ROLE[primaryRole] ?? NAV_BY_ROLE.PARTICIPANT;
}

export function primaryRoleLabel(roleKeys: string[]): string {
  const priority: RoleKey[] = ["CEO", "COO", "CTO", "HR_PR", "CONTENT_MEDIA", "SUPPORT", "ACADEMIC", "AMBASSADOR", "PARTICIPANT"];
  const key = priority.find((r) => roleKeys.includes(r)) ?? "PARTICIPANT";
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
