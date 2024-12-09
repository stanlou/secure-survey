import axios from 'axios'
import { defineStore } from 'pinia'
import { useZkAppStore } from './zkAppModule'


const {createAnswer} = useZkAppStore()

const API_Base_URL = import.meta.env.VITE_API_URL
export const useAnswerStore = defineStore('answerModule', {
    state: () => ({ 
        answer:{}  as any,
        error: null  as any             
    }),
    getters: {},
    actions: {
      async saveAnswer(answerData:any) {
        try {
            const { data } = await axios.post(API_Base_URL+"/answer/save",answerData)
            await createAnswer(data)
        } catch(err :any) {
            this.error = err
        }
      },
      async getAnswerById(id:string) {
        try {
            const {data} = await axios.get(API_Base_URL+"/answer/findOne/"+id)
            this.answer = data.answer   
        } catch(err :any) {
            this.error = err
        }
      }
    },
  
})