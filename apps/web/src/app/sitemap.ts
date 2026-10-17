import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Public routes only. /lending and /borrowing depend on the wallet state and
// are not indexed.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/como-funciona"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
