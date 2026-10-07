<script setup lang="ts">
import { useSlideContext } from '@slidev/client/context.ts'

const { $page, $nav } = useSlideContext()
</script>

<template>
  <div
    v-if="$page !== 1"
    class="absolute bottom-3 right-4 text-sm text-$foreground opacity-55 pointer-events-none"
  >
    {{ $page }} / {{ $nav.total }}
  </div>
</template>
