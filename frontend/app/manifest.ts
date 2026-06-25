import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Smart Site Control",
    short_name: "SSC",
    description: "Industrial Site Management System",

    start_url: "/",
    scope: "/",

    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",

   icons: [
  {
    src: "/icon-192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any"
  },
  {
    src: "/icon-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any"
  }
]
  };
}