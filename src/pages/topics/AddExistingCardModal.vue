<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'

const props = defineProps<{
  open: boolean
  cards: FlashCardDoc[]
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'select', cardId: string): void
}>()

const selected = ref<string>('')

watch(
  () => props.open,
  (open) => {
    if (open) {
      selected.value = props.cards[0]?._id ?? ''
    }
  }
)

const options = computed(() =>
  props.cards.map((card) => ({
    id: card._id,
    label: card.front
  }))
)

const handleAdd = () => {
  if (!selected.value) return
  emit('select', selected.value)
}
</script>

<template>
  <dialog
    class="modal"
    :open="open"
    @close="emit('close')"
  >
    <div class="modal-box space-y-4">
      <h3 class="text-lg font-semibold">
        Add Existing Flashcard
      </h3>
      <div class="form-control">
        <label class="label">
          <span class="label-text">Flashcard</span>
        </label>
        <select
          v-model="selected"
          class="select select-bordered"
        >
          <option
            v-for="option in options"
            :key="option.id"
            :value="option.id"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          class="btn btn-ghost"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          :disabled="!selected"
          @click="handleAdd"
        >
          Add
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
