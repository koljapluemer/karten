<script setup lang="ts">
import { Check, Loader2, AlertCircle } from 'lucide-vue-next'
import type { SaveStatus } from './useAutoSave'

defineProps<{
  status: SaveStatus
}>()
</script>

<template>
  <Transition name="fade">
    <span
      v-if="status !== 'idle'"
      :class="{
        'text-base-content/50': status === 'saving',
        'text-success': status === 'saved',
        'text-error': status === 'error'
      }"
    >
      <Loader2
        v-if="status === 'saving'"
        class="w-4 h-4 animate-spin"
      />
      <Check
        v-else-if="status === 'saved'"
        class="w-4 h-4"
      />
      <AlertCircle
        v-else-if="status === 'error'"
        class="w-4 h-4"
      />
    </span>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
