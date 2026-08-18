export default function manifest() {
  return {
    name: "Study Timer",
    short_name: "Study Timer",
    description: "Prati koliko učiš, po predmetima, uz Pomodoro režim.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#9c2b43",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
