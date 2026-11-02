import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { installHttp } from './services/http'
import { useSessionStore } from './stores/session'
import { useUiStore } from './stores/ui'

const app = createApp(App)
app.use(createPinia())
app.use(router)

useUiStore().initTheme()

// A rejected token (expired, account deleted) signs the user out and returns them to the login page
installHttp(() => {
  useSessionStore().signOut()
  router.push({ name: 'login' })
})

app.mount('#app')
