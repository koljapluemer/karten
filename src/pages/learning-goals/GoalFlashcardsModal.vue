<script setup lang="ts">
import { computed } from 'vue'
import { Eye, Link2Off, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import MarkdownContent from '@/dumb/MarkdownContent.vue'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import type { LearningGoalDoc } from '@/entities/learning-goals/LearningGoal'

const props = defineProps<{
  open: boolean
  goal: LearningGoalDoc | null
  flashcards: FlashCardDoc[]
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'add'): void
  (event: 'view', cardId: string): void
  (event: 'edit', cardId: string): void
  (event: 'detach', cardId: string): void
  (event: 'delete', cardId: string): void
}>()

const attachedFlashcards = computed(() => {
  if (!props.goal) return []
  const ids = new Set(props.goal.flashcards)
  return props.flashcards.filter((card) => ids.has(card._id))
})
</script>

<template>
  <dialog
    class="modal"
    :open="open"
    @close="emit('close')"
  >
    <div class="modal-box space-y-4 max-w-4xl">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold">
            Flashcards
          </h3>
          <p class="text-sm opacity-70">
            {{ goal?.title || 'Learning Goal' }}
          </p>
        </div>
        <button
          class="btn btn-outline btn-sm"
          @click="emit('add')"
        >
          <Plus :size="16" />
          Add Flashcard
        </button>
      </div>

      <div
        v-if="!attachedFlashcards.length"
        class="text-sm opacity-70"
      >
        No flashcards attached yet.
      </div>

      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Front</th>
              <th>Back</th>
              <th class="text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="card in attachedFlashcards"
              :key="card._id"
            >
              <td class="max-w-xs">
                <div class="max-h-16 overflow-hidden">
                  <MarkdownContent :value="card.front" />
                </div>
              </td>
              <td class="max-w-xs">
                <div class="max-h-16 overflow-hidden">
                  <MarkdownContent :value="card.back" />
                </div>
              </td>
              <td class="text-right">
                <div class="flex justify-end gap-1">
                  <button
                    class="btn btn-ghost btn-xs"
                    @click="emit('view', card._id)"
                  >
                    <Eye :size="16" />
                  </button>
                  <button
                    class="btn btn-ghost btn-xs"
                    @click="emit('edit', card._id)"
                  >
                    <Pencil :size="16" />
                  </button>
                  <button
                    class="btn btn-ghost btn-xs"
                    @click="emit('detach', card._id)"
                  >
                    <Link2Off :size="16" />
                  </button>
                  <button
                    class="btn btn-ghost btn-xs text-error"
                    @click="emit('delete', card._id)"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
