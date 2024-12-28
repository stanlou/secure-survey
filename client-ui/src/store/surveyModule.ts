import axios from 'axios'
import { defineStore } from 'pinia'
import {useZkAppStore } from "@/store/zkAppModule"
import { SurveyType } from '../types'

const {createSurvey} = useZkAppStore()
const API_Base_URL = import.meta.env.VITE_API_URL
export const useSurveyStore = defineStore('surveyModule', {
    state: () => ({ 
        survey:{}  as SurveyType,
        surveyList: [] as SurveyType[],   
        error: null  as any             
    }),
    getters: {},
    actions: {
      async getSurveyList() {
        try {
            const {data} = await axios.get(API_Base_URL+"/survey/findMany")
            this.surveyList = data?.surveyList    
        } catch(err) {
            this.error = err
        }
      },
      async saveSurvey(surveyData:object) {
        try {
            const {data} = await axios.post(API_Base_URL+"/survey/save",surveyData)
            await createSurvey(data.createdSurvey)
        } catch(err) {
            this.error = err
        }
      },
      async getSurveyById(id:string) {
        try {
            const {data} = await axios.get(API_Base_URL+"/survey/findOne/"+id)
            this.survey = data.survey   
        } catch(err) {
            this.error = err
        }
      }
    },
  
})