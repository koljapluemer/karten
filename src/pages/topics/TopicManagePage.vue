<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowDown, ArrowUp, Pencil, Plus, PlusCircle, Trash2, Unlink } from 'lucide-vue-next'
import { useTopicsStore } from '@/entities/topics/topicsStore'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import FlashcardRenderer from '@/entities/flashcards/FlashcardRenderer.vue'
import FlashcardModal from '@/features/flashcard-add/FlashcardModal.vue'
import MarkdownContent from '@/dumb/MarkdownContent.vue'
import TopicMaterialModal from './TopicMaterialModal.vue'
import AddExistingCardModal from './AddExistingCardModal.vue'

const route = useRoute()
const topicsStore = useTopicsStore()
const flashcardsStore = useFlashcardsStore()

const topicId = computed(() => String(route.params.id || ''))

const topic = computed(() =>
  topicsStore.topics.find((entry) => entry._id === topicId.value) ?? null
)

const cardsById = computed(() => {
  const map: Record<string, typeof flashcardsStore.flashcards[number]> = {}
  flashcardsStore.flashcards.forEach((card) => {
    map[card._id] = card
  })
  return map
})

const materialModalOpen = ref(false)
const materialEditIndex = ref<number | null>(null)

const existingModalOpen = ref(false)
const targetLevelIndex = ref<number | null>(null)
const newCardType = ref<'declaritive' | 'procedural'>('declaritive')
const newCardModalOpen = ref(false)
const editCardId = ref<string | null>(null)

const availableCards = computed(() => flashcardsStore.flashcards)

const openAddMaterial = () => {
  materialEditIndex.value = null
  materialModalOpen.value = true
}

const openEditMaterial = (index: number) => {
  materialEditIndex.value = index
  materialModalOpen.value = true
}

const handleSaveMaterial = async (content: string) => {
  if (!topic.value) return
  if (materialEditIndex.value === null) {
    await topicsStore.addMaterial(topic.value._id, content)
  } else {
    await topicsStore.updateMaterial(topic.value._id, materialEditIndex.value, content)
  }
  materialModalOpen.value = false
}

const removeMaterial = async (index: number) => {
  if (!topic.value) return
  await topicsStore.removeMaterial(topic.value._id, index)
}

const insertLevelAt = async (index: number) => {
  if (!topic.value) return
  await topicsStore.insertLevel(topic.value._id, index)
}

const removeLevel = async (index: number) => {
  if (!topic.value) return
  await topicsStore.removeLevel(topic.value._id, index)
}

const openAddExisting = (levelIndex: number) => {
  targetLevelIndex.value = levelIndex
  existingModalOpen.value = true
}

const handleAddExisting = async (cardId: string) => {
  if (!topic.value || targetLevelIndex.value === null) return
  await topicsStore.addCardToLevel(topic.value._id, targetLevelIndex.value, cardId)
  existingModalOpen.value = false
}

const openAddNew = (levelIndex: number, type: 'declaritive' | 'procedural') => {
  targetLevelIndex.value = levelIndex
  newCardType.value = type
  newCardModalOpen.value = true
}

const handleAddNew = async (payload: { front: string; back: string }) => {
  if (!topic.value || targetLevelIndex.value === null) return
  const created = await flashcardsStore.createFlashcard(payload.front, payload.back, newCardType.value)
  await topicsStore.addCardToLevel(topic.value._id, targetLevelIndex.value, created._id)
  newCardModalOpen.value = false
}

const moveCard = async (cardId: string, toLevel: number) => {
  if (!topic.value) return
  if (toLevel < 0 || toLevel >= topic.value.levels.length) return
  await topicsStore.moveCardToLevel(topic.value._id, cardId, toLevel)
}

const detachCard = async (cardId: string) => {
  if (!topic.value) return
  await topicsStore.removeCardFromLevels(topic.value._id, cardId)
}

const deleteCard = async (cardId: string) => {
  if (!topic.value) return
  await topicsStore.removeCardFromLevels(topic.value._id, cardId)
  await flashcardsStore.deleteFlashcard(cardId)
}

const handleEditCard = (cardId: string) => {
  editCardId.value = cardId
}

const handleSaveEdit = async (payload: { front: string; back: string }) => {
  if (!editCardId.value) return
  await flashcardsStore.updateFlashcard(editCardId.value, {
    front: payload.front,
    back: payload.back
  })
  editCardId.value = null
}

const levelCards = (level: string[]) =>
  level
    .map((id) => cardsById.value[id])
    .filter((card): card is typeof flashcardsStore.flashcards[number] => Boolean(card))

onMounted(() => {
  topicsStore.loadTopics()
  flashcardsStore.loadFlashcards()
})
</script>

<template>
  <div class="w-full max-w-5xl space-y-10">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold">
          {{ topic?.name.join(' / ') || 'Topic' }}
        </h1>
        <button
          class="btn btn-outline"
          @click="openAddMaterial"
        >
          <Plus :size="18" />
          Add Material
        </button>
      </div>

      <div class="flex gap-4 overflow-x-auto pb-2">
        <div
          v-for="(material, index) in topic?.materials || []"
          :key="`${material}-${index}`"
          class="min-w-[220px] max-w-xs rounded-xl border border-base-300 bg-purple-900 p-4 space-y-3"
        >
          <MarkdownContent :value="material" />
          <div class="flex justify-end gap-2">
            <button
              class="btn btn-ghost btn-sm"
              @click="openEditMaterial(index)"
            >
              Edit
            </button>
            <button
              class="btn btn-ghost btn-sm text-error"
              @click="removeMaterial(index)"
            >
              Delete
            </button>
          </div>
        </div>
        <div
          v-if="!topic?.materials.length"
          class="text-sm opacity-70"
        >
          No materials yet.
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">
          Levels
        </h2>
        <button
          class="btn btn-outline"
          @click="insertLevelAt(topic?.levels.length || 0)"
        >
          <PlusCircle :size="18" />
          Add Level
        </button>
      </div>

      <div class="space-y-4">
        <div
          v-for="(level, levelIndex) in topic?.levels || []"
          :key="`level-${levelIndex}`"
          class="rounded-2xl bg-base-200 p-4 space-y-4"
          :data-level-index="levelIndex"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="text-sm font-semibold">
              Level {{ levelIndex + 1 }}
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                class="btn btn-ghost btn-sm"
                @click="insertLevelAt(levelIndex)"
              >
                Add Above
              </button>
              <button
                class="btn btn-ghost btn-sm"
                @click="insertLevelAt(levelIndex + 1)"
              >
                Add Below
              </button>
              <button
                class="btn btn-ghost btn-sm text-error"
                :disabled="level.length > 0"
                @click="removeLevel(levelIndex)"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>

          <div class="flex flex-wrap gap-3 items-start">
            <div
              v-for="card in levelCards(level)"
              :key="card._id"
              class="rounded-xl border border-base-300 bg-base-100 w-fit"
            >
              <FlashcardRenderer
                :front="card.front"
                :back="card.back"
                :card-type="card.cardType"
                :show-back="card.cardType === 'declaritive'"
              />
              <div class="flex justify-center items-center gap-1 border-t border-base-200 pt-1 w-full">
                <button
                  class="btn btn-ghost btn-square btn-xs"
                  :disabled="levelIndex === 0"
                  aria-label="Move up"
                  @click="moveCard(card._id, levelIndex - 1)"
                >
                  <ArrowUp :size="16" />
                </button>
                <button
                  class="btn btn-ghost btn-square btn-xs"
                  :disabled="levelIndex >= (topic?.levels.length || 0) - 1"
                  aria-label="Move down"
                  @click="moveCard(card._id, levelIndex + 1)"
                >
                  <ArrowDown :size="16" />
                </button>
                <button
                  class="btn btn-ghost btn-square btn-xs"
                  aria-label="Edit"
                  @click="handleEditCard(card._id)"
                >
                  <Pencil :size="16" />
                </button>
                <button
                  class="btn btn-ghost btn-square btn-xs"
                  aria-label="Detach"
                  @click="detachCard(card._id)"
                >
                  <Unlink :size="16" />
                </button>
                <button
                  class="btn btn-ghost btn-square btn-xs text-error"
                  aria-label="Delete"
                  @click="deleteCard(card._id)"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
            <div
              v-if="!levelCards(level).length"
              class="text-sm opacity-70"
            >
              No cards in this level.
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              class="btn btn-outline btn-sm"
              @click="openAddExisting(levelIndex)"
            >
              Add Existing
            </button>
            <button
              class="btn btn-outline btn-sm"
              @click="openAddNew(levelIndex, 'declaritive')"
            >
              Add New Flashcard
            </button>
            <button
              class="btn btn-outline btn-sm"
              @click="openAddNew(levelIndex, 'procedural')"
            >
              Add New Goal
            </button>
          </div>
        </div>

        <div
          v-if="!topic?.levels.length"
          class="text-sm opacity-70"
        >
          No levels yet.
        </div>
      </div>
    </div>
  </div>

  <TopicMaterialModal
    :open="materialModalOpen"
    :title="materialEditIndex === null ? 'Add Material' : 'Edit Material'"
    :submit-label="materialEditIndex === null ? 'Add' : 'Save'"
    :initial-value="materialEditIndex === null ? '' : topic?.materials[materialEditIndex] || ''"
    @close="materialModalOpen = false"
    @save="handleSaveMaterial"
  />

  <AddExistingCardModal
    :open="existingModalOpen"
    :cards="availableCards"
    @close="existingModalOpen = false"
    @select="handleAddExisting"
  />

  <FlashcardModal
    :open="newCardModalOpen"
    title="Add Card"
    submit-label="Save"
    :card-type="newCardType"
    @close="newCardModalOpen = false"
    @save="handleAddNew"
  />

  <FlashcardModal
    v-if="editCardId"
    :open="Boolean(editCardId)"
    title="Edit Card"
    submit-label="Save"
    :card-type="cardsById[editCardId]?.cardType"
    :initial-front="cardsById[editCardId]?.front"
    :initial-back="cardsById[editCardId]?.back"
    @close="editCardId = null"
    @save="handleSaveEdit"
  />
</template>
