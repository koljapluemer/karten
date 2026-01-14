<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import { Settings, Play, BookOpen, Layers } from 'lucide-vue-next'
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
        <div class="flex gap-1">
          <RouterLink
            to="/practice"
            class="btn btn-ghost"
          >
            <Play :size="20" />
            <span class="hidden sm:inline">Practice</span>
          </RouterLink>
          <RouterLink
            to="/learning-content"
            class="btn btn-ghost"
          >
            <BookOpen :size="20" />
            <span class="hidden sm:inline">Learning Content</span>
          </RouterLink>
          <RouterLink
            to="/flashcards"
            class="btn btn-ghost"
          >
            <Layers :size="20" />
            <span class="hidden sm:inline">Flashcards</span>
          </RouterLink>
        </div>
      </div>
      <div class="flex-none">
        <RouterLink
          to="/settings"
          class="btn btn-ghost"
        >
          <Settings :size="20" />
          <span class="hidden sm:inline">Settings</span>
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
