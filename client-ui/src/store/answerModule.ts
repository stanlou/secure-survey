import axios from 'axios'
import { defineStore } from 'pinia'
import { useZkAppStore } from './zkAppModule'
import { AnswerType } from '../types'


const {createAnswer} = useZkAppStore()

const API_Base_URL = import.meta.env.VITE_API_URL
export const useAnswerStore = defineStore('answerModule', {
    state: () => ({ 
        answer:{}  as AnswerType,
        error: null  as any             
    }),
    getters: {},
    actions: {
      async saveAnswer(answerData:object) {
        try {
            const { data } = await axios.post(API_Base_URL+"/answer/save",answerData)
            await createAnswer(data.createAnswer)
        } catch(err) {
            this.error = err
        }finally {
          this.error = null
        }
      },
      async getAnswerById(id:string) {
        try {
            const {data} = await axios.get(API_Base_URL+"/answer/findOne/"+id)
            this.answer = data.answer   
        } catch(err) {
            this.error = err
        }
      }
    },
  
})