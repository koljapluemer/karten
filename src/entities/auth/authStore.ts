import { ref, computed } from 'vue'
import { db } from '@/app/storage/db'
import type { User } from './User'

const currentUser = ref<User | null>(null)
const isLoading = ref(false)

export const useCurrentUser = () => currentUser
export const useIsLoggedIn = () => computed(() => currentUser.value?.isLoggedIn ?? false)
export const useAuthLoading = () => isLoading

export const initializeAuth = () => {
  db.cloud.currentUser.subscribe({
    next: (dexieUser) => {
      if (dexieUser && dexieUser.userId && dexieUser.userId !== 'unauthorized') {
        currentUser.value = {
          userId: dexieUser.userId,
          email: dexieUser.email,
          name: dexieUser.name,
          isLoggedIn: true
        }
      } else {
        currentUser.value = null
      }
    },
    error: (err) => {
      console.error('Auth subscription error:', err)
      currentUser.value = null
    }
  })
}

export const login = async (email: string): Promise<void> => {
  isLoading.value = true
  try {
    await db.cloud.login({
      grant_type: 'otp',
      email
    })
  } finally {
    isLoading.value = false
  }
}

export const logout = async (): Promise<void> => {
  isLoading.value = true
  try {
    await db.cloud.logout()
    currentUser.value = null
  } finally {
    isLoading.value = false
  }
}
