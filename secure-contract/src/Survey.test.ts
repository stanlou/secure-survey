import {
  AccountUpdate,
  Bool,
  Field,
  MerkleMap,
  Mina,
  Poseidon,
  PrivateKey,
  PublicKey,
  Signature,
} from 'o1js';
import { Answer, Survey, SurveyContract } from './Survey';
import { jsonToFields } from './helpers/jsonToFields';

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
  const createSurveyStruct = (dbId: bigint, surveyData: string) => {
    const hashedSurveyId = Poseidon.hash([Field(dbId)]);
    const hashedSurveyData = Poseidon.hash(jsonToFields(surveyData));
    return new Survey({
      dbId: hashedSurveyId,
      data: hashedSurveyData,
    });
  };
  const createAnswerStruct = (
    dbId: bigint,
    answerData: string,
    surveyId: bigint
  ) => {
    const hashedAnswerId = Poseidon.hash([Field(dbId)]);
    const hashedSurveyId = Poseidon.hash([Field(surveyId)]);
    const hashedAnswerData = Poseidon.hash(jsonToFields(answerData));
    return new Answer({
      dbId: hashedAnswerId,
      data: hashedAnswerData,
      surveyDbId: hashedSurveyId,
    });
  };
  const testSurveys = [
    createSurveyStruct(1n, plainSurveyData),
    createSurveyStruct(2n, plainSurveyData),
  ];
  const testAnswers = [
    [
      createAnswerStruct(1n, plainAnswerData, 1n),
      createAnswerStruct(3n, plainAnswerData, 1n),
    ],
    [createAnswerStruct(2n, plainAnswerData, 2n)],
  ];
  const fakeSurveyId = 100n;
  beforeAll(async () => {
    if (proofsEnabled) {
      await SurveyContract.compile();
    }
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
    const surveyCount = zkApp.surveyCount.get();
    const answerCount = zkApp.answerCount.get();
    const isInitialized = zkApp.isInitialized.get();
    expect(zkSurveyRoot).toEqual(surveyMerkleMap.getRoot());
    expect(zkAnswerRoot).toEqual(answerMerkleMap.getRoot());
    expect(zkNullifierRoot).toEqual(nullifierMerkleMap.getRoot());
    expect(surveyCount).toEqual(Field(0));
    expect(answerCount).toEqual(Field(0));
    expect(isInitialized).toEqual(Bool(true));
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
    const witness = surveyMerkleMap.getWitness(survey.dbId);
    const createSurveyTx = await Mina.transaction(senderPublicKey, async () => {
      await zkApp.saveSurvey(survey, witness);
    });
    await createSurveyTx.prove();
    createSurveyTx.sign([senderPrivateKey]);
    const pendingSaveTx = await createSurveyTx.send();
    await pendingSaveTx.wait();
    surveyMerkleMap.set(survey.dbId, survey.hash());
  };
  it('create a new survey', async () => {
    await deploy();
    await createSurvey(testSurveys[0]);
    expect(surveyMerkleMap.getRoot().toString()).toEqual(
      zkApp.surveyMapRoot.get().toString()
    );
    expect(zkApp.surveyCount.get()).toEqual(Field(1));
  });
  it('overwrite a created survey', async () => {
    let valid = true;
    try {
      await deploy();
      await createSurvey(testSurveys[0]);
      await createSurvey(testSurveys[0]);
    } catch (err) {
      valid = false;
    }
    expect(valid).toBeFalsy();
  });
  it('create 2 surveys', async () => {
    await deploy();
    await createSurvey(testSurveys[0]);
    await createSurvey(testSurveys[1]);
    expect(surveyMerkleMap.getRoot().toString()).toEqual(
      zkApp.surveyMapRoot.get().toString()
    );
    expect(zkApp.surveyCount.get()).toEqual(Field(2));
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
    expect(valid).toBeFalsy();
  });
  const createAnswer = async (
    answer: Answer,
    answererPublicKey: PublicKey,
    answererPrivateKey: PrivateKey
  ) => {
    const answerWitness = answerMerkleMap.getWitness(answer.dbId);
    const surveyWitness = surveyMerkleMap.getWitness(answer.surveyDbId);
    const answeredSurveyData = surveyMerkleMap.get(answer.surveyDbId);
    const nullifierKey = Poseidon.hash(
      answererPublicKey.toFields().concat([answer.surveyDbId])
    );

    const nullifierWitness = nullifierMerkleMap.getWitness(nullifierKey);
    const signature = Signature.create(
      answererPrivateKey,
      Poseidon.hash(
        answererPublicKey.toFields().concat([answer.surveyDbId])
      ).toFields()
    );
    const survey = new Survey({
      dbId: answer.surveyDbId,
      data: answeredSurveyData,
    });
    const createAnswerTx = await Mina.transaction(
      answererPublicKey,
      async () => {
        await zkApp.saveAnswer(
          answer,
          survey,
          answerWitness,
          surveyWitness,
          answererPublicKey,
          nullifierWitness,
          signature
        );
      }
    );
    await createAnswerTx.prove();
    createAnswerTx.sign([answererPrivateKey]);
    const pendingSaveTx = await createAnswerTx.send();
    await pendingSaveTx.wait();
    answerMerkleMap.set(answer.dbId, answer.hash());
    nullifierMerkleMap.set(nullifierKey, Field(1));
  };
  it('create a new answer', async () => {
    await deploy();
    await createSurvey(testSurveys[0]);

    await createAnswer(testAnswers[0][0], senderPublicKey, senderPrivateKey);

    expect(answerMerkleMap.getRoot().toString()).toEqual(
      zkApp.answerMapRoot.get().toString()
    );
    expect(nullifierMerkleMap.getRoot().toString()).toEqual(
      zkApp.nullifierMapRoot.get().toString()
    );
    expect(zkApp.answerCount.get()).toEqual(Field(1));
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
    expect(valid).toBeFalsy();
  });
  it('create 2 answers on same survey by different users', async () => {
    await deploy();
    await createSurvey(testSurveys[0]);

    await createAnswer(testAnswers[0][0], senderPublicKey, senderPrivateKey);
    await createAnswer(testAnswers[0][1], sender2PublicKey, sender2PrivateKey);
    expect(answerMerkleMap.getRoot().toString()).toEqual(
      zkApp.answerMapRoot.get().toString()
    );
    expect(nullifierMerkleMap.getRoot().toString()).toEqual(
      zkApp.nullifierMapRoot.get().toString()
    );
    expect(zkApp.answerCount.get()).toEqual(Field(2));
  });
  it('create 2 answers on different survey by same user', async () => {
    await deploy();
    await createSurvey(testSurveys[0]);
    await createSurvey(testSurveys[1]);

    await createAnswer(testAnswers[0][0], senderPublicKey, senderPrivateKey);
    await createAnswer(testAnswers[1][0], senderPublicKey, senderPrivateKey);
    expect(answerMerkleMap.getRoot().toString()).toEqual(
      zkApp.answerMapRoot.get().toString()
    );
    expect(nullifierMerkleMap.getRoot().toString()).toEqual(
      zkApp.nullifierMapRoot.get().toString()
    );
    expect(zkApp.answerCount.get()).toEqual(Field(2));
  });
  it('create empty answer', async () => {
    let valid = true;
    try {
      await deploy();
      await createSurvey(testSurveys[0]);
      const emptyAnswer = new Answer({
        dbId: Poseidon.hash([Field(1n)]),
        data: Field(0),
        surveyDbId: Field(1n),
      });
      await createAnswer(emptyAnswer, senderPublicKey, senderPrivateKey);
    } catch {
      valid = false;
    }
    expect(valid).toBeFalsy();
  });
  it('answer empty survey', async () => {
    let valid = true;
    try {
      await deploy();
      await createSurvey(testSurveys[0]);
      const answerEmptySurvey = createAnswerStruct(0n, plainAnswerData, 0n);
      await createAnswer(answerEmptySurvey, senderPublicKey, senderPrivateKey);
    } catch {
      valid = false;
    }
    expect(valid).toBeFalsy();
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
    expect(valid).toBeFalsy();
  });
  it('create answer on inexistant survey ', async () => {
    let valid = true;
    try {
      await deploy();
      const answer = createAnswerStruct(0n, plainAnswerData, fakeSurveyId);
      await createAnswer(answer, senderPublicKey, senderPrivateKey);
    } catch (err) {
      valid = false;
    }
    expect(valid).toBeFalsy();
  });
});
