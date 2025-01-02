<template>
  <div class="h-100">
    <div class="navbar-div">
      <Navbar />
    </div>
    <SurveyCreatorComponent :model="creator" />
    <div class="d-flex justify-content-end">
      <el-button class="create-btn" type="success" @click="handleSaveSurvey" size="large" :disabled="loading" element-loading-background="unset"
        v-loading="loading">{{ createButtonText }}</el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import 'survey-core/defaultV2.min.css';
import "survey-creator-core/survey-creator-core.min.css";
import type { ICreatorOptions } from "survey-creator-core";
import { SurveyCreatorModel } from "survey-creator-core";
import { SurveyCreatorComponent } from "survey-creator-vue";
import { computed, onMounted } from 'vue'
import { settings } from "survey-creator-core";
import { useSurveyStore } from '@/store/surveyModule';
import { useZkAppStore } from '@/store/zkAppModule';

import Navbar from '@/components/Navbar.vue';
import { useRouter } from 'vue-router';
import { ElNotification } from 'element-plus'
import { storeToRefs } from 'pinia';

settings.designer.defaultAddQuestionType = "radiogroup";



const creatorOptions: ICreatorOptions = {
  showLogicTab: true,
  isAutoSave: true,
  questionTypes: ["checkbox", "dropdown", "radiogroup", "tagbox", "boolean", "ranking"],
};

const { stepDisplay, hasBeenSetup, currentTransactionLink} = storeToRefs(useZkAppStore())
const { saveSurvey } = useSurveyStore()

const creator = new SurveyCreatorModel(creatorOptions);
const router = useRouter()
const createButtonText = computed(() => {
  return stepDisplay.value ? stepDisplay.value : "Create"
})
const loading = computed(() => {
  return !hasBeenSetup.value || stepDisplay.value !== ""
})
const btnBackground = computed(() => {
  return loading.value ? "#3ed6b7" : "#19b394"
})
const handleSaveSurvey = async () => {
  try {
    await saveSurvey(creator.JSON)
    ElNotification({
      title: 'Success',
      message: `The survey will be available as soon as it is validated on-chain. Transaction Hash : ${currentTransactionLink.value}`,
      type: 'success',
      duration:0,
    })
    router.push({ name: "home" });
  }
  catch {
    console.error("Failed to save survey");
  }

}

onMounted(() => {
  const banner: any = document.getElementsByClassName("svc-creator__banner")[0]
  banner.style.opacity = 0
})
</script>

<style scoped>
.navbar-div {
  border-bottom: 2px solid #ececec;
  margin-bottom: 2rem;
}

.create-btn {
  background: v-bind(btnBackground);
  border: none;
  padding: 26px 20px !important;
  margin-right: 2rem;
}

</style>
