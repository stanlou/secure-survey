
<template>
  <div>
    <SurveyCreatorComponent :model="creator" />
    <div style="width:100%;background-color: blue;color: white;" @click="handleSaveSurvey">CREATE</div>
  </div>
</template>
<script setup lang="ts">
import 'survey-core/defaultV2.min.css';
import "survey-creator-core/survey-creator-core.min.css";
import type { ICreatorOptions } from "survey-creator-core";
import { copyObject, SurveyCreatorModel } from "survey-creator-core";
import { SurveyCreatorComponent } from "survey-creator-vue";
import {onMounted} from 'vue'
import axios from 'axios'



const creatorOptions: ICreatorOptions = {
  showLogicTab: true,
  isAutoSave: true,
  questionTypes: ["checkbox","dropdown","radiogroup","tagbox","boolean","ranking"],
};

const API_URL = import.meta.env.VITE_API_URL;


const creator = new SurveyCreatorModel(creatorOptions);

const handleSaveSurvey = async () : Promise<any> => {
  console.log("ddd",creator.JSON)
   await axios.post(API_URL+'/survey/saveSurvey',creator.JSON)
}

onMounted(() => {
    const banner : any = document.getElementsByClassName("svc-creator__banner")[0]
    banner.style.opacity = 0
})
</script>
