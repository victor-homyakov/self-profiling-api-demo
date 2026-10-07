<script setup lang="ts">
import { useSlideContext } from '@slidev/client/context.ts'

const { $page, $nav } = useSlideContext()
</script>

<template>
  <div
    v-if="$page !== 1"
    class="absolute bottom-4 right-5 text-[0.8rem] tracking-wide pointer-events-none"
    style="color: var(--muted); font-family: var(--slidev-code-font-family, ui-monospace, monospace)"
  >
    {{ $page }} / {{ $nav.total }}
  </div>
</template>
