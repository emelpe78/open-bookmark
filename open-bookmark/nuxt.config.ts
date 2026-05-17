import { defineNuxtConfig } from "nuxt/config";

// https://nuxt.com/docs/api/configuration/nuxt-config
// Verzeichnisstruktur (Nuxt 4): https://nuxt.com/docs/4.x/guide/directory-structure
export default defineNuxtConfig({
  // Projektroot bleibt srcDir; App-Quellen (pages, components, …) liegen unter dir.app.
  srcDir: ".",

  dir: {
    app: "app",
  },

  app: {
    head: {
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },

  compatibilityDate: "2026-05-01",
});
