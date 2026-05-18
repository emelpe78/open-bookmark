<script setup lang="ts">
import { DESKTOP_LOCALHOST_URL } from "#shared/constants/desktop";
import { GITHUB_RELEASES_URL } from "#shared/constants/releases";

const copyUrl = DESKTOP_LOCALHOST_URL;
</script>

<template>
  <ol class="list-decimal space-y-2 pl-5 text-sm text-muted">
    <li>
      Neueste Extension unter
      <a
        :href="GITHUB_RELEASES_URL"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary underline"
      >GitHub Releases</a>
      herunterladen (Asset
      <code class="text-default">open-bookmark-extension-…zip</code>).
    </li>
    <li>
      ZIP entpacken und den Ordner an einem festen Ort ablegen, z.&nbsp;B.
      <code class="text-default">~/Applications/Open-Bookmark-Extension/</code>
      (der entpackte Ordner muss die <code class="text-default">manifest.json</code> direkt enthalten).
    </li>
    <li>Chrome öffnen: <code class="text-default">chrome://extensions</code></li>
    <li><strong>Entwicklermodus</strong> aktivieren</li>
    <li>
      <strong>Entpackte Erweiterung laden</strong> → den entpackten Ordner wählen (nicht die ZIP-Datei)
    </li>
    <li>
      In den Extension-Einstellungen die Basis-URL
      <code class="text-default">{{ copyUrl }}</code> eintragen
    </li>
    <li>Host-Zugriff bestätigen, wenn Chrome danach fragt</li>
  </ol>
</template>
