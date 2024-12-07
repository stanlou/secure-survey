import {
    Mina,
    PublicKey,
    fetchAccount,
    Field,
  } from 'o1js';
  
  import axios from 'axios';
  type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;
  
  // ---------------------------------------------------------------------------------------
  
  import type { SurveyContract, Answer , Survey,fieldsToJson } from 'secure-survey';
  
  interface VerificationKeyData {
    data: string;
    hash: Field;
  }
  
  const state = {
    SurveyContract: null as null | typeof SurveyContract,
    zkappInstance: null as null | SurveyContract,
    transaction: null as null | Transaction,
    verificationKey: null as null | VerificationKeyData | any, 
  };
  
  
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
    initZkappInstance: async (args: { publicKey58: string }) => {
      const publicKey = PublicKey.fromBase58(args.publicKey58);
      state.zkappInstance = new state.SurveyContract!(publicKey);
    }, 
    proveTransaction: async (args: {}) => {
      await state.transaction!.prove();
    },
    getTransactionJSON: async (args: {}) => {
      return state.transaction!.toJSON();
    },
    createSurveyTransaction: async (args: {}) => {
      
    }
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
  
  
  
  console.log('Web Worker Successfully Initialized.');