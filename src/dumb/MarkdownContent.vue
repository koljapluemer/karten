<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  breaks: true,
  linkify: true
})

const props = defineProps<{
  value: string
}>()

const html = computed(() => md.render(props.value))
</script>

<template>
  <div
    v-html="html"
    class="prose-lg max-w-none"
  />
</template>
