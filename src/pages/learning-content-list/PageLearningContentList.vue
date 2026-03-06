<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Pencil, Trash2, Plus, Shuffle } from 'lucide-vue-next'
import { loadLearningContent, deleteLearningContent, createLearningContent } from '@/entities/learning-content/learningContentStore'
import { cleanupOrphanedMedia } from '@/entities/media/mediaCleanup'
import FileUploadButton from '@/dumb/FileUploadButton.vue'
import PaginationNav from '@/dumb/PaginationNav.vue'
import { usePagination } from '@/dumb/usePagination'
import { parseLearningContentFromJsonl, parseLearningContentFromZip } from './importHelpers'
import { extractMediaFromZip } from '@/entities/media/zipMediaImport'
import { showToast } from '@/app/toast/toastStore'
import { pickRandom } from '@/dumb/random'
import type { LearningContent } from '@/db/LearningContent'

const router = useRouter()
const route = useRoute()
const items = ref<LearningContent[]>([])
const uploading = ref(false)
const flashcardFilter = ref<'all' | 'with' | 'without'>('all')
const searchQuery = ref('')

const parseFlashcardFilter = (value: unknown): 'all' | 'with' | 'without' => {
  if (value === 'with' || value === 'without' || value === 'all') {
    return value
  }
  return 'all'
}

const parsePageQuery = (value: unknown): number => {
  if (typeof value === 'string') {
    const n = parseInt(value, 10)
    return Number.isNaN(n) || n < 1 ? 1 : n
  }
  return 1
}

const buildQueryFromState = () => {
  const query: Record<string, string | string[]> = {}
  const trimmedSearch = searchQuery.value.trim()
  if (trimmedSearch) {
    query.q = trimmedSearch
  }
  if (flashcardFilter.value !== 'all') {
    query.flash = flashcardFilter.value
  }
  if (currentPage.value > 1) {
    query.page = String(currentPage.value)
  }
  return query
}

const parseQueryToState = (
  query: typeof route.query,
  options?: { setPage: (n: number) => void }
) => {
  searchQuery.value = typeof query.q === 'string' ? query.q : ''
  flashcardFilter.value = parseFlashcardFilter(query.flash)
  const page = parsePageQuery(query.page)
  options?.setPage(page)
}

const isQueryEqual = (left: typeof route.query, right: Record<string, string | string[]>) => {
  const normalize = (query: typeof route.query | Record<string, string | string[]>) => ({
    q: typeof query.q === 'string' ? query.q : '',
    flash: parseFlashcardFilter(query.flash),
    page: parsePageQuery(query.page),
  })

  const leftNormalized = normalize(left)
  const rightNormalized = normalize(right)

  if (leftNormalized.q !== rightNormalized.q) return false
  if (leftNormalized.flash !== rightNormalized.flash) return false
  if (leftNormalized.page !== rightNormalized.page) return false
  return true
}

onMounted(async () => {
  items.value = await loadLearningContent()
  setPage(parsePageQuery(route.query.page))
})

const filteredItems = computed(() => {
  let result = items.value

  // Filter by flashcard status
  if (flashcardFilter.value === 'with') {
    result = result.filter(item => item.relatedFlashcards && item.relatedFlashcards.length > 0)
  } else if (flashcardFilter.value === 'without') {
    result = result.filter(item => !item.relatedFlashcards || item.relatedFlashcards.length === 0)
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

const PAGE_SIZE = 25
const { currentPage, startIndex, endIndex, pageSize } = usePagination(
  () => filteredItems.value.length,
  PAGE_SIZE
)
const paginatedItems = computed(() =>
  filteredItems.value.slice(startIndex.value, endIndex.value)
)

const setPage = (n: number) => {
  currentPage.value = n
}

watch(
  () => route.query,
  (query) => {
    parseQueryToState(query, { setPage })
  },
  { immediate: true }
)

watch(
  [searchQuery, flashcardFilter, currentPage],
  () => {
    const query = buildQueryFromState()
    if (!isQueryEqual(route.query, query)) {
      router.replace({ query })
    }
  },
  { deep: true }
)

const handleAdd = () => {
  router.push({ path: '/learning-content/add', query: route.query })
}

const handleEdit = (id: string) => {
  router.push({ path: `/learning-content/${id}/edit`, query: route.query })
}

const handleDelete = async (id: string) => {
  if (!confirm('Delete this learning content?')) return
  const item = items.value.find(i => i.id === id)
  const mediaToCleanup = item?.mediaIds ?? []
  await deleteLearningContent(id)
  items.value = await loadLearningContent()
  await cleanupOrphanedMedia(mediaToCleanup)
}

const handleJsonlUpload = async (file: File) => {
  uploading.value = true
  try {
    const parsed = await parseLearningContentFromJsonl(file)
    for (const item of parsed) {
      await createLearningContent(item.content, [])
    }
    items.value = await loadLearningContent()
  } finally {
    uploading.value = false
  }
}

const handleZipUpload = async (file: File) => {
  uploading.value = true
  try {
    const { items: parsed, zip } = await parseLearningContentFromZip(file)

    if (zip) {
      // Manifest mode: extract media
      const allMediaPaths: string[] = []
      for (const item of parsed) {
        if (item.media) allMediaPaths.push(...item.media)
      }

      const pathToMediaId = allMediaPaths.length > 0
        ? await extractMediaFromZip(zip, allMediaPaths)
        : new Map<string, string>()

      for (const item of parsed) {
        const mediaIds = (item.media ?? [])
          .map(p => pathToMediaId.get(p))
          .filter((id): id is string => id !== undefined)

        await createLearningContent(item.content, [], mediaIds)
      }
    } else {
      // Legacy mode: text files only
      for (const { content } of parsed) {
        await createLearningContent(content)
      }
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

  router.push({ path: `/learning-content/${random.id}/edit`, query: route.query })
}
</script>

<template>
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

  <div class="flex gap-2 mb-4">
    <button
      class="btn btn-primary btn-sm"
      @click="handleAdd"
    >
      <Plus />
      Add Learning Content
    </button>
    <FileUploadButton
      label="Import JSONL"
      accept=".jsonl"
      :loading="uploading"
      @file="handleJsonlUpload"
    >
      <template #info>
        <h3 class="font-bold text-lg mb-2">
          JSONL Format
        </h3>
        <p class="mb-2">
          One JSON object per line. Each line represents a learning content item.
        </p>
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>content</code></td>
                <td>string, required</td>
                <td>Markdown content</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-sm opacity-70">
          Example:
        </p>
        <pre class="bg-base-200 p-2 rounded text-xs mt-1">{"content": "# Topic\n\nSome markdown..."}
{"content": "# Another\n\nMore content..."}</pre>
      </template>
    </FileUploadButton>
    <FileUploadButton
      label="Import ZIP"
      accept=".zip"
      :loading="uploading"
      @file="handleZipUpload"
    >
      <template #info>
        <h3 class="font-bold text-lg mb-2">
          ZIP Format
        </h3>
        <p class="mb-2">
          Two modes, auto-detected:
        </p>
        <h4 class="font-semibold mt-3 mb-1">
          Legacy mode
        </h4>
        <p class="mb-2">
          ZIP contains <code>.md</code> or <code>.txt</code> files. Each file becomes a learning content item, with the filename as heading.
        </p>
        <h4 class="font-semibold mt-3 mb-1">
          Manifest mode
        </h4>
        <p class="mb-2">
          ZIP contains a <code>content.jsonl</code> file and a <code>media/</code> folder. Activated automatically when <code>content.jsonl</code> is present.
        </p>
        <pre class="bg-base-200 p-2 rounded text-xs mb-3">content.zip
├── content.jsonl
└── media/
    ├── diagram.png
    └── photo.jpg</pre>
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>content</code></td>
                <td>string, required</td>
                <td>Markdown content</td>
              </tr>
              <tr>
                <td><code>media</code></td>
                <td>string[], optional</td>
                <td>Paths to media files (e.g. <code>"media/diagram.png"</code>)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-sm opacity-70">
          Supported media: PNG, JPG, GIF, WebP, SVG, MP3, WAV, OGG, M4A, AAC. Images are compressed to max 1000px width. Audio files must be under 10 MB.
        </p>
      </template>
    </FileUploadButton>
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
          v-for="item in paginatedItems"
          :key="item.id"
        >
          <td class="truncate max-w-md">
            {{ item.content }}
          </td>
          <td>
            <div class="flex gap-2">
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

  <PaginationNav
    :total-items="filteredItems.length"
    :page-size="pageSize"
    :current-page="currentPage"
    @update:current-page="setPage"
  />
</template>
