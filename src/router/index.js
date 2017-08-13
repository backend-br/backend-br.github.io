import Vue from 'vue'
import Router from 'vue-router'
import Hello from '@/components/Hello'
import AboutUs from '@/components/AboutUs'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Hello',
      component: Hello
    },
    {
      path: '/about-us',
      name: 'AboutUs',
      component: AboutUs
    }
  ]
})
