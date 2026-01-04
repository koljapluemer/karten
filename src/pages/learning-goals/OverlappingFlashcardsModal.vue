<script setup lang="ts">
import { computed } from 'vue'
import { Link2Off, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import FlashcardRenderer from '@/entities/flashcards/FlashcardRenderer.vue'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'

const props = defineProps<{
  open: boolean
  card: FlashCardDoc | null
  flashcards: FlashCardDoc[]
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'add'): void
  (event: 'edit', cardId: string): void
  (event: 'detach', cardId: string): void
  (event: 'delete', cardId: string): void
}>()

const overlappingCards = computed(() => {
  if (!props.card) return []
  const ids = new Set(props.card.overlapping ?? [])
  return props.flashcards.filter((item) => ids.has(item._id))
})
</script>

<template>
  <dialog
    class="modal"
    :open="open"
    @close="emit('close')"
  >
    <div class="modal-box space-y-4 max-w-5xl">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold">
            Overlapping Flashcards
          </h3>
          <p class="text-sm opacity-70">
            {{ card?.front || 'Flashcard' }}
          </p>
        </div>
        <button
          class="btn btn-outline btn-sm"
          @click="emit('add')"
        >
          <Plus :size="16" />
          Add Overlap
        </button>
      </div>

      <div
        v-if="!overlappingCards.length"
        class="text-sm opacity-70"
      >
        No overlapping flashcards yet.
      </div>

      <div
        v-else
        class="grid gap-4 sm:grid-cols-2"
      >
        <div
          v-for="item in overlappingCards"
          :key="item._id"
          class="space-y-2"
        >
          <div class="flex items-center gap-2">
            <button
              class="btn btn-ghost btn-xs"
              @click="emit('edit', item._id)"
            >
              <Pencil :size="16" />
            </button>
            <button
              class="btn btn-ghost btn-xs"
              @click="emit('detach', item._id)"
            >
              <Link2Off :size="16" />
            </button>
            <button
              class="btn btn-ghost btn-xs text-error"
              @click="emit('delete', item._id)"
            >
              <Trash2 :size="16" />
            </button>
          </div>
          <div
            class="w-fit origin-top-left"
            style="zoom: 0.5;"
          >
            <FlashcardRenderer
              :front="item.front"
              :back="item.back"
              show-back
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <button
          class="btn btn-ghost"
          @click="emit('close')"
        >
          Close
        </button>
      </div>
    </div>
    <form
      method="dialog"
      class="modal-backdrop"
      @click.prevent="emit('close')"
    >
      <button aria-label="Close">
        close
      </button>
    </form>
  </dialog>
</template>
