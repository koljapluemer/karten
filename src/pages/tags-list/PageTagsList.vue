<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ChevronUp, ChevronDown, Ban } from 'lucide-vue-next'
import { loadTags, updateTagPriority } from '@/entities/tag/tagStore'
import { loadFlashcards, updateFlashcard } from '@/entities/flashcard/flashcardStore'
import { loadLearningContent } from '@/entities/learning-content/learningContentStore'
import { loadLearningProgress } from '@/entities/learning-progress/LearningProgressStore'
import FlashcardStatsBar from '@/features/flashcard-stats-bar/FlashcardStatsBar.vue'
import type { FlashcardCategoryCounts } from '@/features/flashcard-stats-bar/types'
import type { Tag } from '@/db/Tag'
import type { FlashCard } from '@/db/Flashcard'
import type { LearningContent } from '@/db/LearningContent'
import type { LearningProgress } from '@/db/LearningProgress'

const tags = ref<Tag[]>([])
const flashcards = ref<FlashCard[]>([])
const learningContent = ref<LearningContent[]>([])
const learningProgress = ref<LearningProgress[]>([])
const isCopying = ref(false)

const loadData = async () => {
  const [tagsData, flashcardsData, learningContentData, progressData] = await Promise.all([
    loadTags(),
    loadFlashcards(),
    loadLearningContent(),
    loadLearningProgress()
  ])
  tags.value = tagsData
  flashcards.value = flashcardsData
  learningContent.value = learningContentData
  learningProgress.value = progressData
}

onMounted(() => {
  void loadData()
})

const progressMap = computed(() => {
  const map = new Map<string, LearningProgress>()
  learningProgress.value.forEach(p => {
    const flashcardId = p.id.replace('learning-progress:', 'flashcard:')
    map.set(flashcardId, p)
  })
  return map
})

const isCardBlocked = (card: FlashCard): boolean => {
  for (const blockedId of card.blockedBy) {
    const blockedProgress = progressMap.value.get(blockedId)
    if (!blockedProgress) return true
    const blockedDue = new Date(blockedProgress.due)
    if (blockedDue <= new Date()) return true
  }
  return false
}

const computeStatsForCards = (cards: FlashCard[]): FlashcardCategoryCounts => {
  const now = new Date()
  let unseenBlocked = 0
  let unseenNotBlocked = 0
  let dueBlocked = 0
  let dueNotBlocked = 0
  let seenNotDue = 0

  for (const card of cards) {
    const cardProgress = progressMap.value.get(card.id)
    const blocked = isCardBlocked(card)

    if (!cardProgress) {
      if (blocked) {
        unseenBlocked++
      } else {
        unseenNotBlocked++
      }
    } else if (new Date(cardProgress.due) <= now) {
      if (blocked) {
        dueBlocked++
      } else {
        dueNotBlocked++
      }
    } else {
      seenNotDue++
    }
  }

  return { unseenBlocked, unseenNotBlocked, dueBlocked, dueNotBlocked, seenNotDue }
}

interface TagWithCounts {
  tag: Tag
  flashcardCount: number
  learningContentCount: number
  stats: FlashcardCategoryCounts
}

const tagsWithCounts = computed<TagWithCounts[]>(() => {
  return tags.value.map(tag => {
    const tagFlashcards = flashcards.value.filter(fc => fc.tags?.includes(tag.id))
    return {
      tag,
      flashcardCount: tagFlashcards.length,
      learningContentCount: learningContent.value.filter(lc => lc.tags?.includes(tag.id)).length,
      stats: computeStatsForCards(tagFlashcards)
    }
  })
})

const copyTagsFromLearningContent = async () => {
  isCopying.value = true
  try {
    for (const lc of learningContent.value) {
      if (!lc.tags || lc.tags.length === 0) continue

      for (const flashcardId of lc.relatedFlashcards) {
        const flashcard = flashcards.value.find(fc => fc.id === flashcardId)
        if (!flashcard) continue

        const existingTags = flashcard.tags ?? []
        const mergedTags = [...new Set([...existingTags, ...lc.tags])]

        if (mergedTags.length !== existingTags.length) {
          await updateFlashcard(
            flashcard.id,
            flashcard.front,
            flashcard.back,
            flashcard.blockedBy,
            mergedTags
          )
        }
      }
    }
    await loadData()
  } finally {
    isCopying.value = false
  }
}

const decreasePriority = async (tag: Tag) => {
  if (tag.priority <= 0) return
  await updateTagPriority(tag.id, tag.priority - 1)
  await loadData()
}

const increasePriority = async (tag: Tag) => {
  if (tag.priority >= 10) return
  await updateTagPriority(tag.id, tag.priority + 1)
  await loadData()
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">
      Tags
    </h1>

    <div class="mb-4">
      <button
        class="btn btn-secondary"
        :disabled="isCopying"
        @click="copyTagsFromLearningContent"
      >
        {{ isCopying ? 'Copying...' : 'Copy Tags from Learning Content to Flashcards' }}
      </button>
    </div>

    <p
      v-if="tagsWithCounts.length === 0"
      class="text-light"
    >
      No tags yet.
    </p>

    <table
      v-else
      class="table w-full"
    >
      <thead>
        <tr>
          <th>Tag</th>
          <th>Priority</th>
          <th>Learning Content</th>
          <th>Flashcards</th>
          <th class="min-w-48">
            Stats
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in tagsWithCounts"
          :key="item.tag.id"
        >
          <td>{{ item.tag.content }}</td>
          <td>
            <div class="flex items-center gap-1">
              <button
                class="btn btn-ghost btn-xs"
                :disabled="item.tag.priority <= 0"
                @click="decreasePriority(item.tag)"
              >
                <ChevronDown class="w-4 h-4" />
              </button>
              <span
                v-if="item.tag.priority === 10"
                class="w-6 text-center"
              >
                <Ban class="w-4 h-4 inline" />
              </span>
              <span
                v-else
                class="w-6 text-center"
              >
                {{ item.tag.priority }}
              </span>
              <button
                class="btn btn-ghost btn-xs"
                :disabled="item.tag.priority >= 10"
                @click="increasePriority(item.tag)"
              >
                <ChevronUp class="w-4 h-4" />
              </button>
            </div>
          </td>
          <td>{{ item.learningContentCount }}</td>
          <td>{{ item.flashcardCount }}</td>
          <td>
            <FlashcardStatsBar :counts="item.stats" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
