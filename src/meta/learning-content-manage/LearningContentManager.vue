<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import RelatedFlashcardsManager from './RelatedFlashcardsManager.vue'
import GradualClozeDeletionWizard from './GradualClozeDeletionWizard.vue'
import AIFlashcardGeneratorModal from './AIFlashcardGeneratorModal.vue'
import TagInput from '@/dumb/TagInput.vue'
import { showToast } from '@/app/toast/toastStore'
import { getOpenAIKey } from '@/app/storage/openAIKey'
import type { Tag } from '@/db/Tag'

const props = defineProps<{
  content: string
  relatedFlashcards: string[]
  tags: string[]
  allTags: Tag[]
}>()

const emit = defineEmits<{
  'update:content': [value: string]
  'update:related-flashcards': [value: string[]]
  'update:tags': [value: string[]]
  'create-tag': [content: string]
  blur: []
}>()

const router = useRouter()

const contentValue = computed({
  get: () => props.content,
  set: (value: string) => emit('update:content', value)
})

const relatedFlashcardsValue = computed({
  get: () => props.relatedFlashcards ?? [],
  set: (value: string[]) => emit('update:related-flashcards', value)
})

const tagsValue = computed({
  get: () => props.tags ?? [],
  set: (value: string[]) => emit('update:tags', value)
})

const wizardOpen = ref(false)
const aiModalOpen = ref(false)

const openWizard = () => {
  wizardOpen.value = true
}

const openAIModal = () => {
  const apiKey = getOpenAIKey()
  if (!apiKey) {
    showToast('Please set OpenAI API key in settings', 'error')
    router.push('/settings')
    return
  }
  aiModalOpen.value = true
}

const handleAIModalAccept = (cardIds: string[]) => {
  const newRelated = [...relatedFlashcardsValue.value]
  for (const id of cardIds) {
    if (!newRelated.includes(id)) {
      newRelated.push(id)
    }
  }
  relatedFlashcardsValue.value = newRelated
  aiModalOpen.value = false
  emit('blur')
}

const handleWizardComplete = (lastCardId: string) => {
  if (!relatedFlashcardsValue.value.includes(lastCardId)) {
    relatedFlashcardsValue.value = [...relatedFlashcardsValue.value, lastCardId]
  }
  emit('blur')
  showToast('Gradual cloze deletion created', 'success')
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <fieldset class="fieldset">
      <label
        for="learning-content"
        class="label"
      >Learning Content</label>
      <textarea
        id="learning-content"
        v-model="contentValue"
        name="learning-content"
        class="textarea"
        rows="10"
        @blur="emit('blur')"
      />
    </fieldset>

    <fieldset class="fieldset">
      <label class="label">Tags</label>
      <TagInput
        v-model="tagsValue"
        :all-tags="allTags"
        @create-tag="(content) => emit('create-tag', content)"
      />
    </fieldset>

    <div class="flex items-center justify-between gap-2">
      <h3 class="font-bold">
        Related Flashcards
      </h3>
      <div class="flex gap-2">
        <button
          class="btn btn-sm"
          @click="openAIModal"
        >
          AI Generate Flashcards
        </button>
        <button
          class="btn btn-sm"
          @click="openWizard"
        >
          Establish gradual cloze deletion
        </button>
      </div>
    </div>

    <RelatedFlashcardsManager v-model="relatedFlashcardsValue" />

    <GradualClozeDeletionWizard
      v-model:open="wizardOpen"
      :initial-content="contentValue"
      @complete="handleWizardComplete"
    />

    <AIFlashcardGeneratorModal
      :open="aiModalOpen"
      :content="contentValue"
      @close="aiModalOpen = false"
      @accept="handleAIModalAccept"
    />
  </div>
</template>
