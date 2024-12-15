import {
  Mina,
  PublicKey,
  fetchAccount,
  Field,
  MerkleMap,
  Nullifier,
  Provable,
  MerkleMapWitness,
} from "o1js";

import axios from "axios";
type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;
import {
  SurveyContract,
  Survey,
  createSurveyStruct,
  createAnswerStruct,
} from "secure-survey";
import { AnswerType, NullifierJson, NullifierType, SurveyType } from "./types";

const API_Base_URL = import.meta.env.VITE_API_URL;

interface VerificationKeyData {
  data: string;
  hash: Field;
}

const state = {
  SurveyContract: null as null | typeof SurveyContract,
  zkappInstance: null as null | SurveyContract,
  transaction: null as null | Transaction,
  verificationKey: null as null | VerificationKeyData | any,
  offChainStorage: null as null | OffChainStorage,
};

class OffChainStorage {
  surveyMerkleMap: MerkleMap;
  surveyCount: number;
  answerMerkleMap!: MerkleMap;
  answerCount!: number;
  nullifierMerkleMap!: MerkleMap;
  constructor() {
    this.surveyMerkleMap = new MerkleMap();
    this.surveyCount = 0;
    this.answerCount = 0;
    this.answerMerkleMap = new MerkleMap();
    this.nullifierMerkleMap = new MerkleMap();
  }

  async loadOffChainState() {
    const { data } = await axios.get(API_Base_URL + "/offchain/getAll");
    const surveyList = data.surveyList;
    const answerList = data.answerList;
    const nullifierList = data.nullifierList;

    this.surveyCount = surveyList?.length;
    surveyList.map((e:SurveyType) => {
      const id = e.id;
      const data = JSON.stringify(e.data);
      const survey = createSurveyStruct(id, data);
      this.surveyMerkleMap.set(survey.dbId, survey.hash());
    });
    this.answerCount = answerList?.length;
    answerList.map((answerJson: AnswerType) => {
      const id = answerJson.id;
      const data = JSON.stringify(answerJson.data);
      const survey = createSurveyStruct(answerJson.survey.id, JSON.stringify(answerJson.survey.data));

      const answer = createAnswerStruct(id, data, survey);
      this.answerMerkleMap.set(answer.dbId, answer.hash());
    });
    nullifierList.map((e: NullifierType) => {
      this.nullifierMerkleMap.set(Field(e.key), Field(1));
    });
  }
}
const functions = {
  setActiveInstanceToDevnet: async () => {
    const Network = Mina.Network(
      "https://api.minascan.io/node/devnet/v1/graphql"
    );
    console.log("Devnet network instance configured");
    Mina.setActiveInstance(Network);
  },
  loadContract: async (args: {}) => {
    const { SurveyContract } = await import("secure-survey");
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

  loadOffChainStorage: async (args: {}) => {
    let offChainStorage = new OffChainStorage();
    offChainStorage.loadOffChainState();
    state.offChainStorage = offChainStorage;
  },
  createSurveyWitness: async (args: { surveyId: Field }) => {
    return state.offChainStorage!.surveyMerkleMap.getWitness(args.surveyId);
  },
  createAnswerWitness: async (args: { answerId: Field }) => {
    return state.offChainStorage!.answerMerkleMap.getWitness(args.answerId);
  },
  createSurveyTransaction: async (args: { survey: SurveyType }) => {
    const surveyStruct = createSurveyStruct(
      args.survey.id,
      JSON.stringify(args.survey.data)
    );
    const witness = await functions.createSurveyWitness({
      surveyId: surveyStruct.dbId,
    });
    state.transaction = await Mina.transaction(async () => {
      await state.zkappInstance!.saveSurvey(surveyStruct, witness);
    });
    state.transaction!.send();
  },
  createAnswerTransaction: async (args: {
    answer: AnswerType;
    publicKeyBase58: string;
    jsonNullifier:NullifierJson
  }) => {
    const surveyStruct = createSurveyStruct(args.answer.survey.id,JSON.stringify(args.answer.survey.data))
    const answerStruct = createAnswerStruct(
      args.answer.id,
      JSON.stringify(args.answer.data),
      surveyStruct
    );

    const surveyWitness = await functions.createSurveyWitness({
      surveyId: answerStruct.survey.dbId,
    });

    const answerWitness = await functions.createAnswerWitness({
      answerId: answerStruct.dbId,
    });
    
    const answererPublicKey = PublicKey.fromBase58(args.publicKeyBase58);
    const nullifier = Nullifier.fromJSON(args.jsonNullifier)

    const nullifierWitness = Provable.witness(MerkleMapWitness, () =>
      state.offChainStorage!.nullifierMerkleMap.getWitness(nullifier.key())
    );

   
    state.transaction = await Mina.transaction(answererPublicKey, async () => {
      await state.zkappInstance!.saveAnswer(
        answerStruct,
        answerWitness,
        surveyWitness,
        answererPublicKey,
        nullifier,
        nullifierWitness,
        
      );
    });
    state.transaction!.send();
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

addEventListener("message", async (event: MessageEvent<ZkappWorkerRequest>) => {
  const returnData = await functions[event.data.fn](event.data.args);

  const message: ZkappWorkerReponse = {
    id: event.data.id,
    data: returnData,
  };
  postMessage(message);
});
