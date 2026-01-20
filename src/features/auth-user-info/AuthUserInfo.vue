<script setup lang="ts">
import { logout, useCurrentUser, useAuthLoading } from '@/entities/auth/authStore'
import { showToast } from '@/app/toast/toastStore'
import { LogOut } from 'lucide-vue-next'

const currentUser = useCurrentUser()
const isLoading = useAuthLoading()

const handleLogout = async () => {
  try {
    await logout()
    showToast('Logged out successfully', 'success')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred'
    showToast(`Logout failed: ${message}`, 'error')
  }
}
</script>

<template>
  <fieldset class="fieldset">
    <label class="label">Account</label>
    <div class="flex items-center gap-4">
      <span>{{ currentUser?.email || 'Not provided' }}</span>
      <button
        class="btn btn-outline"
        :disabled="isLoading"
        @click="handleLogout"
      >
        <LogOut />
        Logout
      </button>
    </div>
  </fieldset>
</template>
