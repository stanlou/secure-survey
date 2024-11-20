import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";


const routes: Array<RouteRecordRaw> = [
  {
    path: "/surveyCreator",
    meta: {
      requiresAuth: true,
    },
    component: () =>
      import(
        /* webpackChunkName: "surveyCreator" */ "@/components/survey-creator/SurveyCreator.vue"
      ),
  },
  {
    path: "/surveyForm/:id",
    meta: {
      requiresAuth: true,
    },
    component: () =>
      import(
        /* webpackChunkName: "SurveyForm" */ "@/components/survey-form/SurveyForm.vue"
      ),
  },
  {
    path: "",
    meta: {
      requiresAuth: false,
    },
    component: () =>
      import(
        /* webpackChunkName: "Home" */ "@/views/home/Home.vue"
      ),
  },
 
]

const router = createRouter({
  history: createWebHistory(),
  routes,
});


export default router;
