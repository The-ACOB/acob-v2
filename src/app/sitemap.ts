import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
import { db } from "@/lib/db/client";

const siteUrl = getSiteUrl().replace(/\/$/, "");

const STATIC_ROUTES = [
  {
    route: "",
    changeFrequency: "weekly" as const,
    priority: 1,
  },
  {
    route: "/about",
    changeFrequency: "monthly" as const,
    priority: 0.8,
  },
  {
    route: "/olympiads",
    changeFrequency: "daily" as const,
    priority: 0.95,
  },
  {
    route: "/resources",
    changeFrequency: "weekly" as const,
    priority: 0.8,
  },
  {
    route: "/podcasts",
    changeFrequency: "weekly" as const,
    priority: 0.7,
  },
  {
    route: "/ambassadors",
    changeFrequency: "monthly" as const,
    priority: 0.75,
  },
  {
    route: "/careers",
    changeFrequency: "weekly" as const,
    priority: 0.75,
  },
  {
    route: "/contact",
    changeFrequency: "monthly" as const,
    priority: 0.65,
  },
  {
    route: "/verify",
    changeFrequency: "weekly" as const,
    priority: 0.7,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ route, changeFrequency, priority }) => ({
      url: `${siteUrl}${route}`,
      changeFrequency,
      priority,
    }),
  );

  const olympiads = await db.olympiad.findMany({
    where: {
      status: "published",
    },
    select: {
      slug: true,
      updatedAt: true,
      startAt: true,
      endAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const olympiadPages: MetadataRoute.Sitemap = olympiads.map((olympiad) => {
    const isUpcoming = olympiad.startAt !== null && olympiad.startAt > now;

    const isPast = olympiad.endAt !== null && olympiad.endAt < now;

    return {
      url: `${siteUrl}/olympiads/${olympiad.slug}`,
      lastModified: olympiad.updatedAt,
      changeFrequency: isPast ? "monthly" : "weekly",
      priority: isUpcoming ? 0.9 : 0.8,
    };
  });

  return [...staticPages, ...olympiadPages];
}
