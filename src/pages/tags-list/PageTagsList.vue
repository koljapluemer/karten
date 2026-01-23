<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { loadTags } from '@/entities/tag/tagStore'
import { loadFlashcards } from '@/entities/flashcard/flashcardStore'
import { loadLearningContent } from '@/entities/learning-content/learningContentStore'
import type { Tag } from '@/db/Tag'
import type { FlashCard } from '@/db/Flashcard'
import type { LearningContent } from '@/db/LearningContent'

const tags = ref<Tag[]>([])
const flashcards = ref<FlashCard[]>([])
const learningContent = ref<LearningContent[]>([])

onMounted(async () => {
  tags.value = await loadTags()
  flashcards.value = await loadFlashcards()
  learningContent.value = await loadLearningContent()
})

interface TagWithCounts {
  tag: Tag
  flashcardCount: number
  learningContentCount: number
}

const tagsWithCounts = computed<TagWithCounts[]>(() => {
  return tags.value.map(tag => ({
    tag,
    flashcardCount: flashcards.value.filter(fc => fc.tags?.includes(tag.id)).length,
    learningContentCount: learningContent.value.filter(lc => lc.tags?.includes(tag.id)).length
  }))
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">
      Tags
    </h1>

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
          <th>Learning Content</th>
          <th>Flashcards</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in tagsWithCounts"
          :key="item.tag.id"
        >
          <td>{{ item.tag.content }}</td>
          <td>{{ item.learningContentCount }}</td>
          <td>{{ item.flashcardCount }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
