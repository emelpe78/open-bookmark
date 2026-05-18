<script setup lang="ts">
const onboardingOpen = ref(false);

onMounted(() => {
  if (import.meta.client && !localStorage.getItem("onboardingComplete")) {
    onboardingOpen.value = true;
  }
});
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <OnboardingModal v-model:open="onboardingOpen" />
  </UApp>
</template>
