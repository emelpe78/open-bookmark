<script setup lang="ts">
type ThemePreference = "light" | "dark" | "system";

const colorMode = useColorMode();

const themeOptions: Array<{ label: string; value: ThemePreference; icon: string }> = [
  { label: "System", value: "system", icon: "i-lucide-monitor" },
  { label: "Hell", value: "light", icon: "i-lucide-sun" },
  { label: "Dunkel", value: "dark", icon: "i-lucide-moon" },
];

const selectedTheme = computed({
  get: () => colorMode.preference as ThemePreference,
  set: (value: ThemePreference) => {
    colorMode.preference = value;
  },
});
</script>

<template>
  <UFormField label="Theme" description="Erscheinungsbild der App" class="w-full">
    <USelectMenu
      v-model="selectedTheme"
      :items="themeOptions"
      value-key="value"
      class="w-full"
    />
  </UFormField>
</template>
