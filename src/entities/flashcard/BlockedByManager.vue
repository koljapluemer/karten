<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Trash2, Plus } from 'lucide-vue-next'
import { loadFlashcards } from '@/entities/flashcard/flashcardStore'
import { showToast } from '@/app/toast/toastStore'
import type { FlashCard } from '@/db/Flashcard'

const router = useRouter()
const route = useRoute()

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const allFlashcards = ref<FlashCard[]>([])
const searchQuery = ref('')

onMounted(async () => {
  console.log('BlockedByManager mounted, loading flashcards')
  allFlashcards.value = await loadFlashcards()
  console.log('BlockedByManager loaded', allFlashcards.value.length, 'flashcards')
})

const blockedFlashcards = computed(() => {
  return props.modelValue
    .map((id) => allFlashcards.value.find((f) => f.id === id))
    .filter((f): f is FlashCard => f !== undefined)
})

const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []

  const query = searchQuery.value.toLowerCase()
  const blocked = new Set(props.modelValue)

  return allFlashcards.value
    .filter((f) => !blocked.has(f.id))
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
  router.push({
    path: '/flashcards/add',
    query: {
      returnTo: route.fullPath,
      context: 'prerequisite-creation'
    }
  })
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
              :key="card.id"
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
                  @click="handleDetach(card.id)"
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
          :key="card.id"
          class="btn btn-sm btn-ghost justify-start"
          @click="handleAttach(card.id)"
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
  </div>
</template>
