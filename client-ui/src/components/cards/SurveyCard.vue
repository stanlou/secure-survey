<template>
    <div class="px-3 pt-3 pb-2 survey-card__container">
        <div class="fs-3 fw-boldest mb-5">survey.title</div>
        <div class="d-flex justify-content-between flex-align-start mb-5">
            <div>survey.description</div>
            <div>
                <div>survey._count.answer</div>
                <div>survey.questionCount</div>

            </div>

        </div>
        <div>
            <el-button type="primary" @click="handleParticipateClick">Participate</el-button>
        </div>
    </div>
</template>
<script setup lang="ts">
import {useRouter} from 'vue-router';
const props = defineProps({
    survey:{
        required:true
    }
})
const router = useRouter()
const handleParticipateClick = (survey:any) => {
    router.push({name:'answer-survey',params:{id:props.survey.id}})
}
</script>
<style lang="css">
.survey-card__container {
    background: #eeeee4;
}
</style>