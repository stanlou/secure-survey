
<template>
  <div class="h-100">
    <div class="navbar-div">
      <Navbar/>
    </div>
    <SurveyCreatorComponent :model="creator" />
    <div @click="handleSaveSurvey" class="d-flex justify-content-end">
      <el-button class="create-btn" type="success" size="large">CREATE</el-button> 
    </div>
  </div>
</template>
<script setup lang="ts">
import 'survey-core/defaultV2.min.css';
import "survey-creator-core/survey-creator-core.min.css";
import type { ICreatorOptions } from "survey-creator-core";
import {  SurveyCreatorModel } from "survey-creator-core";
import { SurveyCreatorComponent } from "survey-creator-vue";
import {onMounted} from 'vue'
import { settings } from "survey-creator-core";
import { useSurveyStore } from '@/store/surveyModule';
import Navbar from '@/components/Navbar.vue';
import { useRouter } from 'vue-router';

settings.designer.defaultAddQuestionType = "radiogroup";



const creatorOptions: ICreatorOptions = {
  showLogicTab: true,
  isAutoSave: true,
  questionTypes: ["checkbox","dropdown","radiogroup","tagbox","boolean","ranking"],
};


const { saveSurvey } = useSurveyStore()

const creator = new SurveyCreatorModel(creatorOptions);
const router = useRouter()

const handleSaveSurvey = async () => {
try {
  await saveSurvey(creator.JSON)
  router.push({ name: "home" });
}
catch {
  console.error("Failed to save survey");
}

}

onMounted(() => {
    const banner : any = document.getElementsByClassName("svc-creator__banner")[0]
    banner.style.opacity = 0
})
</script>

<style scoped>
.navbar-div {
  border-bottom: 2px solid #ececec;
  margin-bottom: 2rem;
}
.create-btn {
  background: #19b394; 
  border: none;
  padding: 26px 20px !important;
  width: 120px;
  margin-right: 2rem;
}
</style>
