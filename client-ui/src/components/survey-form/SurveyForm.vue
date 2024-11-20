<template>
  <SurveyComponent :model="surveyModel" v-if="surveyModel"/>
</template>
<script setup lang="ts">
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { SurveyComponent } from 'survey-vue3-ui';
import { onMounted, ref } from 'vue';
import axios from 'axios';
import { API_URL } from '../../webService/apiService';
import { useRoute } from 'vue-router';

const route = useRoute()
const id = route.params.id
const surveyJson = ref();
const surveyModel = ref();

const surveyComplete = (survey: any) => {

  console.log(survey.data)
}
// survey.onComplete.add(surveyComplete);
onMounted(async () => {
  const {data} =  await axios.get(API_URL+'/survey/findOne/'+id)
  surveyJson.value = data.survey.data.data
  surveyModel.value = new Model(surveyJson.value)
})
</script>
