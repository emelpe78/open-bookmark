import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  modules: ["@nuxt/ui", "@nuxt/icon"],

  pages: true,

  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    databasePath: process.env.DATABASE_PATH || "./data/bookmarks.db",
    public: {
      appPort: process.env.APP_PORT || "3777",
    },
  },

  devServer: {
    port: Number(process.env.APP_PORT || process.env.PORT) || 3777,
  },

  $production: {
    nitro: {
      env: {
        PORT: process.env.APP_PORT || process.env.PORT || "3777",
      },
    },
  },

  serverExternalPackages: ["better-sqlite3"],

  app: {
    head: {
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },

  compatibilityDate: "2026-05-01",
});
