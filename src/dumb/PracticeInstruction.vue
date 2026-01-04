<script setup lang="ts">
defineProps<{
  text: string
}>()
</script>

<template>
  <div class="text-center text-xl font-semibold">
    {{ text }}
  </div>
</template>
