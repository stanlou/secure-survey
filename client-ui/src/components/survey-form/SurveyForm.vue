<template>
  <div>
    <div class="navbar-div">
      <Navbar />
    </div>
    <SurveyComponent :model="surveyModel" v-if="surveyModel" />
  </div>
</template>
<script setup lang="ts">
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { SurveyComponent } from 'survey-vue3-ui';
import { onMounted, ref } from 'vue';
import axios from 'axios';
import { API_URL } from '../../webService/apiService';
import { useRoute, useRouter } from 'vue-router';
import { useSurveyStore } from '@/store/surveyModule';
import { storeToRefs } from 'pinia';
import { useAnswerStore } from '@/store/answerModule';
import { json } from "./json";

import Navbar from '@/components/Navbar.vue';
import { ElNotification } from 'element-plus';
import { useZkAppStore } from '@/store/zkAppModule';

const route = useRoute()
const id = route.params.id
const surveyJson = ref();
const surveyModel = ref();
const { getSurveyById } = useSurveyStore()
const { survey } = storeToRefs(useSurveyStore())
const { saveAnswer } = useAnswerStore()
const { error } = storeToRefs(useAnswerStore()
)
const { currentTransactionLink } = storeToRefs(useZkAppStore())
const router = useRouter()

const surveyComplete = async (answer: any) => {
  answer.setValue("surveyId", id)
  await saveAnswer(answer.data)
  if (error.value) {
    ElNotification({
      title: 'Error saving answer',
      message: error.value,
      type: 'error',
      duration: 5000
    })
  } else {
    ElNotification({
      title: 'Success',
      message: `The answer will get counted as soon as it is validated on-chain. Transaction Hash : '+ ${currentTransactionLink.value}`,
      type: 'success',
      duration: 0
    })
  }
  router.push({ name: "home" });
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
