<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useIsLoggedIn } from '@/entities/auth/authStore'
import AuthLoginForm from '@/features/auth-login/AuthLoginForm.vue'
import AuthUserInfo from '@/features/auth-user-info/AuthUserInfo.vue'
import { getOpenAIKey, setOpenAIKey, clearOpenAIKey } from '@/app/storage/openAIKey'

const isLoggedIn = useIsLoggedIn()

const openAIKey = ref('')
const hasKey = ref(false)

onMounted(() => {
  const key = getOpenAIKey()
  if (key) {
    openAIKey.value = key
    hasKey.value = true
  }
})

const handleKeyBlur = () => {
  if (openAIKey.value.trim()) {
    setOpenAIKey(openAIKey.value.trim())
    hasKey.value = true
  }
}

const handleClearKey = () => {
  clearOpenAIKey()
  openAIKey.value = ''
  hasKey.value = false
}
</script>

<template>
  <div>
    <h1>Settings</h1>

    <div class="max-w-2xl space-y-8">
      <AuthUserInfo v-if="isLoggedIn" />
      <AuthLoginForm v-else />

      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          OpenAI API Key
        </legend>
        <div class="flex gap-2">
          <input
            v-model="openAIKey"
            type="password"
            class="input input-bordered flex-1"
            placeholder="sk-..."
            @blur="handleKeyBlur"
          >
          <button
            v-if="hasKey"
            class="btn btn-ghost"
            @click="handleClearKey"
          >
            Clear
          </button>
        </div>
        <p class="text-sm opacity-70 mt-1">
          Used for AI-powered flashcard generation. Key is stored locally in your browser.
        </p>
      </fieldset>
    </div>
  </div>
</template>
