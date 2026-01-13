<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import { Settings } from 'lucide-vue-next'
import { initializeAuth } from '@/entities/auth/authStore'
import ToastContainer from './toast/ToastContainer.vue'

onMounted(() => {
  initializeAuth()
})
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <nav class="navbar bg-base-200">
      <div class="flex-1">
        <div class="flex gap-4">
          <RouterLink
            to="/learning-content"
            class="btn btn-ghost"
          >
            Learning Content
          </RouterLink>
          <RouterLink
            to="/flashcards"
            class="btn btn-ghost"
          >
            Flashcards
          </RouterLink>
          <RouterLink
            to="/practice"
            class="btn btn-ghost"
          >
            Practice
          </RouterLink>
        </div>
      </div>
      <div class="flex-none">
        <RouterLink
          to="/settings"
          class="btn btn-ghost"
        >
          <Settings :size="20" />
          Settings
        </RouterLink>
      </div>
    </nav>
    <main class="flex-1 container mx-auto p-4 flex flex-col">
      <RouterView />
    </main>
    <ToastContainer />
  </div>
</template>


<style>
@import "tailwindcss";
@plugin "daisyui";
@plugin "@tailwindcss/typography";
</style>
