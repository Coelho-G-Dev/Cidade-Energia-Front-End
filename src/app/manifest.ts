import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cidade Energia",
    short_name: "Cidade Energia",
    description: "Sua conta de luz é a sua primeira aula de energia.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#F5F8FC",
    theme_color: "#1E4B9C",
    icons: [
      { src: "/icone.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icone-mascaravel.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
