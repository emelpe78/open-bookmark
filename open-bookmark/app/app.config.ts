export default defineAppConfig({
  ui: {
    colors: {
      primary: "green",
      neutral: "slate",
    },
    input: { slots: { root: "w-full" } },
    inputMenu: { slots: { root: "w-full" } },
    textarea: { slots: { root: "w-full" } },
    select: { slots: { base: "w-full" } },
    selectMenu: { slots: { base: "w-full" } },
    formField: { slots: { root: "w-full" } },
  },
});
