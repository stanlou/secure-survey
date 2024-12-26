import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";


const routes: Array<RouteRecordRaw> = [
  {
    path: "/sign-in",
    name: "sign-in",
    meta: {
      requiresAuth: false,
    },
    component: () =>
      import(
        /* webpackChunkName: "SignIn" */ "@/views/auth/SignIn.vue"
      ),
  },
  {
    path: "",
    name:"home",
    meta: {
      requiresAuth: false,
    },
    component: () =>
      import(
        /* webpackChunkName: "survey-list" */ "@/views/home/Home.vue"
      ),
  },
  {
    path: "/surveyCreator",
    name: "create-survey",
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
    name: "answer-survey",
    meta: {
      requiresAuth: true,
    },
    component: () =>
      import(
        /* webpackChunkName: "SurveyForm" */ "@/components/survey-form/SurveyForm.vue"
      ),
  },
  {
    path: "/dashboard/:id",
    name: "dashboard",
    meta: {
      requiresAuth: true,
    },
    component: () =>
      import(
        /* webpackChunkName: "SurveyForm" */ "@/views/dashboard/Dashboard.vue"
      ),
  },
 
]

const router = createRouter({
  history: createWebHistory(),
  routes,
});


export default router;
