<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, Pencil, Trash2, Plus, Shuffle } from 'lucide-vue-next'
import { loadLearningContent, deleteLearningContent, createLearningContent } from '@/entities/learning-content/learningContentStore'
import { loadTags } from '@/entities/tag/tagStore'
import LearningContentRenderer from '@/entities/learning-content/LearningContentRenderer.vue'
import TagFilter, { type TagFilterMode } from '@/features/tag-filter/TagFilter.vue'
import ZipUploadButton from './ZipUploadButton.vue'
import { parseLearningContentFromZip } from './importHelpers'
import { showToast } from '@/app/toast/toastStore'
import { pickRandom } from '@/dumb/random'
import type { LearningContent } from '@/db/LearningContent'
import type { Tag } from '@/db/Tag'

const router = useRouter()
const items = ref<LearningContent[]>([])
const allTags = ref<Tag[]>([])
const filterTags = ref<string[]>([])
const filterMode = ref<TagFilterMode>('any')
const viewModalContent = ref<string>('')
const showViewModal = ref(false)
const uploading = ref(false)
const flashcardFilter = ref<'all' | 'with' | 'without'>('all')
const searchQuery = ref('')

onMounted(async () => {
  items.value = await loadLearningContent()
  allTags.value = await loadTags()
})

const filteredItems = computed(() => {
  let result = items.value

  // Filter by flashcard status
  if (flashcardFilter.value === 'with') {
    result = result.filter(item => item.relatedFlashcards && item.relatedFlashcards.length > 0)
  } else if (flashcardFilter.value === 'without') {
    result = result.filter(item => !item.relatedFlashcards || item.relatedFlashcards.length === 0)
  }

  // Filter by tags
  if (filterTags.value.length > 0) {
    result = result.filter(item => {
      const itemTags = item.tags ?? []
      if (filterMode.value === 'any') {
        return filterTags.value.some(tagId => itemTags.includes(tagId))
      } else if (filterMode.value === 'all') {
        return filterTags.value.every(tagId => itemTags.includes(tagId))
      } else {
        return !filterTags.value.some(tagId => itemTags.includes(tagId))
      }
    })
  }

  // Fuzzy search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item =>
      item.content.toLowerCase().includes(query)
    )
  }

  return result
})

const handleAdd = () => {
  router.push('/learning-content/add')
}

const handleEdit = (id: string) => {
  router.push(`/learning-content/${id}/edit`)
}

const handleView = (content: string) => {
  viewModalContent.value = content
  showViewModal.value = true
}

const handleDelete = async (id: string) => {
  if (!confirm('Delete this learning content?')) return
  await deleteLearningContent(id)
  items.value = await loadLearningContent()
}

const closeModal = () => {
  showViewModal.value = false
}

const handleZipUpload = async (file: File) => {
  uploading.value = true
  try {
    const parsed = await parseLearningContentFromZip(file)
    for (const { content } of parsed) {
      await createLearningContent(content)
    }
    items.value = await loadLearningContent()
  } finally {
    uploading.value = false
  }
}

const handleOpenRandom = () => {
  const withoutFlashcards = items.value.filter(
    (item) => !item.relatedFlashcards || item.relatedFlashcards.length === 0
  )

  const random = pickRandom(withoutFlashcards)
  if (!random) {
    showToast('No learning content without flashcards found', 'info')
    return
  }

  router.push(`/learning-content/${random.id}/edit`)
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">
      Learning Content
    </h1>

    <div class="flex gap-4 mb-4">
      <div class="flex gap-1">
        <button
          class="btn btn-sm"
          :class="{ 'btn-active': flashcardFilter === 'all' }"
          @click="flashcardFilter = 'all'"
        >
          All
        </button>
        <button
          class="btn btn-sm"
          :class="{ 'btn-active': flashcardFilter === 'with' }"
          @click="flashcardFilter = 'with'"
        >
          With Flashcards
        </button>
        <button
          class="btn btn-sm"
          :class="{ 'btn-active': flashcardFilter === 'without' }"
          @click="flashcardFilter = 'without'"
        >
          Without Flashcards
        </button>
      </div>

      <input
        v-model="searchQuery"
        type="text"
        class="input input-sm flex-1"
        placeholder="Search learning content..."
      >
    </div>

    <div
      v-if="allTags.length > 0"
      class="mb-4"
    >
      <TagFilter
        v-model:selected-tags="filterTags"
        v-model:mode="filterMode"
        :all-tags="allTags"
      />
    </div>

    <div class="flex gap-2 mb-4">
      <button
        class="btn btn-primary btn-sm"
        @click="handleAdd"
      >
        <Plus />
        Add Learning Content
      </button>
      <ZipUploadButton
        :loading="uploading"
        @file="handleZipUpload"
      />
      <button
        class="btn btn-sm"
        @click="handleOpenRandom"
      >
        <Shuffle />
        Random without flashcards
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Content</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in filteredItems"
            :key="item.id"
          >
            <td class="truncate max-w-md">
              {{ item.content }}
            </td>
            <td>
              <div class="flex gap-2">
                <button
                  class="btn btn-sm btn-ghost"
                  @click="handleView(item.content)"
                >
                  <Eye />
                </button>
                <button
                  class="btn btn-sm btn-ghost"
                  @click="handleEdit(item.id)"
                >
                  <Pencil />
                </button>
                <button
                  class="btn btn-sm btn-ghost"
                  @click="handleDelete(item.id)"
                >
                  <Trash2 />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <dialog
      :open="showViewModal"
      class="modal"
    >
      <div class="modal-box">
        <LearningContentRenderer :content="viewModalContent" />
        <div class="modal-action">
          <button
            class="btn"
            @click="closeModal"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>
