import type { MetadataRoute } from "next";
import { listPublishedCourses } from "@/lib/data/catalog";
import { site } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages = ["", "/courses", "/method", "/resources", "/pricing", "/about", "/contact", "/register", "/login", "/privacy", "/terms"];
  const courses = await listPublishedCourses().catch(() => []);
  return [
    ...pages.map((p) => ({
      url: `${site.url}${p}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : p === "/courses" ? 0.9 : 0.6,
    })),
    ...courses.map((c) => ({
      url: `${site.url}/courses/${c.slug}`,
      lastModified: new Date(c.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
