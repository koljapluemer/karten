<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { loadFlashcards } from '@/entities/flashcard/flashcardStore'
import { loadLearningProgress } from '@/entities/learning-progress/LearningProgressStore'
import { loadTags } from '@/entities/tag/tagStore'
import FlashcardRenderer from '@/entities/flashcard/FlashcardRenderer.vue'
import type { FlashCard } from '@/db/Flashcard'
import type { LearningProgress } from '@/db/LearningProgress'
import type { Tag } from '@/db/Tag'

interface FloatingCard {
  instanceId: number
  card: FlashCard
  tags: Tag[]
  y: number
  duration: number
  scale: number
}

let nextInstanceId = 0

const flashcards = ref<FlashCard[]>([])
const allTags = ref<Tag[]>([])
const progressMap = ref<Map<string, LearningProgress>>(new Map())
const isLoading = ref(true)
const floatingCards = ref<FloatingCard[]>([])
let spawnTimers: ReturnType<typeof setTimeout>[] = []

const defaultMax = window.innerWidth < 768 ? 4 : 12
const maxCards = ref(defaultMax)

const cardPool = computed<FlashCard[]>(() => {
  const now = new Date()
  const dueCards = flashcards.value.filter((c) => {
    const progress = progressMap.value.get(c.id)
    if (progress?.isDisabled || progress?.isArchived) return false
    if (!progress) return true // unseen cards are eligible
    return new Date(progress.due) <= now
  })
  if (dueCards.length > 0) return dueCards
  // Fall back to all non-disabled cards
  return flashcards.value.filter((c) => {
    const progress = progressMap.value.get(c.id)
    return !progress?.isDisabled
  })
})

function getTagsForCard(card: FlashCard): Tag[] {
  if (!card.tags || card.tags.length === 0) return []
  return allTags.value.filter((t) => card.tags.includes(t.id))
}

function spawnCard(): FloatingCard | null {
  if (cardPool.value.length === 0) return null
  const card = cardPool.value[Math.floor(Math.random() * cardPool.value.length)]!
  return {
    instanceId: nextInstanceId++,
    card,
    tags: getTagsForCard(card),
    y: Math.random() * 80,
    duration: 15 + Math.random() * 15,
    scale: 0.7 + Math.random() * 0.3
  }
}

function onAnimationEnd(instanceId: number) {
  floatingCards.value = floatingCards.value.filter((fc) => fc.instanceId !== instanceId)
  if (floatingCards.value.length < maxCards.value) {
    const newCard = spawnCard()
    if (newCard) {
      floatingCards.value.push(newCard)
    }
  }
}

watch(maxCards, (newMax) => {
  const deficit = newMax - floatingCards.value.length
  for (let i = 0; i < deficit; i++) {
    const fc = spawnCard()
    if (fc) floatingCards.value.push(fc)
  }
})

onMounted(async () => {
  const [cards, progressDocs, tags] = await Promise.all([
    loadFlashcards(),
    loadLearningProgress(),
    loadTags()
  ])
  flashcards.value = cards
  allTags.value = tags
  const map = new Map<string, LearningProgress>()
  progressDocs.forEach((p) => {
    const flashcardId = p.id.replace('learning-progress:', 'flashcard:')
    map.set(flashcardId, p)
  })
  progressMap.value = map
  isLoading.value = false

  // Spawn cards with staggered delays
  const count = Math.min(maxCards.value, cardPool.value.length)

  for (let i = 0; i < count; i++) {
    const timer = setTimeout(() => {
      const fc = spawnCard()
      if (fc) floatingCards.value.push(fc)
    }, i * 800)
    spawnTimers.push(timer)
  }
})

onUnmounted(() => {
  spawnTimers.forEach(clearTimeout)
})
</script>

<template>
  <div class="float-container">
    <div class="slider-control">
      <input
        v-model.number="maxCards"
        type="range"
        min="1"
        max="20"
        class="range range-xs"
      >
      <span class="text-xs text-base-content/60">{{ maxCards }}</span>
    </div>
    <div
      v-if="isLoading"
      class="flex items-center justify-center h-full"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>
    <div
      v-else-if="cardPool.length === 0"
      class="flex items-center justify-center h-full text-base-content/60"
    >
      No cards available.
    </div>
    <div
      v-for="fc in floatingCards"
      :key="fc.instanceId"
      class="floating-card"
      :style="{
        top: fc.y + '%',
        animationDuration: fc.duration + 's',
        transform: 'scale(' + fc.scale + ')',
      }"
      @animationend="onAnimationEnd(fc.instanceId)"
    >
      <FlashcardRenderer
        :front="fc.card.front"
        :back="fc.card.back"
        :show-back="true"
        :tags="fc.tags"
      />
    </div>
  </div>
</template>

<style scoped>
.float-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.slider-control {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  pointer-events: auto;
  z-index: 10;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.slider-control:hover {
  opacity: 1;
}

.slider-control .range {
  width: 100px;
}

.floating-card {
  position: absolute;
  width: 280px;
  max-height: 400px;
  overflow: hidden;
  opacity: 0.85;
  pointer-events: none;
  animation-name: floatAcross;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@media (min-width: 640px) {
  .floating-card {
    width: 320px;
  }
}

@keyframes floatAcross {
  from {
    left: 100%;
  }
  to {
    left: -500px;
  }
}
</style>
