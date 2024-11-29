import { AccountUpdate, CircuitString, Field, MerkleMap, MerkleMapWitness, Mina, Poseidon, PrivateKey } from "o1js";
import { SurveyContract } from "./Survey.js";
import { jsonToFields } from "./helpers/jsonToFields.js";

const surveyZkAppPrivateKey = PrivateKey.random();
const surveyZkAppPublicKey = surveyZkAppPrivateKey.toPublicKey();

const Local = await Mina.LocalBlockchain();
Mina.setActiveInstance(Local);

const deployerAccount = Local.testAccounts[0];
const deployerKey = deployerAccount.key;
const senderPublicKey = Local.testAccounts[1];
const senderPrivateKey = senderPublicKey.key;


const zkApp = new SurveyContract(surveyZkAppPublicKey);
await SurveyContract.compile();

const suveyMerkleMap = new MerkleMap();

  const deployTxn = await Mina.transaction(deployerAccount, async () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    await zkApp.deploy();
    await zkApp.initState()
  });
  await deployTxn.prove();
  deployTxn.sign([deployerKey, surveyZkAppPrivateKey])


  const pendingDeployTx = await deployTxn.send();
  await pendingDeployTx.wait();
  
  console.log(suveyMerkleMap.getRoot().toString(),"main root ")
  console.log(zkApp.surveyMapRoot.get().toString(),"zk root ")

  const firstKey = Field(1)

  const surveyData = JSON.stringify({
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
  
  
  const fields = jsonToFields(surveyData);
  const surveyHash = Poseidon.hash(fields);


  const witness = suveyMerkleMap.getWitness(firstKey)

  const [ rootBefore, key ] = witness.computeRootAndKeyV2(Field(0));
  console.log(rootBefore.toString() , "main from witness") 

  suveyMerkleMap.set(Field(1),surveyHash);
  const [ rootAfter, _ ] = witness.computeRootAndKeyV2(surveyHash);
  console.log(rootAfter.toString(),"rootAfter ")


  const createSurveyTx1 = await Mina.transaction(senderPublicKey, async () => {
      await zkApp.saveSurvey(key,surveyHash,witness);
    });
  await createSurveyTx1.prove();
  createSurveyTx1.sign([senderPrivateKey]);

  const pendingSaveTx = await createSurveyTx1.send();
  await pendingSaveTx.wait();


  console.log(zkApp.surveyMapRoot.get().toString(),"zk rootAfter 1")
  const witness2 = suveyMerkleMap.getWitness(Field(2))

  suveyMerkleMap.set(Field(2),surveyHash);

  
  const createSurveyTx2 = await Mina.transaction(senderPublicKey, async () => {
    await zkApp.saveSurvey(Field(2),surveyHash,witness2);
  });
await createSurveyTx2.prove();
createSurveyTx2.sign([senderPrivateKey]);

const pendingSaveTx2 = await createSurveyTx2.send();
await pendingSaveTx2.wait();


console.log(zkApp.surveyMapRoot.get().toString(),"zk rootAfter 2")
