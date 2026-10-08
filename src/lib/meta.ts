export const meta = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} · VNS Smart Car Wash` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · VNS Smart Car Wash` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});