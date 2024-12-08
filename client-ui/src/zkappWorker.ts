import {
    Mina,
    PublicKey,
    fetchAccount,
    Field,
    MerkleMap,
  } from 'o1js';
  
  import axios from 'axios';
  type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;
  

  import { SurveyContract, Answer , Survey,createSurveyStruct } from 'secure-survey';
  
  const API_Base_URL = import.meta.env.VITE_API_URL
  
  interface VerificationKeyData {
    data: string;
    hash: Field;
  }
  
  const state = {
    SurveyContract: null as null | typeof SurveyContract,
    zkappInstance: null as null | SurveyContract,
    transaction: null as null | Transaction,
    verificationKey: null as null | VerificationKeyData | any, 
    offChainStorage: null as null | OffChainStorage
  };
  
  class OffChainStorage {
    
    surveyMerkleMap: MerkleMap;  
    surveyCount : number;
    answerMerkleMap!: MerkleMap  
    answerCount!: number;  
    nullifierMerkleMap!: MerkleMap;
    constructor() {
      this.surveyMerkleMap = new MerkleMap()
      this.surveyCount = 0
      this.answerCount = 0 
      this.answerMerkleMap = new MerkleMap()
      this.nullifierMerkleMap = new MerkleMap()
    }   
    
    async loadOffChainState() {
      const {data:surveyListData}  = await axios.get(API_Base_URL+"/survey/findMany")
      this.surveyCount = surveyListData.surveyList?.length
      console.log(surveyListData,"surveyListDatasurveyListData")
      surveyListData.surveyList.map((e:any) => {
        const id = e.id
        const data = JSON.stringify(e.data)
        const survey = createSurveyStruct(id,data) 
        this.surveyMerkleMap.set(survey.dbId,survey.hash())
      })
      console.log(JSON.stringify(this.surveyMerkleMap.getRoot()))
    }
  }
  const functions = {
    setActiveInstanceToDevnet: async () =>  {
      const Network = Mina.Network('https://api.minascan.io/node/devnet/v1/graphql');
      console.log('Devnet network instance configured');
      Mina.setActiveInstance(Network);
    },  
    loadContract: async (args: {}) => {
      const { SurveyContract } = await import('secure-survey');
      state.SurveyContract = SurveyContract;
    },
    compileContract: async (args: {}) => {
      const { verificationKey } = await state.SurveyContract!.compile();
      state.verificationKey = verificationKey;
    },  

    fetchAccount: async (args: { publicKey58: string }) => {
      const publicKey = PublicKey.fromBase58(args.publicKey58);
      return await fetchAccount({ publicKey });
    },
    initZkappInstance: async (args: { publicKeyBase58: string }) => {
      const publicKey = PublicKey.fromBase58(args.publicKeyBase58);
      state.zkappInstance = new state.SurveyContract!(publicKey);
    }, 
    proveTransaction: async (args: {}) => {
      await state.transaction!.prove();
    },
    getTransactionJSON: async (args: {}) => {
      return state.transaction!.toJSON();
    },
   
    loadOffChainStorage: async (args:{}) => {
      let offChainStorage = new OffChainStorage()
      offChainStorage.loadOffChainState()
      state.offChainStorage = offChainStorage
      
    },
    createSurveyTransaction: async (args: {survey:any}) => {
      const surveyStruct = createSurveyStruct(args.survey.id,args.survey.data)
      const witness = state.offChainStorage!.surveyMerkleMap.getWitness(surveyStruct.dbId);
      state.transaction = await Mina.transaction(async () => {
        await state.zkappInstance!.saveSurvey(surveyStruct,witness)
      })
      state.transaction!.send()
    },
  };
  
  // ---------------------------------------------------------------------------------------
  
  export type WorkerFunctions = keyof typeof functions;
  
  export type ZkappWorkerRequest = {
    id: number;
    fn: WorkerFunctions;
    args: any;
  };
  
  export type ZkappWorkerReponse = {
    id: number;
    data: any;
  };
  
    addEventListener(
      'message',
      async (event: MessageEvent<ZkappWorkerRequest>) => {
        const returnData = await functions[event.data.fn](event.data.args);
  
        const message: ZkappWorkerReponse = {
          id: event.data.id,
          data: returnData,
        };
        postMessage(message);
      }
    );
  
  
  