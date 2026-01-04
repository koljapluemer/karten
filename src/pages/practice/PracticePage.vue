<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import FlashcardModal from '@/features/flashcard-add/FlashcardModal.vue'
import { pickRandom } from '@/dumb/random'
import PracticeIconBar from './PracticeIconBar.vue'
import AddCardScreen from './screens/AddCardScreen.vue'
import FollowupCardsScreen from './screens/FollowupCardsScreen.vue'
import RelationCardsScreen from './screens/RelationCardsScreen.vue'
import PracticeFlashcardScreen from './screens/PracticeFlashcardScreen.vue'
import PracticeGoalScreen from './screens/PracticeGoalScreen.vue'
import { usePracticeController } from './usePracticeController'

const flashcardsStore = useFlashcardsStore()
const { screen, cardsById, start, goToScreen } = usePracticeController()

const isAddGoalOpen = ref(false)
const isAddFlashcardOpen = ref(false)
const editCardId = ref<string | null>(null)
const isSavingAdd = ref(false)
const isSavingEdit = ref(false)
const followupGoalInstruction = ref('Which new goals can you go after once you got this down?')

const followupGoalOptions: [string, string] = [
  'Are there harder versions of this goal you want to achieve after you got this?',
  'Which new goals can you go after once you got this down?'
]

const activeCardId = computed(() => {
  switch (screen.value.name) {
    case 'followup-flashcards':
    case 'followup-goals':
    case 'required-goals':
    case 'required-flashcards-for-goal':
    case 'required-flashcards-for-card':
    case 'overlapping-flashcards':
    case 'overlapping-goals':
      return screen.value.parentId
    case 'practice-flashcard':
    case 'practice-goal':
      return screen.value.cardId
    default:
      return null
  }
})

const activeCard = computed(() => (activeCardId.value ? cardsById.value[activeCardId.value] : null))
const editCard = computed(() => (editCardId.value ? cardsById.value[editCardId.value] : null))
const requiresCardScreens = new Set([
  'followup-flashcards',
  'followup-goals',
  'required-goals',
  'required-flashcards-for-goal',
  'required-flashcards-for-card',
  'overlapping-flashcards',
  'overlapping-goals',
  'practice-flashcard',
  'practice-goal'
])

const handleAddSave = async (payload: { front: string; back: string }, cardType: FlashCardDoc['cardType']) => {
  if (isSavingAdd.value) return
  isSavingAdd.value = true
  try {
    await flashcardsStore.createFlashcard(payload.front, payload.back, cardType)
    isAddGoalOpen.value = false
    isAddFlashcardOpen.value = false
  } finally {
    isSavingAdd.value = false
  }
}

const handleEditSave = async (payload: { front: string; back: string }) => {
  if (!editCardId.value || isSavingEdit.value) return
  const card = cardsById.value[editCardId.value]
  if (!card) return
  isSavingEdit.value = true
  try {
    await flashcardsStore.updateFlashcard(card._id, {
      front: payload.front,
      back: payload.back
    })
    editCardId.value = null
  } finally {
    isSavingEdit.value = false
  }
}

const handleDelete = async () => {
  if (!activeCard.value) return
  await flashcardsStore.deleteFlashcard(activeCard.value._id)
  goToScreen()
}

watch(
  () => screen.value,
  (current) => {
    if (current.name === 'followup-goals') {
      followupGoalInstruction.value = pickRandom(followupGoalOptions) ?? followupGoalOptions[0]
    }
  }
)

watch(
  () => flashcardsStore.flashcards,
  () => {
    if (activeCardId.value && !cardsById.value[activeCardId.value]) {
      goToScreen()
    }
    if (editCardId.value && !cardsById.value[editCardId.value]) {
      editCardId.value = null
    }
  }
)

watch(
  [() => screen.value, () => cardsById.value],
  ([current]) => {
    if (
      requiresCardScreens.has(current.name) &&
      (!activeCardId.value || !cardsById.value[activeCardId.value])
    ) {
      goToScreen()
    }
  }
)

onMounted(() => {
  start()
})
</script>

<template>
  <div class="w-full flex justify-center">
    <div class="w-full max-w-5xl space-y-6">
      <PracticeIconBar
        :can-edit="Boolean(activeCard)"
        :can-delete="Boolean(activeCard)"
        @add-goal="isAddGoalOpen = true"
        @add-flashcard="isAddFlashcardOpen = true"
        @skip="goToScreen()"
        @edit="editCardId = activeCard?._id ?? null"
        @delete="handleDelete"
      />

      <div
        v-if="screen.name === 'loading'"
        class="text-center opacity-70"
      >
        Loading...
      </div>

      <AddCardScreen
        v-else-if="screen.name === 'add-declarative'"
        instruction="Add a Flashcard"
        card-type="declaritive"
        @done="goToScreen()"
        @add-another="goToScreen({ name: 'add-declarative' })"
      />

      <AddCardScreen
        v-else-if="screen.name === 'add-procedural'"
        instruction="Add a Goal"
        card-type="procedural"
        @done="goToScreen()"
        @add-another="goToScreen({ name: 'add-procedural' })"
      />

      <FollowupCardsScreen
        v-else-if="screen.name === 'followup-flashcards'"
        :parent-id="screen.parentId"
        instruction="What knowledge can you memorize now that you know this?"
        child-type="declaritive"
        @done="goToScreen()"
        @edit-card="editCardId = $event._id"
      />

      <FollowupCardsScreen
        v-else-if="screen.name === 'followup-goals'"
        :parent-id="screen.parentId"
        :instruction="followupGoalInstruction"
        child-type="procedural"
        @done="goToScreen()"
        @edit-card="editCardId = $event._id"
      />

      <RelationCardsScreen
        v-else-if="screen.name === 'required-goals'"
        :parent-id="screen.parentId"
        instruction="What goals do you need to reach before you can attempt this?"
        child-type="procedural"
        relation="requiresLearning"
        @done="goToScreen()"
        @edit-card="editCardId = $event._id"
      />

      <RelationCardsScreen
        v-else-if="screen.name === 'required-flashcards-for-goal'"
        :parent-id="screen.parentId"
        instruction="What declarative knowledge do you need to internalize before attempting this?"
        child-type="declaritive"
        relation="requiresLearning"
        @done="goToScreen()"
        @edit-card="editCardId = $event._id"
      />

      <RelationCardsScreen
        v-else-if="screen.name === 'required-flashcards-for-card'"
        :parent-id="screen.parentId"
        instruction="Which declarative knowledge would help you memorize this card?"
        child-type="declaritive"
        relation="requiresLearning"
        @done="goToScreen()"
        @edit-card="editCardId = $event._id"
      />

      <RelationCardsScreen
        v-else-if="screen.name === 'overlapping-flashcards'"
        :parent-id="screen.parentId"
        instruction="Add flashcards that give additional context to this"
        child-type="declaritive"
        relation="overlapping"
        @done="goToScreen()"
        @edit-card="editCardId = $event._id"
      />

      <RelationCardsScreen
        v-else-if="screen.name === 'overlapping-goals'"
        :parent-id="screen.parentId"
        instruction="Add an alternative goal to practice that will help achieving this goal"
        child-type="procedural"
        relation="overlapping"
        @done="goToScreen()"
        @edit-card="editCardId = $event._id"
      />

      <PracticeFlashcardScreen
        v-else-if="screen.name === 'practice-flashcard'"
        :card-id="screen.cardId"
        @next="goToScreen()"
        @followup="goToScreen({ name: 'followup-flashcards', parentId: screen.cardId })"
        @overlap="goToScreen({ name: 'overlapping-flashcards', parentId: screen.cardId })"
        @required="goToScreen({ name: 'required-flashcards-for-card', parentId: screen.cardId })"
      />

      <PracticeGoalScreen
        v-else-if="screen.name === 'practice-goal'"
        :card-id="screen.cardId"
        @next="goToScreen()"
        @followup-goals="goToScreen({ name: 'followup-goals', parentId: screen.cardId })"
        @required-goals="goToScreen({ name: 'required-goals', parentId: screen.cardId })"
        @required-flashcards="goToScreen({ name: 'required-flashcards-for-goal', parentId: screen.cardId })"
      />
    </div>
  </div>

  <FlashcardModal
    :open="isAddGoalOpen"
    title="Add Goal"
    submit-label="Save"
    card-type="procedural"
    :is-saving="isSavingAdd"
    @close="isAddGoalOpen = false"
    @save="handleAddSave($event, 'procedural')"
  />

  <FlashcardModal
    :open="isAddFlashcardOpen"
    title="Add Flashcard"
    submit-label="Save"
    card-type="declaritive"
    :is-saving="isSavingAdd"
    @close="isAddFlashcardOpen = false"
    @save="handleAddSave($event, 'declaritive')"
  />

  <FlashcardModal
    v-if="editCard"
    :open="Boolean(editCardId)"
    title="Edit Card"
    submit-label="Save"
    :card-type="editCard.cardType"
    :initial-front="editCard.front"
    :initial-back="editCard.back"
    :is-saving="isSavingEdit"
    @close="editCardId = null"
    @save="handleEditSave"
  />
</template>
