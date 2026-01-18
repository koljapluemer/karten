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
  front: string
  back: string
  showBack?: boolean
  flipped?: boolean
}>()

const frontHtml = computed(() => md.render(props.front))
const backHtml = computed(() => md.render(props.back))

const cardClasses = computed(() => [
  'card',
  'shadow',
  'bg-white',
  'text-gray-900',
  'w-full',
  props.flipped && 'card-flipped'
])
</script>

<template>
  <div
    :class="cardClasses"
    data-theme="light"
  >
    <div class="card-body gap-4">
      <div
        class="markdown-body"
        v-html="frontHtml"
      />
      <div
        v-if="props.showBack"
        class="w-full border-t-2 border-dotted border-base-300 pt-4"
      >
        <div
          class="markdown-body"
          v-html="backHtml"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.card-flipped {
  animation: flipCard 0.4s ease;
}

@keyframes flipCard {
  0% {
    transform: rotateY(0deg);
  }

  50% {
    transform: rotateY(90deg);
  }

  100% {
    transform: rotateY(0deg);
  }
}

.markdown-body {
  background-color: transparent;
}

.markdown-body :deep(*) {
  all: revert;
}

.markdown-body :deep(pre) {
  overflow-x: auto;
  max-width: 100%;
}
</style>
