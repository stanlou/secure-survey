import { defineStore } from 'pinia'
import ZkappWorkerClient from '../zkappWorkerClient'

export const useAuthStore = defineStore('auth', {
    state: () => ({ 
        zkappWorkerClient: null as null | ZkappWorkerClient,
        hasWallet: null as null | boolean,
        hasBeenSetup: false,
        accountExists: false,
        publicKey: null as null | any,
        zkappPublicKey: null as null | any,
        connecting: false,
        answering: false,
        answered: false,
     }),
    getters: {
            
    },
    actions: {
      
    },
  
})