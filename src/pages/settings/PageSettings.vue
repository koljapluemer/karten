<script setup lang="ts">
import { useIsLoggedIn } from '@/entities/auth/authStore'
import AuthLoginForm from '@/features/auth-login/AuthLoginForm.vue'
import AuthUserInfo from '@/features/auth-user-info/AuthUserInfo.vue'

const isLoggedIn = useIsLoggedIn()
</script>

<template>
  <div>
    <h1>Settings</h1>

    <div class="max-w-2xl">
      <AuthUserInfo v-if="isLoggedIn" />
      <AuthLoginForm v-else />
    </div>
  </div>
</template>
