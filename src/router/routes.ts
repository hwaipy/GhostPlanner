import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/forecast' },
      { path: 'inbox', name: 'inbox', component: () => import('pages/InboxPage.vue'), meta: { title: 'Inbox' } },
      { path: 'projects', name: 'projects', component: () => import('pages/ProjectsPage.vue'), meta: { title: 'Projects' } },
      { path: 'p/:uid', name: 'project', component: () => import('pages/ProjectPage.vue') },
      { path: 'forecast', name: 'forecast', component: () => import('pages/ForecastPage.vue'), meta: { title: 'Forecast' } },
      { path: 'flagged', name: 'flagged', component: () => import('pages/FlaggedPage.vue'), meta: { title: 'Flagged' } },
      { path: 'tags', name: 'tags', component: () => import('pages/TagsPage.vue'), meta: { title: 'Tags' } },
      { path: 'tag/:name', name: 'tag', component: () => import('pages/TagPage.vue') },
      { path: 'review', name: 'review', component: () => import('pages/ReviewPage.vue'), meta: { title: 'Review' } },
      { path: 't/:uid', name: 'task', component: () => import('pages/TaskDetailPage.vue'), meta: { title: 'Details' } },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
