<script setup lang="ts">
import { ref } from 'vue'
import { login, useAuthLoading } from '@/entities/auth/authStore'
import { showToast } from '@/app/toast/toastStore'
import { LogIn } from 'lucide-vue-next'

const email = ref('')
const isLoading = useAuthLoading()

const handleLogin = async () => {
  if (!email.value || !email.value.includes('@')) {
    showToast('Please enter a valid email address', 'error')
    return
  }

  try {
    await login(email.value)
    showToast('Check your email for the OTP code', 'info')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred'
    showToast(`Login failed: ${message}`, 'error')
  }
}
</script>

<template>
  <fieldset class="fieldset">
    <label
      for="email"
      class="label"
    >Sign In</label>
    <p class="text-light mb-2">
      Enter your email to receive a one-time password
    </p>
    <div class="flex gap-2">
      <input
        id="email"
        v-model="email"
        type="email"
        name="email"
        class="input flex-1"
        placeholder="you@example.com"
        :disabled="isLoading"
        @keyup.enter="handleLogin"
      >
      <button
        class="btn btn-primary"
        :disabled="isLoading"
        @click="handleLogin"
      >
        <LogIn
          v-if="!isLoading"
        />
        <span
          v-if="isLoading"
          class="loading loading-spinner"
        />
        {{ isLoading ? 'Sending...' : 'Send OTP' }}
      </button>
    </div>
  </fieldset>
</template>
