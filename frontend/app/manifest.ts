import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LinguaBuild — Language Learning Adventure",
    short_name: "LinguaBuild",
    description: "A quest-map language-learning adventure.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf1d6",
    theme_color: "#ffc93c",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
