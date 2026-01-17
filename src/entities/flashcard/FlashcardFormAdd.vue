<script setup lang="ts">
import { computed } from 'vue'
import { getInstructionHistory } from './instructionHistory'
import TagInput from '@/dumb/TagInput.vue'
import type { Tag } from '@/db/Tag'

const props = defineProps<{
  front: string
  back: string
  instruction: string
  tags: string[]
  allTags: Tag[]
}>()

const emit = defineEmits<{
  'update:front': [value: string]
  'update:back': [value: string]
  'update:instruction': [value: string]
  'update:tags': [value: string[]]
  'create-tag': [content: string]
}>()

const frontValue = computed({
  get: () => props.front,
  set: (value: string) => emit('update:front', value)
})

const backValue = computed({
  get: () => props.back,
  set: (value: string) => emit('update:back', value)
})

const instructionValue = computed({
  get: () => props.instruction,
  set: (value: string) => emit('update:instruction', value)
})

const filteredHistory = computed(() => {
  const history = getInstructionHistory()
  if (!props.instruction) {
    return history.slice(0, 3)
  }
  return history
    .filter(item => item.toLowerCase().includes(props.instruction.toLowerCase()))
    .slice(0, 3)
})

const selectInstruction = (instruction: string) => {
  instructionValue.value = instruction
}

const tagsValue = computed({
  get: () => props.tags ?? [],
  set: (value: string[]) => emit('update:tags', value)
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <fieldset class="fieldset">
      <label
        for="instruction"
        class="label"
      >Instruction</label>
      <div
        v-if="filteredHistory.length > 0"
        class="flex gap-2 mb-2 flex-wrap"
      >
        <button
          v-for="item in filteredHistory"
          :key="item"
          type="button"
          class="badge badge-outline cursor-pointer hover:badge-primary"
          @click="selectInstruction(item)"
        >
          {{ item }}
        </button>
      </div>
      <input
        id="instruction"
        v-model="instructionValue"
        type="text"
        name="instruction"
        class="input"
      >
    </fieldset>

    <fieldset class="fieldset">
      <label
        for="front"
        class="label"
      >Front</label>
      <textarea
        id="front"
        v-model="frontValue"
        name="front"
        class="textarea"
        rows="6"
      />
    </fieldset>

    <fieldset class="fieldset">
      <label
        for="back"
        class="label"
      >Back</label>
      <textarea
        id="back"
        v-model="backValue"
        name="back"
        class="textarea"
        rows="6"
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
  </div>
</template>
