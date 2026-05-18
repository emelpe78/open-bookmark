<script setup lang="ts">
import { DESKTOP_LOCALHOST_URL } from "#shared/constants/desktop";

const { isElectron } = useDesktopBridge();

const copyUrl = DESKTOP_LOCALHOST_URL;
</script>

<template>
  <ol class="list-decimal space-y-2 pl-5 text-sm text-muted">
    <li>Extension bauen: <code class="text-default">cd extension && npm run build</code></li>
    <li>Chrome öffnen: <code class="text-default">chrome://extensions</code></li>
    <li><strong>Entwicklermodus</strong> aktivieren</li>
    <li><strong>Entpackte Erweiterung laden</strong> → Ordner <code class="text-default">extension/dist</code></li>
    <li>
      In den Extension-Einstellungen die Basis-URL
      <code class="text-default">{{ copyUrl }}</code> eintragen
    </li>
    <li>Host-Zugriff bestätigen, wenn Chrome danach fragt</li>
  </ol>

  <p
    v-if="!isElectron"
    class="mt-3 text-xs text-muted"
  >
    Im Browser-Dev-Modus liegt der Ordner im Repository unter
    <code class="text-default">extension/dist</code>.
  </p>
</template>
