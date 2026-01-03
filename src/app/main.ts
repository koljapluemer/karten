import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import DOMPurify from 'dompurify'

import App from './App.vue'
import router from './router'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
const app = createApp(App)

app.use(pinia)
app.use(router)
app.directive('sanitize-html', {
  beforeMount(el, binding) {
    el.innerHTML = DOMPurify.sanitize(String(binding.value ?? ''))
  },
  updated(el, binding) {
    if (binding.value === binding.oldValue) return
    el.innerHTML = DOMPurify.sanitize(String(binding.value ?? ''))
  }
})
app.mount('#app')
