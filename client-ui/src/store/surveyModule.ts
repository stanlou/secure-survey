import axios from 'axios'
import { defineStore } from 'pinia'
import {useZkAppStore } from "@/store/zkAppModule"

const {createSurvey} = useZkAppStore()
const API_Base_URL = import.meta.env.VITE_API_URL
export const useSurveyStore = defineStore('surveyModule', {
    state: () => ({ 
        survey:{}  as any,
        surveyList: [] as any,   
        error: null  as any             
    }),
    getters: {},
    actions: {
      async getSurveyList(options:any) {
        try {
            const {data} = await axios.get(API_Base_URL+"/survey/findMany")
            this.surveyList = data?.surveyList    
        } catch(err :any) {
            this.error = err
        }
      },
      async saveSurvey(surveyData:any) {
        try {
            const {data} = await axios.post(API_Base_URL+"/survey/save",surveyData)
            this.surveyList = [...this.surveyList , data.createdSurvey]    
            await createSurvey(data.createdSurvey)
        } catch(err :any) {
            this.error = err
        }
      },
      async getSurveyById(id:string) {
        try {
            const {data} = await axios.get(API_Base_URL+"/survey/findOne/"+id)
            this.survey = data.survey   
        } catch(err :any) {
            this.error = err
        }
      }
    },
  
})