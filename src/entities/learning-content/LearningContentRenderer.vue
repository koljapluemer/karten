<script setup lang="ts">
import MarkdownContent from '@/dumb/MarkdownContent.vue'

defineProps<{
  content: string
}>()
</script>

<template>
  <MarkdownContent :value="content" />
</template>
