<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOpenAIKey, setOpenAIKey, clearOpenAIKey } from '@/app/storage/llmSettings'

const route = useRoute()
const router = useRouter()

const apiKey = ref('')
const isSaved = ref(false)

onMounted(() => {
  apiKey.value = getOpenAIKey() ?? ''
})

const handleSave = () => {
  const trimmed = apiKey.value.trim()
  if (trimmed) {
    setOpenAIKey(trimmed)
  } else {
    clearOpenAIKey()
  }
  isSaved.value = true
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect.length > 0) {
    router.push(redirect)
  }
}
</script>

<template>
  <div class="w-full max-w-lg space-y-6">
    <div>
      <h1 class="text-3xl font-semibold">
        Settings
      </h1>
      <p class="text-sm opacity-70">
        Set the OpenAI key for goal generation.
      </p>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text">OpenAI API Key</span>
      </label>
      <input
        v-model="apiKey"
        type="password"
        class="input input-bordered w-full"
        placeholder="sk-..."
      >
      <div class="label">
        <span class="label-text-alt opacity-60">
          Stored locally in this browser.
        </span>
      </div>
    </div>

    <button
      class="btn btn-primary w-full"
      @click="handleSave"
    >
      Save
    </button>

    <div
      v-if="isSaved"
      class="text-sm text-success"
    >
      Saved.
    </div>
  </div>
</template>
