import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  modules: ["@nuxt/ui", "@nuxt/icon"],

  pages: true,

  css: ["~/assets/css/main.css"],

  nitro: {
    preset: "node-server",
  },

  runtimeConfig: {
    databasePath: process.env.DATABASE_PATH || "./data/bookmarks.db",
    public: {
      appPort: process.env.APP_PORT || "3777",
      isDesktop: process.env.OPEN_BOOKMARK_DESKTOP === "1",
    },
  },

  devServer: {
    port: Number(process.env.APP_PORT || process.env.PORT) || 3777,
  },

  $production: {
    nitro: {
      env: {
        HOST: process.env.HOST || "127.0.0.1",
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
