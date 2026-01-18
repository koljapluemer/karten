<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import highlightjs from 'markdown-it-highlightjs'
import 'github-markdown-css/github-markdown-light.css'
import 'highlight.js/styles/github.css'

const md = new MarkdownIt({
  breaks: true,
  linkify: true
})
md.use(highlightjs, { auto: true })

const props = defineProps<{
  value: string
}>()

const html = computed(() => md.render(props.value))
</script>

<template>
  <div
    class="markdown-body text-left"
    v-html="html"
  />
</template>

<style scoped>
.markdown-body {
  background-color: transparent;
}

.markdown-body :deep(pre) {
  overflow-x: auto;
  max-width: 100%;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  text-align: left;
}
</style>
