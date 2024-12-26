<template>
  <div>
    <div class="navbar-div">
      <Navbar/>
    </div>
    <div class="d-flex my-5 justify-content-end" style="width: 90%; justify-self: center;">
      <el-button class="create-survey-btn" type="primary" @click="handleCreateSurvey">Create Survey</el-button>
    </div>
    <div class="cards-list">
      <div v-for="survey in surveyList" :key="survey.id" class="d-flex justify-content-center">
      <div class="card">
        <SurveyCard :survey="survey" />
      </div>
    </div>
    </div>
   
  </div>
</template>

<script lang="ts" setup>

import { onMounted } from 'vue';
import { useSurveyStore } from '@/store/surveyModule';
import { storeToRefs } from 'pinia';
import SurveyCard from '@/components/cards/SurveyCard.vue';
import Navbar from '@/components/Navbar.vue';
import Footer from '@/components/Footer.vue';
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

<style scoped>
.create-survey-btn {
  padding: 25px 25px;
  --el-border-radius-base : 35px;
  --el-button-bg-color: #19b394;
  --el-button-border-color: none;
  --el-button-hover-bg-color: #19b394;
  --el-button-hover-border-color: #19b394;
}

.cards-list {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-direction: column;
  margin-bottom: 3rem;
}
.card {
  width: 90%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  --bs-card-border-color : none;
  --bs-card-border-radius: 16px;

}
.navbar-div {
  border-bottom: 2px solid #ececec;
}
</style>