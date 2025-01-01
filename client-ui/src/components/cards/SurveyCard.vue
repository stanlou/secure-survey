<template>
    <div class="px-3 pt-3 pb-2 survey-card__container">
        <div class="fs-3 fw-boldest">{{ survey.data.title }}</div>
        <hr>
        <div class="d-flex justify-content-between flex-align-start mb-5">
            <div>{{ survey.data.description }}</div>
        </div>
        <div>
            <el-button class="participate-btn" type="primary" @click="handleParticipateClick" :disabled="loading"
                element-loading-background="unset" v-loading="loading">{{ createButtonText }}</el-button>
            <el-button class="participate-btn" type="primary" @click="handleShowClick">Show result</el-button>
        </div>
    </div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { SurveyType } from '../../types';
import { computed, PropType } from 'vue';
import { storeToRefs } from 'pinia';
import { useZkAppStore } from '@/store/zkAppModule';

const { stepDisplay, hasBeenSetup, } = storeToRefs(useZkAppStore())

const props = defineProps({
    survey: {
        required: true,
        type: Object as PropType<SurveyType>
    }
})
const router = useRouter()
const handleParticipateClick = () => {
    router.push({ name: 'answer-survey', params: { id: props.survey.id } })
}

const handleShowClick = () => {
    router.push({ name: 'dashboard', params: { id: props.survey.id } })
}
const createButtonText = computed(() => {
    return stepDisplay.value ? stepDisplay.value : "Participate"
})
const loading = computed(() => {
    return !hasBeenSetup.value || stepDisplay.value !== ""
})
const btnBackground = computed(() => {
    return loading.value ? "#3ed6b7" : "#19b394"
})

</script>
<style scoped>
.survey-card__container {
    background: white;
}

.participate-btn {
  background: v-bind(btnBackground);
  border: none;
  padding: 26px 20px !important;
  margin-right: 2rem;
  border-radius: 35px;
}
</style>