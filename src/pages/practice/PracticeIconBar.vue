<script setup lang="ts">
import { BookOpen, Pencil, PlusCircle, SkipForward, Trash2 } from 'lucide-vue-next'

defineProps<{
  canEdit: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  (event: 'add-goal'): void
  (event: 'add-flashcard'): void
  (event: 'skip'): void
  (event: 'edit'): void
  (event: 'delete'): void
}>()
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-2">
    <button
      class="btn  btn-square"
      aria-label="Add goal"
      @click="emit('add-goal')"
    >
      <PlusCircle :size="18" />
    </button>
    <button
      class="btn  btn-square"
      aria-label="Add flashcard"
      @click="emit('add-flashcard')"
    >
      <BookOpen :size="18" />
    </button>
    <div class="h-6 w-px bg-base-300 mx-1" />
    <button
      class="btn  btn-square"
      aria-label="Skip"
      @click="emit('skip')"
    >
      <SkipForward :size="18" />
    </button>
    <button
      class="btn  btn-square"
      aria-label="Edit"
      :disabled="!canEdit"
      @click="emit('edit')"
    >
      <Pencil :size="18" />
    </button>
    <button
      class="btn  btn-square text-error"
      aria-label="Delete"
      :disabled="!canDelete"
      @click="emit('delete')"
    >
      <Trash2 :size="18" />
    </button>
  </div>
</template>
