/** SQLite file used only by `npm run dev` (web). Never used by the desktop child process. */
export const WEB_DEV_DATABASE_PATH = "./data/bookmarks.db";

export function isDesktopRuntimeEnv(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.OPEN_BOOKMARK_DESKTOP === "1";
}
