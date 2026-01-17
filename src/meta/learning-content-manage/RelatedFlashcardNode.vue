<script setup lang="ts">
import { computed } from 'vue'
import { Pencil, Trash2, Link2Off, Link2, Plus } from 'lucide-vue-next'
import FlashcardRenderer from '@/entities/flashcard/FlashcardRenderer.vue'
import type { FlashcardNode } from './relatedFlashcardsTypes'

defineOptions({
  name: 'RelatedFlashcardNode'
})

const props = defineProps<{
  node: FlashcardNode
  depth: number
}>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
  detach: [{ cardId: string; parentId: string | null }]
  'attach-existing': [parentId: string]
  'create-child': [parentId: string]
}>()

const depthClass = computed(() => {
  if (props.depth <= 0) return ''
  if (props.depth === 1) return 'ml-8'
  if (props.depth === 2) return 'ml-16'
  return 'ml-24'
})
</script>

<template>
  <div
    class="flex flex-col gap-2"
    :class="depthClass"
  >
    <div class="max-w-md" style="zoom: 0.8;">
      <FlashcardRenderer
        :front="node.card.front"
        :back="node.card.back"
        :instruction="node.card.instruction"
        :show-back="true"
      />
      <div class="flex gap-1 justify-center">
        <button
          class="btn btn-sm btn-ghost"
          title="Edit"
          @click="emit('edit', node.card.id)"
        >
          <Pencil  />
        </button>
        <button
          class="btn btn-sm btn-ghost"
          title="Delete"
          @click="emit('delete', node.card.id)"
        >
          <Trash2  />
        </button>
        <button
          class="btn btn-sm btn-ghost"
          title="Detach"
          @click="emit('detach', { cardId: node.card.id, parentId: node.parentId })"
        >
          <Link2Off  />
        </button>
        <button
          class="btn btn-sm btn-ghost"
          title="Attach existing prerequisite"
          @click="emit('attach-existing', node.card.id)"
        >
          <Link2  />
        </button>
        <button
          class="btn btn-sm btn-ghost"
          title="Create prerequisite"
          @click="emit('create-child', node.card.id)"
        >
          <Plus  />
        </button>
      </div>
    </div>

    <div
      v-if="node.repeated"
      class="text-light text-sm"
    >
      (Already listed above)
    </div>

    <template v-if="!node.repeated && node.children.length > 0">
      <RelatedFlashcardNode
        v-for="child in node.children"
        :key="child.card.id"
        :node="child"
        :depth="depth + 1"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @detach="emit('detach', $event)"
        @attach-existing="emit('attach-existing', $event)"
        @create-child="emit('create-child', $event)"
      />
    </template>
  </div>
</template>
