<template>
  <div>
    <div class="d-flex my-5">
      <el-button type="primary" @click="handleCreateSurvey">Create Survey</el-button>
    </div>
    <div v-for="survey in surveyList" :key="survey.id">
      <div class="w-100">
        <SurveyCard :survey="survey" />
      </div>
    </div>


  </div>
</template>

<script lang="ts" setup>

import { onMounted } from 'vue';
import { useSurveyStore } from '@/store/surveyModule';
import { storeToRefs } from 'pinia';
import SurveyCard from '@/components/cards/SurveyCard.vue';
import { useRouter } from 'vue-router';

const { getSurveyList } = useSurveyStore()
const { surveyList } = storeToRefs(useSurveyStore())
const router = useRouter()
const handleCreateSurvey = () => {
  router.push({name:'create-survey'})
}
onMounted(async () => {
  await getSurveyList();

})

</script>

<style scoped></style>