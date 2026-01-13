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
  <div class="card shadow">
    <div class="card-body">
      <h3 class="card-title">
        Sign In
      </h3>
      <p class="text-light">
        Enter your email to receive a one-time password
      </p>

      <fieldset class="fieldset">
        <label
          for="email"
          class="label"
        >Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          name="email"
          class="input"
          placeholder="you@example.com"
          :disabled="isLoading"
          @keyup.enter="handleLogin"
        >
      </fieldset>

      <div class="card-actions justify-end mt-4">
        <button
          class="btn btn-primary"
          :disabled="isLoading"
          @click="handleLogin"
        >
          <LogIn
            v-if="!isLoading"
            :size="20"
          />
          <span
            v-if="isLoading"
            class="loading loading-spinner"
          />
          {{ isLoading ? 'Sending...' : 'Send OTP' }}
        </button>
      </div>
    </div>
  </div>
</template>
