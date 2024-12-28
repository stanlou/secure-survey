import {
  AccountUpdate,
  Bool,
  Field,
  MerkleMap,
  MerkleMapWitness,
  Mina,
  Nullifier,
  Poseidon,
  PrivateKey,
  Provable,
  PublicKey,
  Signature,
} from 'o1js';
import { Answer, Survey, SurveyContract } from './Survey';
import {
  createAnswerStruct,
  createSurveyStruct,
} from './helpers/structConstructor';
import { ReduceProgram } from './ReduceProof';
import { ActionData, DispatchData } from './structs/ActionData';

let proofsEnabled = true;
describe('Survey', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    surveyZkAppPublicKey: PublicKey,
    surveyZkAppPrivateKey: PrivateKey,
    senderPublicKey: PublicKey,
    senderPrivateKey: PrivateKey,
    sender2PublicKey: PublicKey,
    sender2PrivateKey: PrivateKey,
    zkApp: SurveyContract,
    surveyMerkleMap: MerkleMap,
    answerMerkleMap: MerkleMap,
    nullifierMerkleMap: MerkleMap,
    serverPrivateKey: PrivateKey;
  const plainSurveyData: string = JSON.stringify({
    logoPosition: 'right',
    pages: [
      {
        name: 'page1',
        elements: [
          {
            type: 'checkbox',
            name: 'question1',
            title: 'what is your favourite color',
            isRequired: true,
            choices: [
              { value: 'Item 1', text: 'Black' },
              { value: 'Item 2', text: 'White' },
              { value: 'Item 3', text: 'Red' },
            ],
          },
          {
            type: 'radiogroup',
            name: 'question2',
            title: 'who is the best player',
            isRequired: true,
            choices: [
              { value: 'Item 1', text: 'messi' },
              { value: 'Item 2', text: 'xavi' },
              { value: 'Item 3', text: 'iniesta' },
            ],
          },
          {
            type: 'tagbox',
            name: 'question3',
            title: 'choose your position',
            choices: [
              { value: 'Item 1', text: 'defender' },
              { value: 'Item 2', text: 'midfield' },
              { value: 'Item 3', text: 'attacker' },
            ],
          },
          {
            type: 'boolean',
            name: 'question4',
            title: 'are you rich',
          },
          {
            type: 'ranking',
            name: 'question6',
            choices: [
              { value: 'Item 1', text: 'css' },
              { value: 'Item 2', text: 'barca' },
              { value: 'Item 3', text: 'city' },
            ],
          },
          {
            type: 'dropdown',
            name: 'question5',
            title: 'where do you live',
            choices: [
              { value: 'Item 1', text: 'sfax' },
              { value: 'Item 2', text: 'tunis' },
              { value: 'Item 3', text: 'sousse' },
            ],
          },
        ],
      },
    ],
  });
  const plainSurvey2Data: string = JSON.stringify({
    logoPosition: 'right',
    pages: [
      {
        name: 'page1',
        elements: [
          {
            type: 'checkbox',
            name: 'question1',
            title: 'what is your favourite color',
            isRequired: true,
            choices: [
              { value: 'Item 1', text: 'Black' },
              { value: 'Item 3', text: 'Red' },
            ],
          },
          {
            type: 'radiogroup',
            name: 'question2',
            title: 'who is the best player',
            isRequired: true,
            choices: [
              { value: 'Item 2', text: 'xavi' },
              { value: 'Item 3', text: 'iniesta' },
            ],
          },
          {
            type: 'tagbox',
            name: 'question3',
            title: 'choose your position',
            choices: [
              { value: 'Item 1', text: 'defender' },
              { value: 'Item 3', text: 'attacker' },
            ],
          },
          {
            type: 'boolean',
            name: 'question4',
            title: 'are you rich',
          },
          {
            type: 'ranking',
            name: 'question6',
            choices: [
              { value: 'Item 1', text: 'css' },
              { value: 'Item 2', text: 'barca' },
            ],
          },
          {
            type: 'dropdown',
            name: 'question5',
            title: 'where do you live',
            choices: [
              { value: 'Item 1', text: 'sfax' },
              { value: 'Item 2', text: 'tunis' },
              { value: 'Item 3', text: 'sousse' },
            ],
          },
        ],
      },
    ],
  });
  const plainAnswerData: string = JSON.stringify({
    question1: ['Item 2'],
    question2: 'Item 2',
    question3: ['Item 1'],
    question4: false,
    question5: 'Item 3',
    question6: ['Item 2', 'Item 1', 'Item 3'],
  });

  
  const testSurveys = [
    createSurveyStruct('1n', plainSurveyData),
    createSurveyStruct('2n', plainSurvey2Data),
    createSurveyStruct('3n', plainSurvey2Data),
  ];
  const testAnswers = [
    [
      createAnswerStruct('1n', plainAnswerData, testSurveys[0]),
      createAnswerStruct('3n', plainAnswerData, testSurveys[0]),
    ],
    [createAnswerStruct('2n', plainAnswerData, testSurveys[1])],
  ];
  const fakeSurveyId = createSurveyStruct('100n', plainSurveyData);
  beforeAll(async () => {
    if (proofsEnabled) {
      console.time('compiling');
      await ReduceProgram.compile();
      console.timeEnd('compiling');
      console.time('zk');

      await SurveyContract.compile();
      console.timeEnd('zk');
    }
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    deployerAccount = Local.testAccounts[0];
    deployerKey = Local.testAccounts[0].key;
    senderPublicKey = Local.testAccounts[1];
    senderPrivateKey = Local.testAccounts[1].key;
    sender2PublicKey = Local.testAccounts[2];
    sender2PrivateKey = Local.testAccounts[2].key;
    surveyZkAppPrivateKey = PrivateKey.random();
    surveyZkAppPublicKey = surveyZkAppPrivateKey.toPublicKey();
    zkApp = new SurveyContract(surveyZkAppPublicKey);
    surveyMerkleMap = new MerkleMap();
    answerMerkleMap = new MerkleMap();
    nullifierMerkleMap = new MerkleMap();
    serverPrivateKey = PrivateKey.fromBase58(
      'EKFQqTacyEpCfqBRiMud58tU44AbXUB7T8JbvJVMfnzioRkyEpq8'
    );




  });

  const reduce = async () => {
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
        Nullifier.createTestNullifier([], senderPrivateKey)
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
    const serverSignature = Signature.create(serverPrivateKey, [
      surveyInitialRoot,
      answerInitialRoot,
      nullifierInitialMapRoot,
    ]);
    let tx = await Mina.transaction(senderPublicKey, async () => {
      await zkApp.updateStates(curProof.proof, serverSignature);
    });
    await tx.prove();
    await tx.sign([senderPrivateKey]).send();
  };
  const deploy = async () => {
    const deployTx = await Mina.transaction(senderPublicKey, async () => {
      AccountUpdate.fundNewAccount(senderPublicKey);
      await zkApp.deploy();
    });
    await deployTx.prove();
    await deployTx.sign([senderPrivateKey, surveyZkAppPrivateKey]).send();
  };
  it('deploy survey smart contract', async () => {
    await deploy();
    const zkSurveyRoot = zkApp.surveyMapRoot.get();
    const zkAnswerRoot = zkApp.answerMapRoot.get();
    const zkNullifierRoot = zkApp.nullifierMapRoot.get();
    const serverPublicKey = zkApp.serverPublicKey.get();

    expect(zkSurveyRoot).toEqual(surveyMerkleMap.getRoot());
    expect(zkAnswerRoot).toEqual(answerMerkleMap.getRoot());
    expect(zkNullifierRoot).toEqual(nullifierMerkleMap.getRoot());
    expect(serverPublicKey).toEqual(serverPrivateKey.toPublicKey());
  });

  const createSurvey = async (survey: Survey) => {
    const nullifierMessage = zkApp.nullifierMessage.get();
    const nullifierKey = Poseidon.hash(
      senderPublicKey.toFields().concat([survey.dbId, nullifierMessage])
    );
    const nullifier = Nullifier.fromJSON(
      Nullifier.createTestNullifier([nullifierKey], senderPrivateKey)
    );
    const createSurveyTx = await Mina.transaction(senderPublicKey, async () => {
      await zkApp.saveSurvey(survey, nullifier);
    });
    await createSurveyTx.prove();
    createSurveyTx.sign([senderPrivateKey]);
    const pendingSaveTx = await createSurveyTx.send();
    await pendingSaveTx.wait();
    0;
  };
  it('create 2 surveys', async () => {
    await createSurvey(testSurveys[0]);
    await createSurvey(testSurveys[1]);
  });
  it('reduce after creating 2 survey', async () => {
    await reduce();
  });
  const createAnswer = async (
    answer: Answer,
    answererPublicKey: PublicKey,
    answererPrivateKey: PrivateKey
  ) => {
    const nullifierMessage = zkApp.nullifierMessage.get();

    const nullifierKey = Poseidon.hash(
      answererPublicKey
        .toFields()
        .concat([answer.survey.dbId, nullifierMessage])
    );
    let nullifier = Nullifier.fromJSON(
      Nullifier.createTestNullifier([nullifierKey], answererPrivateKey)
    );

    const createAnswerTx = await Mina.transaction(
      answererPublicKey,
      async () => {
        await zkApp.saveAnswer(answer, nullifier);
      }
    );
    await createAnswerTx.prove();
    createAnswerTx.sign([answererPrivateKey]);
    const pendingSaveTx = await createAnswerTx.send();
    await pendingSaveTx.wait();
  };
  it('answer survey 1 by user 1', async () => {
    await createAnswer(testAnswers[0][0], senderPublicKey, senderPrivateKey);
  });
  it('answer survey 2 by user 1', async () => {
    await createAnswer(testAnswers[1][0], senderPublicKey, senderPrivateKey);
  });
  it('answer survey 1 by user 2', async () => {
    await createAnswer(testAnswers[0][1], sender2PublicKey, sender2PrivateKey);
  });
  it('reduce after answering 2 survey by 2 users', async () => {
    await reduce();
  });

  it('create 2 answers on same survey by same user', async () => {
    await createAnswer(testAnswers[0][0], senderPublicKey, senderPrivateKey);
  });
  it('should fail after create 2 answers on same survey by same user', async () => {
    let valid = true;
    try {
      await reduce();
    } catch {
      valid = false;
    }
    expect(valid).toBeFalsy();
  });

  it.skip('create empty answer', async () => {
    let valid = true;
    try {
      await createSurvey(testSurveys[0]);
      const emptyAnswer = new Answer({
        dbId: Poseidon.hash([Field(1n)]),
        data: Field(0),
        survey: testSurveys[0],
      });
      await createAnswer(emptyAnswer, senderPublicKey, senderPrivateKey);
    } catch {
      valid = false;
    }
  });

  it.skip('overwrite a created answer', async () => {
    let valid = true;
    try {
      await createSurvey(testSurveys[0]);

      await createAnswer(testAnswers[0][0], senderPublicKey, senderPrivateKey);
      await createAnswer(testAnswers[0][0], senderPublicKey, senderPrivateKey);
    } catch (err) {
      valid = false;
    }
  });
  it.skip('create answer on inexistant survey ', async () => {
    let valid = true;
    try {
      const answer = createAnswerStruct('0n', plainAnswerData, fakeSurveyId);
      await createAnswer(answer, senderPublicKey, senderPrivateKey);
    } catch (err) {
      valid = false;
    }
  });
});
