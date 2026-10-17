import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Everything crawlable. Private pages carry noindex in their meta, not a
// Disallow here: a crawler that cannot fetch the page never reads the noindex.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
