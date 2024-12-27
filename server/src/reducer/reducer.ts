import {
  Bool,
  Field,
  MerkleMap,
  MerkleMapWitness,
  Mina,
  Nullifier,
  PrivateKey,
  Provable,
  PublicKey,
} from "o1js";
import {
  DispatchData,
  Survey,
  ActionData,
  SurveyContract,
  ReduceProgram,
  Answer,
  createSurveyStruct,
  createAnswerStruct,
} from "secure-survey";
import { loopUntilAccountExists } from "../utils";
const fs = require("fs");
import { Client } from "mina-signer";
import prisma from "../../prisma/client";
const client = new Client({ network: "testnet" }); // Mind the `network` client configuration option

export const reduceActions = async () => {
  const Network = Mina.Network(
    "https://api.minascan.io/node/devnet/v1/graphql"
  );
  Mina.setActiveInstance(Network);

  const transactionFee = 100_000_000;

  const seerverKeysFileContents = fs.readFileSync("keys/devnet.json", "utf8");
  const serverPrivateKeyBase58 = JSON.parse(seerverKeysFileContents).privateKey;

  const serverPrivateKey = PrivateKey.fromBase58(serverPrivateKeyBase58);
  const serverPublicKey = serverPrivateKey.toPublicKey();

  const zkAppPublicKeyBase58 =
    "B62qrFgEPmGTWW4KG4TQWuhPvufD6gkMSjnZ4UTZbxm4S1kUDUyD6oJ";
  const zkAppPublicKey = PublicKey.fromBase58(zkAppPublicKeyBase58);

  // ----------------------------------------------------

  let account = await loopUntilAccountExists({
    account: serverPublicKey,
    eachTimeNotExist: () => {
      console.log(
        "Deployer account does not exist. " +
          "Request funds at faucet " +
          "https://faucet.minaprotocol.com/?address=" +
          serverPublicKey.toBase58()
      );
    },
    isZkAppAccount: false,
  });

  console.log(
    `Using fee payer account with nonce ${account.nonce}, balance ${account.balance}`
  );

  // ----------------------------------------------------

  console.log("Compiling smart contract...");
  await ReduceProgram.compile()
  let { verificationKey } = await SurveyContract.compile();

  let zkApp = new SurveyContract(zkAppPublicKey);

  await loopUntilAccountExists({
    account: zkAppPublicKey,
    eachTimeNotExist: () =>
      console.log("waiting for zkApp account to be deployed..."),
    isZkAppAccount: true,
  });

  const [nullifierList, surveyList, answerList] = await Promise.all([
    prisma.nullifier.findMany({}),
    prisma.survey.findMany({}),
    prisma.answer.findMany({
      select: {
        id: true,
        data: true,
        status: true,
        survey: {
          select: {
            data: true,
            id: true,
          },
        },
      },
    }),
  ]);

  const surveyMerkleMap = new MerkleMap();
  const answerMerkleMap = new MerkleMap();
  const nullifierMerkleMap = new MerkleMap();
  const pendingSurveys = [];
  const pendingAnswers = [];
  const pendingNullifiers = [];
  const succeededSurveys = []
  const succeededAnswers = []
  const succeededNullifiers = []
  surveyList.map((e) => {
    const id = e.id;
    const data = JSON.stringify(e.data);
    const survey = createSurveyStruct(id, data);
    if (e.status === "SUCCEEDED") {
      surveyMerkleMap.set(survey.dbId, survey.hash());
    } else {
      pendingSurveys.push({
        id: e.id,
        hash: survey.hash(),
      });
    }
  });
  answerList.map((answerJson) => {
    const id = answerJson.id;
    const data = JSON.stringify(answerJson.data);
    const survey = createSurveyStruct(
      answerJson.survey.id,
      JSON.stringify(answerJson.survey.data)
    );
    const answer = createAnswerStruct(id, data, survey);
    if (answerJson.status === "SUCCEEDED") {
      answerMerkleMap.set(answer.dbId, answer.hash());
    } else {
        pendingAnswers.push({
            id:answerJson.id,
            hash: answer.hash()
        })
    }
  });
  // todo : save nullifier.key() into database when creating answer
  nullifierList.map((e) => {
    if (e.status === "SUCCEEDED") {
    nullifierMerkleMap.set(Field(e.key), Field(1));
    }else{
        pendingNullifiers.push(e.key)
    }
  });

  let curLatestProcessedState = zkApp.lastProcessedActionState.get();
  let actions = await zkApp.reducer.fetchActions({
    fromActionState: curLatestProcessedState,
  });

  const dummyAction = new ActionData({
    content: new DispatchData({
      answerData: Field(0),
      answerDbId: Field(0),
      surveyData: Field(0),
      surveyDbId: Field(0),
    }),
    nullifier: Nullifier.fromJSON(
      client.createNullifier([], serverPrivateKeyBase58)
    ),
    isSurvey: Bool(false),
  });

  const surveyInitialRoot = zkApp.surveyMapRoot.get();
  const answerInitialRoot = zkApp.answerMapRoot.get();
  const nullifierInitialMapRoot = zkApp.nullifierMapRoot.get();
  const nullifierMessage = zkApp.nullifierMessage.get();

  let initPublicInput = dummyAction;
  let curProof = await ReduceProgram.init(
    initPublicInput,
    surveyInitialRoot,
    answerInitialRoot,
    nullifierInitialMapRoot,
    curLatestProcessedState
  );
  for (let i = 0; i < actions.length; i++) {
    for (let j = 0; j < actions[i].length; j++) {
      let action = actions[i][j];
          
      const surveyKey = action.content.surveyDbId;
      const surveyData = action.content.surveyData;

      const survey = new Survey({
        dbId: surveyKey,
        data: surveyData,
      });

      const answerkey = action.content.answerDbId;
      const answerData = action.content.answerData;

      const answer = new Answer({
        dbId: answerkey,
        data: answerData,
        survey,
      });

      const nullifierMapKey = action.nullifier.key();
      const nullifierData = Provable.if(action.isSurvey, Field(0), Field(1));

      // check database 

      




      const surveyWitness = surveyMerkleMap.getWitness(
        action.content.surveyDbId
      );
      const answerWitness = Provable.if(
        action.isSurvey,
        MerkleMapWitness,
        answerMerkleMap.getWitness(Field(0)),
        answerMerkleMap.getWitness(action.content.answerDbId)
      );

      const nullifierWitness = Provable.witness(MerkleMapWitness, () =>
        nullifierMerkleMap.getWitness(action.nullifier.key())
      );

      curProof = await ReduceProgram.update(
        action,
        curProof.proof,
        surveyWitness,
        answerWitness,
        nullifierWitness,
        nullifierMessage
      );


      surveyMerkleMap.set(surveyKey, survey.hash());
      answerMerkleMap.set(
        answerkey,
        Provable.if(action.isSurvey, Field(0), answer.hash())
      );
      nullifierMerkleMap.set(
        Provable.if(action.isSurvey, Field(0), nullifierMapKey),
        nullifierData
      );
    }
    curProof = await ReduceProgram.cutActions(dummyAction, curProof.proof);
  }
  let tx = await Mina.transaction(serverPublicKey, async () => {
    await zkApp.updateStates(curProof.proof);
  });
  await tx.prove();
  await tx.sign([serverPrivateKey]).send();
};
