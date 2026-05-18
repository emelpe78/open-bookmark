/**
 * Ensures the client bundle sees isDesktop when served by the Electron Nitro child
 * (build-time runtimeConfig.public.isDesktop is false in the production .output).
 */
export default defineNitroPlugin((nitroApp) => {
  if (process.env.OPEN_BOOKMARK_DESKTOP !== "1") {
    return;
  }

  nitroApp.hooks.hook("render:html", (html) => {
    const injection = `<script>window.__OPEN_BOOKMARK_DESKTOP__=true</script>`;
    if (html.head.includes(injection)) {
      return;
    }
    html.head.push(injection);
  });
});
