<script setup lang="ts">
defineProps<{
  current: number
  goal: number
}>()
</script>

<template>
  <div
    v-if="goal > 0"
    class="w-full h-1.5 opacity-80"
  >
    <progress
      class="progress h-full w-full transition-[width] duration-300"
      :class="current >= goal ? 'progress-success' : 'progress-primary'"
      :value="Math.min(current, goal)"
      :max="goal"
    />
  </div>
</template>
