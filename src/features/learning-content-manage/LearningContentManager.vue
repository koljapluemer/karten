<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const content = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})
</script>

<template>
  <fieldset class="fieldset">
    <label
      for="learning-content"
      class="label"
    >Learning Content</label>
    <textarea
      id="learning-content"
      v-model="content"
      name="learning-content"
      class="textarea"
      rows="10"
    />
  </fieldset>
</template>
