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
    // PNG para quem não aceita SVG na instalação; o iPhone usa o src/app/apple-icon.png.
    icons: [
      { src: "/icone.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icone-mascaravel.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/icone-mascaravel-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icone-mascaravel-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
