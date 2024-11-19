
<template>
    <SurveyCreatorComponent :model="creator" />
</template>
<script setup lang="ts">
import 'survey-core/defaultV2.min.css';
import "survey-creator-core/survey-creator-core.min.css";
import type { ICreatorOptions } from "survey-creator-core";
import { SurveyCreatorModel } from "survey-creator-core";
import { SurveyCreatorComponent } from "survey-creator-vue";
import {onMounted} from 'vue'
const creatorOptions: ICreatorOptions = {
  showLogicTab: true,
  isAutoSave: true,
  questionTypes: ["checkbox","dropdown","radiogroup","tagbox","boolean","ranking"],

};
const creator = new SurveyCreatorModel(creatorOptions);
onMounted(() => {
    const banner = document.getElementsByClassName("svc-creator__banner")[0]
    banner.style.opacity = 0
})
</script>
