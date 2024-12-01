import { AccountUpdate, Field, MerkleMap, Mina, Poseidon, PrivateKey, PublicKey, Signature } from "o1js";
import { SurveyContract } from "./Survey";
import { jsonToFields } from "./helpers/jsonToFields";

let proofsEnabled = false
describe('Survey', () => {
  let deployerAccount: PublicKey,
  deployerKey: PrivateKey,
  surveyZkAppPublicKey: PublicKey,
  surveyZkAppPrivateKey:PrivateKey,
  senderPublicKey:PublicKey,
  senderPrivateKey:PrivateKey,
  sender2PublicKey:PublicKey,
  sender2PrivateKey:PrivateKey,
  zkApp: SurveyContract,
  surveyMerkleMap: MerkleMap,
  answerMerkleMap: MerkleMap,
  nullifierMerkleMap: MerkleMap;
  const plainSurveyData : string =JSON.stringify({
    logoPosition: "right",
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "checkbox",
            name: "question1",
            title: "what is your favourite color",
            isRequired: true,
            choices: [
              { value: "Item 1", text: "Black" },
              { value: "Item 2", text: "White" },
              { value: "Item 3", text: "Red" },
            ],
          },
          {
            type: "radiogroup",
            name: "question2",
            title: "who is the best player",
            isRequired: true,
            choices: [
              { value: "Item 1", text: "messi" },
              { value: "Item 2", text: "xavi" },
              { value: "Item 3", text: "iniesta" },
            ],
          },
          {
            type: "tagbox",
            name: "question3",
            title: "choose your position",
            choices: [
              { value: "Item 1", text: "defender" },
              { value: "Item 2", text: "midfield" },
              { value: "Item 3", text: "attacker" },
            ],
          },
          {
            type: "boolean",
            name: "question4",
            title: "are you rich",
          },
          {
            type: "ranking",
            name: "question6",
            choices: [
              { value: "Item 1", text: "css" },
              { value: "Item 2", text: "barca" },
              { value: "Item 3", text: "city" },
            ],
          },
          {
            type: "dropdown",
            name: "question5",
            title: "where do you live",
            choices: [
              { value: "Item 1", text: "sfax" },
              { value: "Item 2", text: "tunis" },
              { value: "Item 3", text: "sousse" },
            ],
          },
        ],
      },
    ],
  });
  const plainAnswerData: string = JSON.stringify({
    "question1": [
      "Item 2"
    ],
    "question2": "Item 2",
    "question3": [
      "Item 1"
    ],
    "question4": false,
    "question5": "Item 3",
    "question6": [
      "Item 2",
      "Item 1",
      "Item 3"
    ]
  })
  const hashedAnswerData = Poseidon.hash(jsonToFields(plainAnswerData))
  const hashedSurveyData = Poseidon.hash(jsonToFields(plainSurveyData))
  const surveyId = Field(1) 
  const survey2Id = Field(2) 
  const answerId = Field(1)
  const answer2Id = Field(2)
  const inexistantSurveyId  = Field(5)
  beforeAll(async() => {
    if(proofsEnabled){
      await SurveyContract.compile()
    }
  });

  beforeEach(async() => {
    const Local = await Mina.LocalBlockchain({proofsEnabled})
     Mina.setActiveInstance(Local);
     deployerAccount = Local.testAccounts[0]
     deployerKey = Local.testAccounts[0].key
     senderPublicKey = Local.testAccounts[1]
     senderPrivateKey = Local.testAccounts[1].key
     sender2PublicKey = Local.testAccounts[2]
     sender2PrivateKey = Local.testAccounts[2].key
     surveyZkAppPrivateKey = PrivateKey.random()
     surveyZkAppPublicKey = surveyZkAppPrivateKey.toPublicKey()
     zkApp = new SurveyContract(surveyZkAppPublicKey)
     surveyMerkleMap = new MerkleMap()
     answerMerkleMap = new MerkleMap()
     nullifierMerkleMap = new MerkleMap()
  })
  const deploy = async () => {
    const deployTx = await Mina.transaction(deployerAccount,async()=> {
       AccountUpdate.fundNewAccount(deployerAccount)
      await zkApp.deploy()
      await zkApp.initState()
    } )
    await deployTx.prove()
    await deployTx.sign([deployerKey,surveyZkAppPrivateKey]).send()
  }
  
  it("deploy survey smart contract",async() => {
    await deploy()
    const zkSurveyRoot = zkApp.surveyMapRoot.get()
    const zkAnswerRoot = zkApp.answerMapRoot.get()
    const zkNullifierRoot = zkApp.nullifierMapRoot.get()
    const surveyCount = zkApp.surveyCount.get()
    const answerCount = zkApp.answerCount.get()
    expect(zkSurveyRoot).toEqual(surveyMerkleMap.getRoot())
    expect(zkAnswerRoot).toEqual(answerMerkleMap.getRoot())
    expect(zkNullifierRoot).toEqual(nullifierMerkleMap.getRoot())

    expect(surveyCount).toEqual(Field(0))
    expect(answerCount).toEqual(Field(0))
  })
  const createSurvey = async (newSurveyId:Field,newSurveyData:Field) => {
    const witness = surveyMerkleMap.getWitness(newSurveyId)
    const createSurveyTx = await Mina.transaction(senderPublicKey, async()=> {
      await zkApp.saveSurvey(newSurveyId,newSurveyData,witness)
    })
    await createSurveyTx.prove()
    createSurveyTx.sign([senderPrivateKey]);
    const pendingSaveTx = await createSurveyTx.send();
    await pendingSaveTx.wait();
    surveyMerkleMap.set(newSurveyId,newSurveyData)  

  }
  it("create a new survey",async() => {
   await deploy()
   await createSurvey(surveyId,hashedSurveyData)
   expect(surveyMerkleMap.getRoot().toString()).toEqual(zkApp.surveyMapRoot.get().toString())
   expect(zkApp.surveyCount.get()).toEqual(Field(1))
  })
  it("overwrite a created survey",async() => {
    let valid = true
    try {
      await deploy()
      await createSurvey(surveyId,hashedSurveyData)
      await createSurvey(surveyId,hashedSurveyData)
      
    } catch(err) {
      valid = false
    }
    expect(valid).toBeFalsy()
  })
  it("create 2 surveys",async() => {
    await deploy()
    await createSurvey(surveyId,hashedSurveyData)
    await createSurvey(survey2Id,hashedSurveyData)
    expect(surveyMerkleMap.getRoot().toString()).toEqual(zkApp.surveyMapRoot.get().toString())
    expect(zkApp.surveyCount.get()).toEqual(Field(2))   
  })
  it("create empty survey at key field(0)",async() => {
    let valid = true
    try {
      await deploy()
      await createSurvey(Field(0),Field(0))
    }catch {
      valid = false
    }
    expect(valid).toBeFalsy()
  })
  const createAnswer = async (newAnswerId:Field , answeredSurveyKey:Field, newAnswerData:Field,answererPublicKey:PublicKey, answererPrivateKey:PrivateKey) => {
    const answerWitness = answerMerkleMap.getWitness(newAnswerId)
    const surveyWitness = surveyMerkleMap.getWitness(answeredSurveyKey)
    const answeredSurveyData = surveyMerkleMap.get(answeredSurveyKey)
    const nullifierKey = Poseidon.hash(answererPublicKey.toFields().concat([answeredSurveyKey]))

    const nullifierWitness = nullifierMerkleMap.getWitness(nullifierKey)
    const signature = Signature.create(
      answererPrivateKey,
      Poseidon.hash(answererPublicKey.toFields().concat([answeredSurveyKey])).toFields()
    );
    
    const createAnswerTx = await Mina.transaction(answererPublicKey, async()=> {
      await zkApp.saveAnswer(newAnswerId,newAnswerData,answerWitness,surveyWitness,answeredSurveyKey,answeredSurveyData,answererPublicKey,nullifierWitness,signature)
    })
    await createAnswerTx.prove()
    createAnswerTx.sign([answererPrivateKey]);
    const pendingSaveTx = await createAnswerTx.send();
    await pendingSaveTx.wait();
    answerMerkleMap.set(newAnswerId,newAnswerData)
    nullifierMerkleMap.set(nullifierKey,Field(1))

  }
  it("create a new answer",async() => {
    await deploy()
    await createSurvey(surveyId,hashedSurveyData)
    await createAnswer(answerId,surveyId,hashedAnswerData,senderPublicKey,senderPrivateKey)

    expect(answerMerkleMap.getRoot().toString()).toEqual(zkApp.answerMapRoot.get().toString())
    expect(nullifierMerkleMap.getRoot().toString()).toEqual(zkApp.nullifierMapRoot.get().toString())
    expect(zkApp.answerCount.get()).toEqual(Field(1))
  })
  it("create 2 answers on same survey by same user",async() => {
    let valid = true
    try {
      await deploy()
      await createSurvey(surveyId,hashedSurveyData)

      await createAnswer(answerId,surveyId,hashedAnswerData,senderPublicKey,senderPrivateKey)
      await createAnswer(answer2Id,surveyId,hashedAnswerData,senderPublicKey,senderPrivateKey)
  
    }catch {
      valid = false
    }
    expect(valid).toBeFalsy()
  })
  it("create 2 answers on same survey by different users",async() => {
    await deploy()
    await createSurvey(surveyId,hashedSurveyData)

    await createAnswer(answerId,surveyId,hashedAnswerData,senderPublicKey,senderPrivateKey)
    await createAnswer(answer2Id,surveyId,hashedAnswerData,sender2PublicKey,sender2PrivateKey)
    expect(answerMerkleMap.getRoot().toString()).toEqual(zkApp.answerMapRoot.get().toString())
    expect(nullifierMerkleMap.getRoot().toString()).toEqual(zkApp.nullifierMapRoot.get().toString())
    expect(zkApp.answerCount.get()).toEqual(Field(2))
  })
  it("create 2 answers on different survey by same user",async() => {
    await deploy()
    await createSurvey(surveyId,hashedSurveyData)
    await createSurvey(survey2Id,hashedSurveyData)

    await createAnswer(answerId,surveyId,hashedAnswerData,senderPublicKey,senderPrivateKey)
    await createAnswer(answer2Id,survey2Id,hashedAnswerData,senderPublicKey,senderPrivateKey)
    expect(answerMerkleMap.getRoot().toString()).toEqual(zkApp.answerMapRoot.get().toString())
    expect(nullifierMerkleMap.getRoot().toString()).toEqual(zkApp.nullifierMapRoot.get().toString())
    expect(zkApp.answerCount.get()).toEqual(Field(2))
  })
  it("create empty answer",async() => {
    let valid = true
    try {
      await deploy()
      await createSurvey(surveyId,hashedSurveyData)

      await createAnswer(answerId,surveyId,Field(0),senderPublicKey,senderPrivateKey)
    } catch {
      valid = false
    }
    expect(valid).toBeFalsy()
  })
  it("answer empty survey",async() => {
    let valid = true
    try {
      await deploy()
      await createSurvey(surveyId,hashedSurveyData)

      await createAnswer(answerId,Field(0),Field(0),senderPublicKey,senderPrivateKey)
    } catch {
      valid = false
    }
    expect(valid).toBeFalsy()
  })
  it("overwrite a created answer",async() => {
    let valid = true
    try {
      await deploy()
      await createSurvey(surveyId,hashedSurveyData)

      await createAnswer(answerId,surveyId,hashedAnswerData,senderPublicKey,senderPrivateKey)
      await createAnswer(answerId,surveyId,hashedAnswerData,senderPublicKey,senderPrivateKey)

    } catch(err) {
      valid = false
    }
    expect(valid).toBeFalsy()
  })
  it("create answer on inexistant survey ",async() => {
    let valid = true
    try {
      await deploy()
      await createSurvey(surveyId,hashedSurveyData)

      await createAnswer(answerId,inexistantSurveyId,hashedAnswerData,senderPublicKey,senderPrivateKey)
      
    } catch(err) {
      valid = false
    }
    expect(valid).toBeFalsy()
  })
});
