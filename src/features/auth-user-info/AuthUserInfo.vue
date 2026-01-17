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
  <div class="card shadow">
    <div class="card-body">
      <h3 class="card-title">
        Account
      </h3>

      <p>{{ currentUser?.email || 'Not provided' }}</p>

      <div class="card-actions justify-end mt-4">
        <button
          class="btn btn-outline"
          :disabled="isLoading"
          @click="handleLogout"
        >
          <LogOut  />
          Logout
        </button>
      </div>
    </div>
  </div>
</template>
