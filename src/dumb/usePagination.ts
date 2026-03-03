import { ref, computed, watch, type Ref } from 'vue'

export function usePagination(
  totalCount: Ref<number> | (() => number),
  pageSize: number
) {
  const currentPage = ref(1)

  const totalCountRef = typeof totalCount === 'function'
    ? computed(totalCount)
    : totalCount

  const totalPages = computed(() => {
    const total = totalCountRef.value
    if (total <= 0) return 1
    return Math.ceil(total / pageSize)
  })

  const startIndex = computed(() => {
    const total = totalCountRef.value
    if (total <= 0) return 0
    const page = Math.min(currentPage.value, totalPages.value)
    return (page - 1) * pageSize
  })

  const endIndex = computed(() => {
    return Math.min(startIndex.value + pageSize, totalCountRef.value)
  })

  watch(totalPages, (newTotal, oldTotal) => {
    if (currentPage.value > newTotal && newTotal >= 1) {
      currentPage.value = 1
    }
    if (oldTotal !== undefined && newTotal < oldTotal && currentPage.value > newTotal) {
      currentPage.value = Math.max(1, newTotal)
    }
  })

  const goToPage = (n: number) => {
    const page = Math.max(1, Math.min(n, totalPages.value))
    currentPage.value = page
  }

  const next = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value += 1
    }
  }

  const prev = () => {
    if (currentPage.value > 1) {
      currentPage.value -= 1
    }
  }

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    next,
    prev,
    pageSize,
  }
}
