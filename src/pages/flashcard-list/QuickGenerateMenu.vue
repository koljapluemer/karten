<script setup lang="ts">
import { ref } from 'vue'
import { Bot, ListTree, List } from 'lucide-vue-next'
import AIFlashcardGeneratorModal from './AIFlashcardGeneratorModal.vue'
import GradualClozeDeletionWizard from './GradualClozeDeletionWizard.vue'
import ListClozeWizard from './ListClozeWizard.vue'

type Mode = 'ai' | 'cloze' | 'listcloze'

const emit = defineEmits<{ complete: [] }>()

const activeMode = ref<Mode | null>(null)
const textInput = ref('')
const showTextStep = ref(false)
const showWizard = ref(false)

const modeLabels: Record<Mode, string> = {
  ai: 'AI Flashcards',
  cloze: 'Gradual Cloze',
  listcloze: 'List Cloze',
}

function openTextStep(mode: Mode) {
  activeMode.value = mode
  textInput.value = ''
  showTextStep.value = true
}

function continueToWizard() {
  showTextStep.value = false
  showWizard.value = true
}

function cancelTextStep() {
  showTextStep.value = false
  activeMode.value = null
}

function onWizardComplete() {
  showWizard.value = false
  activeMode.value = null
  emit('complete')
}

function onAIAccept() {
  showWizard.value = false
  activeMode.value = null
  emit('complete')
}

function onAIClose() {
  showWizard.value = false
  activeMode.value = null
}
</script>

<template>
  <button
    class="btn btn-sm btn-outline"
    @click="openTextStep('ai')"
  >
    <Bot class="w-4 h-4" />
    AI Flashcards
  </button>
  <button
    class="btn btn-sm btn-outline"
    @click="openTextStep('cloze')"
  >
    <ListTree class="w-4 h-4" />
    Gradual Cloze
  </button>
  <button
    class="btn btn-sm btn-outline"
    @click="openTextStep('listcloze')"
  >
    <List class="w-4 h-4" />
    List Cloze
  </button>

  <!-- Step 1: text input -->
  <dialog
    :open="showTextStep"
    class="modal"
  >
    <div class="modal-box flex flex-col gap-4">
      <h3 class="font-bold text-lg">
        {{ activeMode ? modeLabels[activeMode] : '' }}
      </h3>
      <div class="flex flex-col gap-1">
        <label class="label-text">Source text</label>
        <textarea
          v-model="textInput"
          class="textarea textarea-bordered w-full"
          rows="8"
          placeholder="Paste or type your content here…"
        />
      </div>
      <div class="modal-action">
        <button
          class="btn btn-ghost"
          @click="cancelTextStep"
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          :disabled="!textInput.trim()"
          @click="continueToWizard"
        >
          Continue
        </button>
      </div>
    </div>
    <div
      class="modal-backdrop"
      @click="cancelTextStep"
    />
  </dialog>

  <!-- Step 2: respective wizard -->
  <AIFlashcardGeneratorModal
    v-if="activeMode === 'ai'"
    :open="showWizard"
    :content="textInput"
    @close="onAIClose"
    @accept="onAIAccept"
  />
  <GradualClozeDeletionWizard
    v-if="activeMode === 'cloze'"
    v-model:open="showWizard"
    :initial-content="textInput"
    @complete="onWizardComplete"
  />
  <ListClozeWizard
    v-if="activeMode === 'listcloze'"
    v-model:open="showWizard"
    :initial-content="textInput"
    @complete="onWizardComplete"
  />
</template>
