<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { loadPrompts } from '@/entities/prompt/promptStore'
import { ensureDefaultPrompts } from '@/entities/prompt/defaultPrompts'
import { getLastSelectedPromptId, setLastSelectedPromptId } from '@/app/storage/lastSelectedPrompt'
import type { Prompt } from '@/db/Prompt'

const props = defineProps<{
  magicValues: Record<string, string>
  context: 'previous-knowledge' | 'learning-content'
}>()

const emit = defineEmits<{
  promptChange: [prompt: string]
}>()

const prompts = ref<Prompt[]>([])
const selectedPromptId = ref<string | null>(null)
const isAdapting = ref(false)
const adaptedContent = ref('')

onMounted(async () => {
  await ensureDefaultPrompts()
  prompts.value = await loadPrompts()

  const lastSelected = getLastSelectedPromptId(props.context)
  if (lastSelected && prompts.value.some(p => p.id === lastSelected)) {
    selectedPromptId.value = lastSelected
  } else {
    const firstPrompt = prompts.value[0]
    if (firstPrompt) {
      selectedPromptId.value = firstPrompt.id
    }
  }
})

const selectedPrompt = computed(() => {
  if (!selectedPromptId.value) return null
  return prompts.value.find(p => p.id === selectedPromptId.value) ?? null
})

const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

const renderWithMarks = (content: string, values: Record<string, string>): string => {
  let result = escapeHtml(content)
  for (const [key, value] of Object.entries(values)) {
    const escaped = escapeHtml(value)
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(pattern, `<mark>${escaped}</mark>`)
  }
  return result
}

const replaceMagicValues = (content: string, values: Record<string, string>): string => {
  let result = content
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}

const previewHtml = computed(() => {
  if (!selectedPrompt.value) return ''
  return renderWithMarks(selectedPrompt.value.content, props.magicValues)
})

const finalPrompt = computed(() => {
  if (isAdapting.value) {
    return adaptedContent.value
  }
  if (!selectedPrompt.value) return ''
  return replaceMagicValues(selectedPrompt.value.content, props.magicValues)
})

watch(selectedPromptId, (newId) => {
  if (newId) {
    setLastSelectedPromptId(props.context, newId)
    isAdapting.value = false
  }
})

watch(finalPrompt, (newPrompt) => {
  emit('promptChange', newPrompt)
}, { immediate: true })

const handleAdapt = () => {
  if (selectedPrompt.value) {
    adaptedContent.value = finalPrompt.value
    isAdapting.value = true
  }
}

const handleCancelAdapt = () => {
  isAdapting.value = false
  adaptedContent.value = ''
}
</script>

<template>
  <div class="space-y-4">
    <fieldset class="fieldset">
      <label class="label">
        <span class="label-text">Prompt Template</span>
      </label>
      <select
        v-model="selectedPromptId"
        class="select select-bordered w-full"
        :disabled="isAdapting"
      >
        <option
          v-for="prompt in prompts"
          :key="prompt.id"
          :value="prompt.id"
        >
          {{ prompt.name }}
        </option>
      </select>
    </fieldset>

    <div v-if="isAdapting">
      <fieldset class="fieldset">
        <label class="label">
          <span class="label-text">Adapted Prompt</span>
        </label>
        <textarea
          v-model="adaptedContent"
          class="textarea textarea-bordered min-h-[200px] w-full"
        />
      </fieldset>
      <button
        class="btn btn-sm btn-ghost mt-2"
        @click="handleCancelAdapt"
      >
        Cancel Adaptation
      </button>
    </div>

    <div v-else-if="selectedPrompt">
      <fieldset class="fieldset">
        <label class="label">
          <span class="label-text">Preview</span>
        </label>
        <div
          class="p-4 border border-base-300 rounded-lg bg-base-200 whitespace-pre-wrap max-h-64 overflow-y-auto"
          v-html="previewHtml"
        />
      </fieldset>
      <button
        class="btn btn-sm btn-ghost mt-2"
        @click="handleAdapt"
      >
        Adapt
      </button>
    </div>
  </div>
</template>
