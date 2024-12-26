<template>
  <div>
    <div class="navbar-div">
      <Navbar />
    </div>
    <div id="surveyVizPanel" />
  </div>
</template>

<script lang="ts" setup>
import 'survey-analytics/survey.analytics.min.css';
import { Model } from 'survey-core';
import { VisualizationPanel } from 'survey-analytics';
import Navbar from '@/components/Navbar.vue';
import axios from 'axios';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

const API_Base_URL = import.meta.env.VITE_API_URL;
const route = useRoute()
const id = route.params.id




const vizPanelOptions = {
  allowHideQuestions: false
};

onMounted(async () => {
  try {
    const { data } = await axios.get(`${API_Base_URL}/survey/findOne/answers/${id}`);
    const survey = new Model(data.survey.data);
    const surveyResults = data.survey.answers
    const vizPanel = new VisualizationPanel(
      survey.getAllQuestions(),
      surveyResults,
      vizPanelOptions
    );
    vizPanel.render("surveyVizPanel");
  } catch (error) {
    console.error('Error fetching survey data:', error);
  }
});
</script>

<style scoped>
:deep(.sa-visualizer__toolbar) {
  display: none;
}
:deep(.sa-panel__header) {
  display: none;
}
.navbar-div {
  border-bottom: 2px solid #ececec;
}
</style>
