import { createRouter, createWebHistory } from 'vue-router';
import Home from '../page/home.vue';
import TestSourceMap from '../page/testSourceMap.vue';

const routes = [
  {
    path: '/home',
    name: 'Home',
    component: Home,
  },
  {
    path: '/other',
    name: 'Other',
    component: () => import('../page/other.vue'),
  },
  {
    path: '/create-project',
    name: 'CreateProject',
    component: () => import('../page/createProject.vue'),
  },
  {
    path: '/',
    name: 'TestSourceMap',
    component: TestSourceMap,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
