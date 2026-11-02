import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '../stores/session'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    admin?: boolean
    title?: string
  }
}

// Pages are loaded on demand so the first screen downloads less code
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../pages/LoginPage.vue'), meta: { public: true, title: 'Sign in' } },
    {
      path: '/',
      component: () => import('../layouts/AppLayout.vue'),
      children: [
        { path: '', name: 'feed', component: () => import('../pages/FeedPage.vue'), meta: { title: 'Explore' } },
        { path: 'create', name: 'create', component: () => import('../pages/CreatePage.vue'), meta: { title: 'Create a pin' } },
        { path: 'profile', name: 'profile', component: () => import('../pages/ProfilePage.vue'), meta: { title: 'Profile' } },
        { path: 'boards/:id(\\d+)', name: 'board', component: () => import('../pages/BoardPage.vue'), meta: { title: 'Board' } },
        { path: 'admin', name: 'admin', component: () => import('../pages/AdminPage.vue'), meta: { admin: true, title: 'Admin' } },
        { path: ':pathMatch(.*)*', name: 'not-found', component: () => import('../pages/NotFoundPage.vue'), meta: { title: 'Page not found' } }
      ]
    }
  ],
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach(to => {
  const session = useSessionStore()
  if (!to.meta.public && !session.isLoggedIn) return { name: 'login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
  if (to.name === 'login' && session.isLoggedIn) return { name: 'feed' }
  if (to.meta.admin && !session.isAdmin) return { name: 'feed' }
})

router.afterEach(to => {
  document.title = to.meta.title ? `${to.meta.title} · Avora` : 'Avora'
})

export default router
