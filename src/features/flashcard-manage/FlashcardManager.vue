<script setup lang="ts">
import { computed } from 'vue'
import BlockedByManager from './BlockedByManager.vue'

const props = defineProps<{
  front: string
  back: string
  instruction: string
  blockedBy: string[]
}>()

const emit = defineEmits<{
  'update:front': [value: string]
  'update:back': [value: string]
  'update:instruction': [value: string]
  'update:blocked-by': [value: string[]]
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

const blockedByValue = computed({
  get: () => props.blockedBy ?? [],
  set: (value: string[]) => emit('update:blocked-by', value)
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <fieldset class="fieldset">
      <label for="instruction" class="label">Instruction</label>
      <input id="instruction" v-model="instructionValue" type="text" name="instruction" class="input">
    </fieldset>

    <fieldset class="fieldset">
      <label for="front" class="label">Front</label>
      <textarea id="front" v-model="frontValue" name="front" class="textarea" rows="6" />
    </fieldset>

    <fieldset class="fieldset">
      <label for="back" class="label">Back</label>
      <textarea id="back" v-model="backValue" name="back" class="textarea" rows="6" />
    </fieldset>

    <BlockedByManager v-model="blockedByValue" />
  </div>
</template>
