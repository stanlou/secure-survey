<template>
    <div class="px-3 pt-3 pb-2 survey-card__container">
        <div class="fs-3 fw-boldest">{{survey.data.title}}</div>
        <hr>
        <div class="d-flex justify-content-between flex-align-start mb-5">
            <div>{{  survey.data.description }}</div>
        </div>
        <div>
            <el-button class="participate-btn" type="primary" @click="handleParticipateClick">Participate</el-button>
            <el-button class="participate-btn" type="primary" @click="handleShowClick">Show result</el-button>
        </div>
    </div>
</template>
<script setup lang="ts">
import {useRouter} from 'vue-router';
import {SurveyType} from '../../types';
import { PropType } from 'vue';

const props = defineProps({
    survey:{
        required:true,
        type: Object as PropType<SurveyType>
    }
})
const router = useRouter()
const handleParticipateClick = () => {
    router.push({name:'answer-survey',params:{id:props.survey.id}})
}

const handleShowClick = () => {
    router.push({name:'dashboard',params:{id:props.survey.id}})
}
</script>
<style lang="css">
.survey-card__container {
    background: white;
}

.participate-btn {
  padding: 25px 25px;
  --el-border-radius-base : 35px;
  --el-button-bg-color: #19b394;
  --el-button-border-color: none;
  --el-button-hover-bg-color: #19b394;
  --el-button-hover-border-color: #19b394;
  --el-button-active-bg-color: #19b394;
  width: 130px;
}
</style>