<script setup lang="ts">
import FlashcardRenderer from '@/entities/flashcards/FlashcardRenderer.vue'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'

defineProps<{
  open: boolean
  card: FlashCardDoc | null
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()
</script>

<template>
  <dialog
    class="modal"
    :open="open"
    @close="emit('close')"
  >
    <div class="modal-box max-w-2xl space-y-4">
      <h3 class="text-lg font-semibold">
        Flashcard Preview
      </h3>
      <div
        v-if="card"
        class="w-full"
      >
        <FlashcardRenderer
          :front="card.front"
          :back="card.back"
          show-back
          flipped
        />
      </div>
      <div
        v-else
        class="text-sm opacity-70"
      >
        Flashcard not found.
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
