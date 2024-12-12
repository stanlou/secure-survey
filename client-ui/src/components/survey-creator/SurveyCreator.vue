
<template>
  <div>
    <SurveyCreatorComponent :model="creator" />
    <div @click="handleSaveSurvey">
      <el-button class="w-100" type="success" size="large">CREATE</el-button> 
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

settings.designer.defaultAddQuestionType = "radiogroup";



const creatorOptions: ICreatorOptions = {
  showLogicTab: true,
  isAutoSave: true,
  questionTypes: ["checkbox","dropdown","radiogroup","tagbox","boolean","ranking"],
};


const { saveSurvey } = useSurveyStore()

const creator = new SurveyCreatorModel(creatorOptions);

const handleSaveSurvey = async () => {

  await saveSurvey(creator.JSON)

}

onMounted(() => {
    const banner : any = document.getElementsByClassName("svc-creator__banner")[0]
    banner.style.opacity = 0
})
</script>
