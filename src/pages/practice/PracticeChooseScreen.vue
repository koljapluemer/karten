<script setup lang="ts">
import { BookOpen, PlusCircle } from 'lucide-vue-next'

const emit = defineEmits<{
  (event: 'practice'): void
  (event: 'add'): void
}>()
</script>

<template>
  <div class="w-full max-w-2xl space-y-6 text-center">
    <h1 class="text-3xl font-semibold">
      What do you want to do?
    </h1>
    <div class="grid gap-4 sm:grid-cols-2">
      <button
        class="btn btn-primary btn-lg flex items-center justify-center gap-2"
        @click="emit('practice')"
      >
        <BookOpen :size="20" />
        Practice Existing
      </button>
      <button
        class="btn btn-outline btn-lg flex items-center justify-center gap-2"
        @click="emit('add')"
      >
        <PlusCircle :size="20" />
        Add Flashcard
      </button>
    </div>
  </div>
</template>
