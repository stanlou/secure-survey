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
} from 'o1js';
import { ActionData, Answer, Survey, SurveyContract } from './Survey';
import {
  createAnswerStruct,
  createSurveyStruct,
} from './helpers/structConstructor';
import { ReduceProgram } from './ReduceProof';

let proofsEnabled = false;
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
    nullifierMerkleMap: MerkleMap;
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
    createSurveyStruct('2n', plainSurveyData),
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
      await SurveyContract.compile();
    }
  });
  const dummyAction = new ActionData({
    answer: createAnswerStruct('', '', createSurveyStruct('', '')),
    survey: createSurveyStruct('', ''),
    nullifier: Nullifier.fromJSON(
      Nullifier.createTestNullifier([], PrivateKey.random())
    ),
    isSurvey: Bool(false),
  });

  beforeEach(async () => {
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
  });
  const deploy = async () => {
    const deployTx = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy();
    });
    await deployTx.prove();
    await deployTx.sign([deployerKey, surveyZkAppPrivateKey]).send();
  };

  it('deploy survey smart contract', async () => {
    await deploy();
    const zkSurveyRoot = zkApp.surveyMapRoot.get();
    const zkAnswerRoot = zkApp.answerMapRoot.get();
    const zkNullifierRoot = zkApp.nullifierMapRoot.get();
    expect(zkSurveyRoot).toEqual(surveyMerkleMap.getRoot());
    expect(zkAnswerRoot).toEqual(answerMerkleMap.getRoot());
    expect(zkNullifierRoot).toEqual(nullifierMerkleMap.getRoot());
  });

  it('override smart contract states', async () => {
    let valid = true;
    try {
      await deploy();
      await deploy();
    } catch {
      valid = false;
    }
    expect(valid).toBeFalsy();
  });
  const createSurvey = async (survey: Survey) => {
    const createSurveyTx = await Mina.transaction(senderPublicKey, async () => {
      await zkApp.saveSurvey(survey);
    });
    await createSurveyTx.prove();
    createSurveyTx.sign([senderPrivateKey]);
    const pendingSaveTx = await createSurveyTx.send();
    await pendingSaveTx.wait();
  };
  it('create a new survey', async () => {
    await deploy();
    await createSurvey(testSurveys[0]);
  });
  it('overwrite a created survey', async () => {
    let valid = true;
    try {
      await deploy();
      await createSurvey(testSurveys[0]);
    } catch (err) {
      valid = false;
    }
  });
  it('create 2 surveys', async () => {
    await deploy();
    await createSurvey(testSurveys[0]);
    await createSurvey(testSurveys[1]);
  });
  it('create empty survey at key 0', async () => {
    let valid = true;
    const emptySurvey = new Survey({
      dbId: Field(0),
      data: Field(0),
    });
    try {
      await deploy();
      await createSurvey(emptySurvey);
    } catch {
      valid = false;
    }
  });
  const createAnswer = async (
    answer: Answer,
    answererPublicKey: PublicKey,
    answererPrivateKey: PrivateKey
  ) => {
    const nullifierKey = Poseidon.hash(
      answererPublicKey.toFields().concat([answer.survey.dbId])
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
  it('create a new answer', async () => {
    await deploy();
    await createSurvey(testSurveys[0]);
    await createAnswer(testAnswers[0][0], senderPublicKey, senderPrivateKey);
  });
  it('create 2 answers on same survey by same user', async () => {
    let valid = true;
    try {
      await deploy();
      await createSurvey(testSurveys[0]);

      await createAnswer(testAnswers[0][0], senderPublicKey, senderPrivateKey);
      await createAnswer(testAnswers[0][1], senderPublicKey, senderPrivateKey);
    } catch {
      valid = false;
    }
  });
  it('create 2 answers on same survey by different users', async () => {
    await deploy();
    await createSurvey(testSurveys[0]);

    await createAnswer(testAnswers[0][0], senderPublicKey, senderPrivateKey);
    await createAnswer(testAnswers[0][1], sender2PublicKey, sender2PrivateKey);
  });
  it('create 2 answers on different survey by same user', async () => {
    await deploy();
    await createSurvey(testSurveys[0]);
    await createSurvey(testSurveys[1]);

    await createAnswer(testAnswers[0][0], senderPublicKey, senderPrivateKey);
    await createAnswer(testAnswers[1][0], senderPublicKey, senderPrivateKey);
  });
  it('create empty answer', async () => {
    let valid = true;
    try {
      await deploy();
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

  it('overwrite a created answer', async () => {
    let valid = true;
    try {
      await deploy();
      await createSurvey(testSurveys[0]);

      await createAnswer(testAnswers[0][0], senderPublicKey, senderPrivateKey);
      await createAnswer(testAnswers[0][0], senderPublicKey, senderPrivateKey);
    } catch (err) {
      valid = false;
    }
  });
  it('create answer on inexistant survey ', async () => {
    let valid = true;
    try {
      await deploy();
      const answer = createAnswerStruct('0n', plainAnswerData, fakeSurveyId);
      await createAnswer(answer, senderPublicKey, senderPrivateKey);
    } catch (err) {
      valid = false;
    }
  });
  it('test recursive reducer', async () => {

    const { verificationKey } = await ReduceProgram.compile();

    let curLatestProcessedState = zkApp.lastProcessedActionState.get();

    let actions = await zkApp.reducer.fetchActions({
      fromActionState: curLatestProcessedState,
    });

    const surveyInitialRoot = zkApp.surveyMapRoot.get();
    const answerInitialRoot = zkApp.answerMapRoot.get();
    const nullifierInitialMapRoot = zkApp.nullifierMapRoot.get();
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

        const surveyWitness = Provable.if(
          action.isSurvey,
          MerkleMapWitness,
          surveyMerkleMap.getWitness(action.survey.dbId),
          surveyMerkleMap.getWitness(action.answer.survey.dbId)
        );
        const answerWitness = Provable.if(
          action.isSurvey,
          MerkleMapWitness,
          answerMerkleMap.getWitness(Field(0)),
          answerMerkleMap.getWitness(action.answer.dbId)
        );
        const nullifierKey = Poseidon.hash(
          senderPublicKey.toFields().concat([action.answer.survey.dbId])
        );
        let jsonNullifier = Nullifier.fromJSON(
          Nullifier.createTestNullifier([nullifierKey], senderPrivateKey)
        );

        const nullifierWitness = Provable.if(
          action.isSurvey,
          MerkleMapWitness,
          Provable.witness(MerkleMapWitness, () =>
            nullifierMerkleMap.getWitness(Field(0))
          ),
          Provable.witness(MerkleMapWitness, () =>
            nullifierMerkleMap.getWitness(jsonNullifier.key())
          )
        );

        curProof = await ReduceProgram.update(
          action,
          curProof.proof,
          surveyWitness,
          answerWitness,
          nullifierWitness,
          senderPublicKey
        );
        // check Provable method : if it evaluate both statements
        const surveyKey = Provable.if(
          action.isSurvey,
          action.survey.dbId,
          Field(0)
        );
        const surveyData = Provable.if(
          action.isSurvey,
          action.survey.data,
          Field(0)
        );
        const answerkey = Provable.if(
          action.isSurvey,
          Field(0),
          action.answer.dbId
        );
        const answerData = Provable.if(
          action.isSurvey,
          Field(0),
          action.answer.data
        );
        const nullifierMapKey = Provable.if(
          action.isSurvey,
          Field(0),
          action.nullifier.key()
        );
        const nullifierData = Provable.if(action.isSurvey, Field(0), Field(1));
        surveyMerkleMap.set(surveyKey, surveyData);
        answerMerkleMap.set(answerkey, answerData);
        nullifierMerkleMap.set(nullifierMapKey, nullifierData);
      }

      curProof = await ReduceProgram.cutActions(dummyAction, curProof.proof);
    }

    let tx = await Mina.transaction(senderPublicKey, async () => {
      await zkApp.updateStates(curProof.proof);
    });

    await tx.prove();
    await tx.sign([senderPrivateKey]).send();
  });
});
