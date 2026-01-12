<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { Trash2, Plus } from 'lucide-vue-next'
import { loadFlashcards } from '@/entities/flashcard/flashcardStore'
import { showToast } from '@/app/toast/toastStore'
import type { FlashCardDoc } from '@/entities/flashcard/Flashcard'

const FlashcardAddModal = defineAsyncComponent(() =>
  import('@/features/flashcard-add/FlashcardAddModal.vue')
)

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const allFlashcards = ref<FlashCardDoc[]>([])
const searchQuery = ref('')
const showAddModal = ref(false)

onMounted(async () => {
  console.log('BlockedByManager mounted, loading flashcards')
  allFlashcards.value = await loadFlashcards()
  console.log('BlockedByManager loaded', allFlashcards.value.length, 'flashcards')
})

const blockedFlashcards = computed(() => {
  return props.modelValue
    .map((id) => allFlashcards.value.find((f) => f._id === id))
    .filter((f): f is FlashCardDoc => f !== undefined)
})

const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []

  const query = searchQuery.value.toLowerCase()
  const blocked = new Set(props.modelValue)

  return allFlashcards.value
    .filter((f) => !blocked.has(f._id))
    .filter(
      (f) => f.front.toLowerCase().includes(query) || f.back.toLowerCase().includes(query)
    )
    .slice(0, 5)
})

const handleDetach = (id: string) => {
  emit(
    'update:modelValue',
    props.modelValue.filter((fid) => fid !== id)
  )
  showToast('Flashcard detached', 'info')
}

const handleAttach = (id: string) => {
  if (props.modelValue.includes(id)) return
  emit('update:modelValue', [...props.modelValue, id])
  searchQuery.value = ''
  showToast('Flashcard attached', 'success')
}

const handleCreateNew = () => {
  showAddModal.value = true
}

const handleFlashcardCreated = (flashcard: FlashCardDoc) => {
  allFlashcards.value = [...allFlashcards.value, flashcard]
  handleAttach(flashcard._id)
}
</script>

<template>
  <div class="border-t pt-4">
    <h3 class="font-bold mb-2">
      Prerequisites
    </h3>
    <p class="text-light mb-4">
      Flashcards that must be learned before this one
    </p>

    <div
      v-if="blockedFlashcards.length > 0"
      class="mb-4"
    >
      <div class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Front</th>
              <th>Back</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="card in blockedFlashcards"
              :key="card._id"
            >
              <td class="truncate max-w-xs">
                {{ card.front }}
              </td>
              <td class="truncate max-w-xs">
                {{ card.back }}
              </td>
              <td>
                <button
                  class="btn btn-sm btn-ghost"
                  @click="handleDetach(card._id)"
                >
                  <Trash2 :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <fieldset class="fieldset">
        <label
          for="search-flashcard"
          class="label"
        >Search flashcards</label>
        <input
          id="search-flashcard"
          v-model="searchQuery"
          type="text"
          class="input"
          placeholder="Search by front or back..."
        >
      </fieldset>

      <div
        v-if="searchResults.length > 0"
        class="flex flex-col gap-1"
      >
        <button
          v-for="card in searchResults"
          :key="card._id"
          class="btn btn-sm btn-ghost justify-start"
          @click="handleAttach(card._id)"
        >
          <span class="truncate">{{ card.front }}</span>
          <span class="text-light truncate">{{ card.back }}</span>
        </button>
      </div>

      <button
        class="btn btn-sm"
        @click="handleCreateNew"
      >
        <Plus :size="16" />
        Create New Flashcard
      </button>
    </div>

    <FlashcardAddModal
      v-if="showAddModal"
      :open="showAddModal"
      @close="showAddModal = false"
      @created="handleFlashcardCreated"
    />
  </div>
</template>
