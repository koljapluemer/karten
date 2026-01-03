<script setup lang="ts">
import { onMounted } from 'vue'
import { usePracticeFlow } from './usePracticeFlow'
import PracticeChooseScreen from './PracticeChooseScreen.vue'
import FlashcardAddForm from './FlashcardAddForm.vue'
import PracticeLessonScreen from './PracticeLessonScreen.vue'

const {
  screen,
  start,
  startAddingFlow,
  startLesson,
  advanceLesson,
  completeLesson,
  handleCardAdded
} = usePracticeFlow()

onMounted(() => {
  start()
})
</script>

<template>
  <div class="w-full flex justify-center">
    <div
      v-if="screen.name === 'loading'"
      class="text-center opacity-70"
    >
      Loading...
    </div>

    <PracticeChooseScreen
      v-else-if="screen.name === 'choose'"
      @practice="startLesson"
      @add="startAddingFlow"
    />

    <FlashcardAddForm
      v-else-if="screen.name === 'adding'"
      :step="screen.step"
      :total="screen.total"
      @added="handleCardAdded"
    />

    <PracticeLessonScreen
      v-else-if="screen.name === 'lesson'"
      :cards="screen.cards"
      :index="screen.index"
      @advance="advanceLesson"
      @complete="completeLesson"
    />
  </div>
</template>
