import {
    Mina,
    PublicKey,
    fetchAccount,
    Field,
    Nullifier,
  } from 'o1js';
  
  import axios from 'axios';
  type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;
  
  // ---------------------------------------------------------------------------------------
  
  import type { SurveyContract } from 'secure-survey';
  
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
    async setActiveInstanceToDevnet() {
      const Network = Mina.Network('https://api.minascan.io/node/devnet/v1/graphql');
      console.log('Devnet network instance configured');
      Mina.setActiveInstance(Network);
    },  
    setActiveInstanceToLocal: async (proofsEnabled:boolean) => {
      console.log("setting active instance to Local with proof ",proofsEnabled)
      const Local = await Mina.LocalBlockchain({ proofsEnabled });
      Mina.setActiveInstance(Local);
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
  
  if (typeof window !== 'undefined') {
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
  }
  
  function NullifierToJson(nullifier: Nullifier) {
    const jsonNullifier = {
      private: {
        c: nullifier.private.c.toString(),
        g_r: {
          x: nullifier.private.g_r.x.toString(),
          y: nullifier.private.g_r.y.toString(),
        },
        h_m_pk_r: {
          x: nullifier.private.h_m_pk_r.x.toString(),
          y: nullifier.private.h_m_pk_r.y.toString(),
        },
      },
      public: {
        nullifier: {
          x: nullifier.public.nullifier.x.toString(),
          y: nullifier.public.nullifier.y.toString(),
        },
        s: nullifier.public.s.toString(),
      },
      publicKey: {
        x: nullifier.publicKey.x.toString(),
        y: nullifier.publicKey.y.toString(),
      },
    };
    return jsonNullifier;
  }
  
  console.log('Web Worker Successfully Initialized.');