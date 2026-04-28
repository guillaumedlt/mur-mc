import type { MetadataRoute } from "next";

const SITE_URL = "https://montecarlowork.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/candidat",
          "/candidat/",
          "/recruteur",
          "/recruteur/",
          "/api",
          "/api/",
          "/auth",
          "/auth/",
          "/invitation",
          "/invitation/",
          "/reset-password",
          "/deconnexion",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
