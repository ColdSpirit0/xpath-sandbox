import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '@/views/Home.vue'
import CopyUrlPage from "@/views/CopyUrlPage"

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Xpath Sandbox',
    component: Home
  },
  {
    path: '/copy_url',
    name: 'Copy URL',
    component: CopyUrlPage,
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
