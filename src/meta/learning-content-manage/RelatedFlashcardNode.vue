<script setup lang="ts">
import { computed, ref } from 'vue'
import { Eye, Pencil, Trash2, Link2Off, Link2, Plus, ChevronDown } from 'lucide-vue-next'
import type { FlashcardNode } from './relatedFlashcardsTypes'

defineOptions({
  name: 'RelatedFlashcardNode'
})

const props = defineProps<{
  node: FlashcardNode
  depth: number
}>()

const emit = defineEmits<{
  view: [card: FlashcardNode['card']]
  edit: [id: string]
  delete: [id: string]
  detach: [{ cardId: string; parentId: string | null }]
  'attach-existing': [parentId: string]
  'create-child': [parentId: string]
}>()

const detailsRef = ref<HTMLDetailsElement | null>(null)
const isOpen = ref(false)

const depthClass = computed(() => {
  if (props.depth <= 0) return ''
  if (props.depth === 1) return 'ml-4'
  if (props.depth === 2) return 'ml-8'
  return 'ml-12'
})

const handleToggle = () => {
  isOpen.value = Boolean(detailsRef.value?.open)
}

const toggleOpen = () => {
  if (!detailsRef.value) return
  detailsRef.value.open = !detailsRef.value.open
  isOpen.value = detailsRef.value.open
}
</script>

<template>
  <div
    class="flex flex-col gap-2"
    :class="depthClass"
  >
    <details
      ref="detailsRef"
      class="collapse bg-base-100"
      @toggle="handleToggle"
    >
      <summary class="collapse-title p-2 list-none marker:content-none">
        <div class="flex items-center gap-2">
          <div class="flex-1 min-w-0">
            <div class="truncate">
              {{ node.card.front }}
            </div>
            <div class="text-light truncate">
              {{ node.card.back }}
            </div>
          </div>
          <div class="flex gap-1 shrink-0">
            <button
              class="btn btn-sm btn-ghost"
              title="View"
              @click.stop="emit('view', node.card)"
            >
              <Eye :size="16" />
            </button>
            <button
              class="btn btn-sm btn-ghost"
              title="Edit"
              @click.stop="emit('edit', node.card.id)"
            >
              <Pencil :size="16" />
            </button>
            <button
              class="btn btn-sm btn-ghost"
              title="Delete"
              @click.stop="emit('delete', node.card.id)"
            >
              <Trash2 :size="16" />
            </button>
            <button
              class="btn btn-sm btn-ghost"
              title="Detach"
              @click.stop="emit('detach', { cardId: node.card.id, parentId: node.parentId })"
            >
              <Link2Off :size="16" />
            </button>
            <button
              class="btn btn-sm btn-ghost"
              title="Attach existing prerequisite"
              @click.stop="emit('attach-existing', node.card.id)"
            >
              <Link2 :size="16" />
            </button>
            <button
              class="btn btn-sm btn-ghost"
              title="Create prerequisite"
              @click.stop="emit('create-child', node.card.id)"
            >
              <Plus :size="16" />
            </button>
            <button
              class="btn btn-sm btn-ghost"
              title="Toggle details"
              type="button"
              @click.stop="toggleOpen"
            >
              <ChevronDown
                :size="16"
                class="transition-transform"
                :class="{ 'rotate-180': isOpen }"
              />
            </button>
          </div>
        </div>
      </summary>
      <div class="collapse-content p-2 pt-0">
        <div
          v-if="node.repeated"
          class="text-light"
        >
          Already listed above.
        </div>
        <div
          v-else-if="node.children.length === 0"
          class="text-light"
        >
          No prerequisites.
        </div>
        <div
          v-else
          class="flex flex-col gap-2"
        >
          <RelatedFlashcardNode
            v-for="child in node.children"
            :key="child.card.id"
            :node="child"
            :depth="depth + 1"
            @view="emit('view', $event)"
            @edit="emit('edit', $event)"
            @delete="emit('delete', $event)"
            @detach="emit('detach', $event)"
            @attach-existing="emit('attach-existing', $event)"
            @create-child="emit('create-child', $event)"
          />
        </div>
      </div>
    </details>
  </div>
</template>
