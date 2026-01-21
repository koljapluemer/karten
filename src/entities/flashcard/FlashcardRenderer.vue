<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import highlightjs from 'markdown-it-highlightjs'
import 'github-markdown-css/github-markdown-light.css'
import 'highlight.js/styles/github.css'
import type { Tag } from '@/db/Tag'

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
  tags?: Tag[]
}>()

const frontHtml = computed(() => md.render(props.front))
const backHtml = computed(() => md.render(props.back))

const cardClasses = computed(() => [
  'card',
  'shadow',
  'bg-white',
  'text-gray-900',
  'w-full',
  'text-lg',
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
        v-if="props.tags && props.tags.length > 0"
        class="flex flex-wrap gap-1 pt-2"
      >
        <span
          v-for="tag in props.tags"
          :key="tag.id"
          class="badge badge-soft badge-sm"
        >
          {{ tag.content }}
        </span>
      </div>
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

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  list-style: revert;
  padding: revert;
  margin: revert;
}

.markdown-body :deep(li) {
  display: revert;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #ddd;
  padding-left: 1em;
  margin-left: 0;
  color: #666;
}

.markdown-body :deep(pre) {
  overflow-x: auto;
  max-width: 100%;
}
</style>
