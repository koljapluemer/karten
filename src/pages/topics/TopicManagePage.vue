<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Circle,
  Eye,
  LayoutGrid,
  LayoutList,
  Pencil,
  Plus,
  PlusCircle,
  Trash2,
  Unlink,
  XCircle
} from 'lucide-vue-next'
import { useTopicsStore } from '@/entities/topics/topicsStore'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import { useProgressStore } from '@/entities/progress/progressStore'
import { useMaterialsStore } from '@/entities/materials/materialsStore'
import { buildProgressIndex, getDeclarativeDueLabel } from '@/entities/progress/progressHelpers'
import FlashcardRenderer from '@/entities/flashcards/FlashcardRenderer.vue'
import FlashcardModal from '@/features/flashcard-add/FlashcardModal.vue'
import TopicMaterialModal from './TopicMaterialModal.vue'
import AddExistingCardModal from './AddExistingCardModal.vue'
import ZipUploadButton from '@/dumb/ZipUploadButton.vue'
import { parseMaterialsFromZip, parseFlashcardsFromZip } from './importHelpers'

const route = useRoute()
const topicsStore = useTopicsStore()
const flashcardsStore = useFlashcardsStore()
const progressStore = useProgressStore()
const materialsStore = useMaterialsStore()

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

const materialsById = computed(() => {
  const map: Record<string, typeof materialsStore.materials[number]> = {}
  materialsStore.materials.forEach((material) => {
    map[material._id] = material
  })
  return map
})

const topicMaterials = computed(() =>
  (topic.value?.materials || [])
    .map((id) => materialsById.value[id])
    .filter((m): m is typeof materialsStore.materials[number] => Boolean(m))
)

const materialModalOpen = ref(false)
const materialEditId = ref<string | null>(null)

const existingModalOpen = ref(false)
const targetLevelIndex = ref<number | null>(null)
const newCardType = ref<'declaritive' | 'procedural'>('declaritive')
const newCardModalOpen = ref(false)
const editCardId = ref<string | null>(null)
const viewMode = ref<'card' | 'table'>('card')
const previewCardId = ref<string | null>(null)

const availableCards = computed(() => flashcardsStore.flashcards)

const openAddMaterial = () => {
  materialEditId.value = null
  materialModalOpen.value = true
}

const openEditMaterial = (materialId: string) => {
  materialEditId.value = materialId
  materialModalOpen.value = true
}

const handleSaveMaterial = async (content: string) => {
  if (!topic.value) return
  if (materialEditId.value === null) {
    const created = await materialsStore.createMaterial(content, 'text')
    await topicsStore.addMaterialId(topic.value._id, created._id)
  } else {
    await materialsStore.updateMaterial(materialEditId.value, { content })
  }
  materialModalOpen.value = false
}

const removeMaterial = async (materialId: string) => {
  if (!topic.value) return
  await topicsStore.removeMaterialId(topic.value._id, materialId)
  await materialsStore.deleteMaterial(materialId)
}

const handleMaterialsZipUpload = async (file: File) => {
  if (!topic.value) return
  const parsed = await parseMaterialsFromZip(file)
  for (const { content, format } of parsed) {
    const created = await materialsStore.createMaterial(content, format)
    await topicsStore.addMaterialId(topic.value._id, created._id)
  }
}

const handleFlashcardsZipUpload = async (file: File, levelIndex: number) => {
  if (!topic.value) return
  const parsed = await parseFlashcardsFromZip(file)
  for (const card of parsed) {
    const created = await flashcardsStore.createFlashcard(
      card.front,
      card.back,
      card.cardType,
      card.instruction || '',
      card.requiresLearning || [],
      card.overlapping || []
    )
    await topicsStore.addCardToLevel(topic.value._id, levelIndex, created._id)
  }
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

const handleAddNew = async (payload: { front: string; back: string; instruction: string }) => {
  if (!topic.value || targetLevelIndex.value === null) return
  const created = await flashcardsStore.createFlashcard(
    payload.front,
    payload.back,
    newCardType.value,
    payload.instruction
  )
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

const handleSaveEdit = async (payload: { front: string; back: string; instruction: string }) => {
  if (!editCardId.value) return
  await flashcardsStore.updateFlashcard(editCardId.value, {
    front: payload.front,
    back: payload.back,
    instruction: payload.instruction
  })
  editCardId.value = null
}

const levelCards = (level: string[]) =>
  level
    .map((id) => cardsById.value[id])
    .filter((card): card is typeof flashcardsStore.flashcards[number] => Boolean(card))

const progressIndex = computed(() => buildProgressIndex(progressStore.progress))

const goalAchieved = (cardId: string): boolean | null => {
  return progressIndex.value[cardId]?.procedural?.isAchieved ?? null
}

const declarativeDueLabel = (cardId: string): string =>
  getDeclarativeDueLabel(progressIndex.value[cardId]?.declarative ?? null)

const previewCard = computed(() => {
  if (!previewCardId.value) return null
  return cardsById.value[previewCardId.value] ?? null
})

onMounted(() => {
  topicsStore.loadTopics()
  flashcardsStore.loadFlashcards()
  progressStore.loadProgress()
  materialsStore.loadMaterials()
})
</script>

<template>
  <div class="w-full max-w-5xl space-y-10">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">
        {{ topic?.name.join(' / ') || 'Topic' }}
      </h1>
      <div class="join">
        <button
          class="btn btn-sm join-item"
          :class="{ 'btn-active': viewMode === 'card' }"
          @click="viewMode = 'card'"
        >
          <LayoutGrid :size="16" />
        </button>
        <button
          class="btn btn-sm join-item"
          :class="{ 'btn-active': viewMode === 'table' }"
          @click="viewMode = 'table'"
        >
          <LayoutList :size="16" />
        </button>
      </div>
    </div>

    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">
          Materials
        </h2>
        <div class="flex gap-2">
          <button
            class="btn btn-outline"
            @click="openAddMaterial"
          >
            <Plus :size="18" />
            Add Material
          </button>
          <ZipUploadButton
            label="Upload ZIP"
            @file="handleMaterialsZipUpload"
          />
        </div>
      </div>

      <!-- Card View for Materials -->
      <div
        v-if="viewMode === 'card'"
        class="flex gap-4 overflow-x-auto pb-2"
      >
        <div
          v-for="material in topicMaterials"
          :key="material._id"
          class="min-w-[220px] max-w-xs rounded-xl border border-base-300 bg-purple-900 p-4"
        >
          <div class="text-sm whitespace-pre-wrap mb-3">
            {{ material.content }}
          </div>
          <div class="flex justify-center items-center gap-1 border-t border-purple-700 pt-2">
            <button
              class="btn btn-ghost btn-square btn-xs"
              aria-label="Edit"
              @click="openEditMaterial(material._id)"
            >
              <Pencil :size="16" />
            </button>
            <button
              class="btn btn-ghost btn-square btn-xs text-error"
              aria-label="Delete"
              @click="removeMaterial(material._id)"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
        <div
          v-if="!topicMaterials.length"
          class="text-sm opacity-70"
        >
          No materials yet.
        </div>
      </div>

      <!-- Table View for Materials -->
      <div
        v-else-if="viewMode === 'table'"
        class="overflow-x-auto"
      >
        <table
          v-if="topicMaterials.length"
          class="table table-sm"
        >
          <thead>
            <tr>
              <th>Content</th>
              <th class="w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="material in topicMaterials"
              :key="material._id"
            >
              <td class="max-w-2xl">
                <div class="line-clamp-2">
                  {{ material.content }}
                </div>
              </td>
              <td>
                <div class="flex items-center gap-1">
                  <button
                    class="btn btn-ghost btn-square btn-xs"
                    aria-label="Edit"
                    @click="openEditMaterial(material._id)"
                  >
                    <Pencil :size="16" />
                  </button>
                  <button
                    class="btn btn-ghost btn-square btn-xs text-error"
                    aria-label="Delete"
                    @click="removeMaterial(material._id)"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-else
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

          <!-- Card View -->
          <div
            v-if="viewMode === 'card'"
            class="flex flex-wrap gap-3 items-start"
          >
            <div
              v-for="card in levelCards(level)"
              :key="card._id"
              class="rounded-xl border border-base-300 bg-base-100 w-fit"
            >
              <div class="flex items-center gap-1 h-4 m-1">
                <div
                  v-if="card.cardType === 'declaritive'"
                  class="text-[11px] uppercase tracking-wide opacity-60"
                >
                  {{ declarativeDueLabel(card._id) }}
                </div>
                <Circle
                  v-else-if="goalAchieved(card._id) === null"
                  class="text-base-300"
                  :size="10"
                />
                <CheckCircle2
                  v-else-if="goalAchieved(card._id) === true"
                  class="text-success"
                  :size="12"
                />
                <XCircle
                  v-else-if="goalAchieved(card._id) === false"
                  class="text-error"
                  :size="12"
                />
              </div>
              <FlashcardRenderer
                :front="card.front"
                :back="card.back"
                :card-type="card.cardType"
                :instruction="card.instruction"
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

          <!-- Table View -->
          <div
            v-else-if="viewMode === 'table'"
            class="overflow-x-auto"
          >
            <table
              v-if="levelCards(level).length"
              class="table table-sm"
            >
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Front</th>
                  <th>Back</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="card in levelCards(level)"
                  :key="card._id"
                >
                  <td class="w-20">
                    <div
                      v-if="card.cardType === 'declaritive'"
                      class="text-[11px] uppercase tracking-wide opacity-60"
                    >
                      {{ declarativeDueLabel(card._id) }}
                    </div>
                    <Circle
                      v-else-if="goalAchieved(card._id) === null"
                      class="text-base-300"
                      :size="10"
                    />
                    <CheckCircle2
                      v-else-if="goalAchieved(card._id) === true"
                      class="text-success"
                      :size="12"
                    />
                    <XCircle
                      v-else-if="goalAchieved(card._id) === false"
                      class="text-error"
                      :size="12"
                    />
                  </td>
                  <td class="max-w-xs truncate">
                    {{ card.front }}
                  </td>
                  <td class="max-w-xs truncate">
                    {{ card.back }}
                  </td>
                  <td>
                    <div class="flex items-center gap-1">
                      <button
                        class="btn btn-ghost btn-square btn-xs"
                        aria-label="Preview"
                        @click="previewCardId = card._id"
                      >
                        <Eye :size="16" />
                      </button>
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
                  </td>
                </tr>
              </tbody>
            </table>
            <div
              v-else
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
            <ZipUploadButton
              label="Upload ZIP"
              @file="(file) => handleFlashcardsZipUpload(file, levelIndex)"
            />
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
    :title="materialEditId === null ? 'Add Material' : 'Edit Material'"
    :submit-label="materialEditId === null ? 'Add' : 'Save'"
    :initial-value="materialEditId === null ? '' : materialsById[materialEditId]?.content || ''"
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
    :initial-instruction="cardsById[editCardId]?.instruction"
    @close="editCardId = null"
    @save="handleSaveEdit"
  />

  <!-- Preview Modal -->
  <dialog
    :open="Boolean(previewCardId)"
    class="modal"
    @click.self="previewCardId = null"
  >
    <div
      v-if="previewCard"
      class="modal-box max-w-2xl"
    >
      <h3 class="font-bold text-lg mb-4">
        Card Preview
      </h3>
      <div class="rounded-xl border border-base-300 bg-base-100 w-fit">
        <FlashcardRenderer
          :front="previewCard.front"
          :back="previewCard.back"
          :card-type="previewCard.cardType"
          :instruction="previewCard.instruction"
          :show-back="previewCard.cardType === 'declaritive'"
        />
      </div>
      <div class="modal-action">
        <button
          class="btn"
          @click="previewCardId = null"
        >
          Close
        </button>
      </div>
    </div>
  </dialog>
</template>
