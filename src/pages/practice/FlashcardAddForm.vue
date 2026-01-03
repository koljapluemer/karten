<script setup lang="ts">
import { computed, ref } from 'vue'
import { MilkdownProvider } from '@milkdown/vue'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import MarkdownEditor from '@/dumb/MarkdownEditor.vue'


const emit = defineEmits<{
  (event: 'added'): void
}>()

const store = useFlashcardsStore()
const front = ref('')
const back = ref('')
const isSaving = ref(false)
const frontKey = ref(0)
const backKey = ref(0)

const canSave = computed(() => front.value.trim().length > 0 && back.value.trim().length > 0)

const resetEditors = () => {
  front.value = ''
  back.value = ''
  frontKey.value += 1
  backKey.value += 1
}

const handleSave = async () => {
  if (!canSave.value || isSaving.value) return
  isSaving.value = true
  try {
    await store.createFlashcard(front.value.trim(), back.value.trim())
    resetEditors()
    emit('added')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-3xl space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-semibold">
        Add Flashcard
      </h2>
    </div>

    <div class="space-y-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Front</span>
        </label>
        <div class="rounded-lg border border-base-300 bg-base-100 p-2">
          <MilkdownProvider>
            <MarkdownEditor
              :key="frontKey"
              v-model="front"
            />
          </MilkdownProvider>
        </div>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Back</span>
        </label>
        <div class="rounded-lg border border-base-300 bg-base-100 p-2">
          <MilkdownProvider>
            <MarkdownEditor
              :key="backKey"
              v-model="back"
            />
          </MilkdownProvider>
        </div>
      </div>
    </div>

    <button
      class="btn btn-primary w-full"
      :disabled="!canSave || isSaving"
      @click="handleSave"
    >
      {{ isSaving ? 'Saving...' : 'Save & Next' }}
    </button>
  </div>
</template>
