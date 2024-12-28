<template>
  <div>
    <div class="navbar-div">
      <Navbar/>
    </div>
    <SurveyComponent :model="surveyModel" v-if="surveyModel"/>
  </div>
</template>
<script setup lang="ts">
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { SurveyComponent } from 'survey-vue3-ui';
import { onMounted, ref } from 'vue';
import axios from 'axios';
import { API_URL } from '../../webService/apiService';
import { useRoute } from 'vue-router';
import { useSurveyStore } from '@/store/surveyModule';
import { storeToRefs } from 'pinia';
import { useAnswerStore } from '@/store/answerModule';
import { json } from "./json";

import Navbar from '@/components/Navbar.vue';

const route = useRoute()
const id = route.params.id
const surveyJson = ref();
const surveyModel = ref();
const {getSurveyById } =useSurveyStore()
const {survey} = storeToRefs(useSurveyStore())
const {saveAnswer} = useAnswerStore()
const surveyComplete = async (answer: any) => {
   answer.setValue("surveyId",id)
   await saveAnswer(answer.data)
}


onMounted(async () => {
  await getSurveyById(id)
  surveyJson.value = survey.value.data
  surveyModel.value = new Model(surveyJson.value)
  surveyModel.value.onComplete.add(surveyComplete);

})
</script>
<style scoped>
.navbar-div {
  border-bottom: 2px solid #ececec;
}
</style>
