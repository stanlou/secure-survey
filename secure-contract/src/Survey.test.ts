import { AccountUpdate, Field, MerkleMap, Mina, Poseidon, PrivateKey, PublicKey } from "o1js";
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
  zkApp: SurveyContract,
  surveyMerkleMap: MerkleMap,
  answerMerkleMap: MerkleMap;
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
  const hashedSurveyData = Poseidon.hash(jsonToFields(plainSurveyData))
  const surveyId = Field(1) 
  const survey2Id = Field(2) 
  const answerId = Field(1)
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
     senderPublicKey = Local.testAccounts[0]
     senderPrivateKey = Local.testAccounts[0].key
     surveyZkAppPrivateKey = PrivateKey.random()
     surveyZkAppPublicKey = surveyZkAppPrivateKey.toPublicKey()
     zkApp = new SurveyContract(surveyZkAppPublicKey)
     surveyMerkleMap = new MerkleMap()
     answerMerkleMap = new MerkleMap()

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
    const surveyCount = zkApp.surveyCount.get()
    const answerCount = zkApp.answerCount.get()
    expect(zkSurveyRoot).toEqual(surveyMerkleMap.getRoot())
    expect(zkAnswerRoot).toEqual(answerMerkleMap.getRoot())
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
  const createAnswer = async () => {
    const witness = answerMerkleMap.getWitness(answerId)
    const createAnswerTx = await Mina.transaction(senderPublicKey, async()=> {
      await zkApp.saveAnswer(answerId,hashedSurveyData,witness)
    })
    await createAnswerTx.prove()
    createAnswerTx.sign([senderPrivateKey]);
    const pendingSaveTx = await createAnswerTx.send();
    await pendingSaveTx.wait();
  }
  // create answer , update nullifier , verify signature 
  // test create 1 answer 
  //test create 2 answers 
  // test override answer
  // test double answer 
  // test vote to existant survey
  // test vote to inexistant survey
  
  it("create a new answer",async() => {
    await deploy()
    await createAnswer()
    // todo: generate answer hash
    answerMerkleMap.set(answerId,hashedSurveyData)
    expect(answerMerkleMap.getRoot().toString()).toEqual(zkApp.answerMapRoot.get().toString())
    expect(zkApp.answerCount.get()).toEqual(Field(1))
  })

});
