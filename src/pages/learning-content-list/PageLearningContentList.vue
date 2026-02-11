<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Pencil, Trash2, Plus, Shuffle } from 'lucide-vue-next'
import { loadLearningContent, deleteLearningContent, createLearningContent } from '@/entities/learning-content/learningContentStore'
import { cleanupOrphanedMedia } from '@/entities/media/mediaCleanup'
import { loadTags, getOrCreateTag } from '@/entities/tag/tagStore'
import TagFilter, { type TagFilterMode } from '@/features/tag-filter/TagFilter.vue'
import FileUploadButton from '@/dumb/FileUploadButton.vue'
import { parseLearningContentFromJsonl, parseLearningContentFromZip } from './importHelpers'
import { extractMediaFromZip } from '@/entities/media/zipMediaImport'
import { showToast } from '@/app/toast/toastStore'
import { pickRandom } from '@/dumb/random'
import type { LearningContent } from '@/db/LearningContent'
import type { Tag } from '@/db/Tag'

const router = useRouter()
const route = useRoute()
const items = ref<LearningContent[]>([])
const allTags = ref<Tag[]>([])
const filterTags = ref<string[]>([])
const filterMode = ref<TagFilterMode>('any')
const uploading = ref(false)
const flashcardFilter = ref<'all' | 'with' | 'without'>('all')
const searchQuery = ref('')

const parseTagsQuery = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  if (typeof value === 'string' && value.trim()) {
    return [value]
  }
  return []
}

const parseFilterMode = (value: unknown): TagFilterMode => {
  if (value === 'all' || value === 'any' || value === 'excludes') {
    return value
  }
  return 'any'
}

const parseFlashcardFilter = (value: unknown): 'all' | 'with' | 'without' => {
  if (value === 'with' || value === 'without' || value === 'all') {
    return value
  }
  return 'all'
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
  if (filterMode.value !== 'any') {
    query.mode = filterMode.value
  }
  if (filterTags.value.length > 0) {
    query.tags = filterTags.value
  }
  return query
}

const parseQueryToState = (query: typeof route.query) => {
  searchQuery.value = typeof query.q === 'string' ? query.q : ''
  flashcardFilter.value = parseFlashcardFilter(query.flash)
  filterMode.value = parseFilterMode(query.mode)
  filterTags.value = parseTagsQuery(query.tags)
}

const isQueryEqual = (left: typeof route.query, right: Record<string, string | string[]>) => {
  const normalizeTags = (value: unknown) => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string')
    }
    if (typeof value === 'string' && value.trim()) {
      return [value]
    }
    return []
  }

  const normalize = (query: typeof route.query | Record<string, string | string[]>) => ({
    q: typeof query.q === 'string' ? query.q : '',
    flash: parseFlashcardFilter(query.flash),
    mode: parseFilterMode(query.mode),
    tags: normalizeTags(query.tags),
  })

  const leftNormalized = normalize(left)
  const rightNormalized = normalize(right)

  if (leftNormalized.q !== rightNormalized.q) return false
  if (leftNormalized.flash !== rightNormalized.flash) return false
  if (leftNormalized.mode !== rightNormalized.mode) return false
  if (leftNormalized.tags.length !== rightNormalized.tags.length) return false

  return leftNormalized.tags.every((tag, index) => tag === rightNormalized.tags[index])
}

onMounted(async () => {
  items.value = await loadLearningContent()
  allTags.value = await loadTags()
})

watch(
  () => route.query,
  (query) => {
    parseQueryToState(query)
  },
  { immediate: true }
)

watch(
  [searchQuery, flashcardFilter, filterMode, filterTags],
  () => {
    const query = buildQueryFromState()
    if (!isQueryEqual(route.query, query)) {
      router.replace({ query })
    }
  },
  { deep: true }
)

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

const filteredItemCount = computed(() => filteredItems.value.length)

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
      const tagIds: string[] = []
      if (item.tags) {
        for (const tagContent of item.tags) {
          const tag = await getOrCreateTag(tagContent)
          tagIds.push(tag.id)
        }
      }
      await createLearningContent(item.content, [], tagIds)
    }
    items.value = await loadLearningContent()
    allTags.value = await loadTags()
  } finally {
    uploading.value = false
  }
}

const handleZipUpload = async (file: File) => {
  uploading.value = true
  try {
    const { items: parsed, zip } = await parseLearningContentFromZip(file)

    if (zip) {
      // Manifest mode: extract media and resolve tags
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

        const tagIds: string[] = []
        if (item.tags) {
          for (const tagContent of item.tags) {
            const tag = await getOrCreateTag(tagContent)
            tagIds.push(tag.id)
          }
        }

        await createLearningContent(item.content, [], tagIds, mediaIds)
      }
    } else {
      // Legacy mode: text files only
      for (const { content } of parsed) {
        await createLearningContent(content)
      }
    }

    items.value = await loadLearningContent()
    allTags.value = await loadTags()
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
              <tr>
                <td><code>tags</code></td>
                <td>string[], optional</td>
                <td>Tags (auto-created if new)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-sm opacity-70">
          Example:
        </p>
        <pre class="bg-base-200 p-2 rounded text-xs mt-1">{"content": "# Topic\n\nSome markdown...", "tags": ["science"]}
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
                <td><code>tags</code></td>
                <td>string[], optional</td>
                <td>Tags (auto-created if new)</td>
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

  <div class="text-sm text-gray-500 mb-2">
    Showing {{ filteredItemCount }} learning content items
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
</template>
