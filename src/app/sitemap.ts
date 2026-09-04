import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();

const ROUTES = [
  "",
  "/about",
  "/olympiads",
  "/resources",
  "/podcasts",
  "/ambassadors",
  "/careers",
  "/contact",
  "/verify",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
