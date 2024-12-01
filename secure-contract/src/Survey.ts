import { Field, MerkleMap, MerkleMapWitness, method, Poseidon, PublicKey, Signature, SmartContract, State, state } from "o1js";

export class SurveyContract extends SmartContract {

    @state(Field) surveyMapRoot = State<Field>();
    @state(Field) surveyCount = State<Field>();
    @state(Field) answerMapRoot = State<Field>();
    @state(Field) answerCount = State<Field>();
    @state(Field) nullifierMerkleRoot = State<Field>();


    @method async initState() {
        super.init();
        const surveyMerkleMap = new MerkleMap()
        const answerMerkleMap = new MerkleMap()
        this.surveyMapRoot.set(surveyMerkleMap.getRoot());
        this.surveyCount.set(Field(0)) 
        this.answerMapRoot.set(answerMerkleMap.getRoot());
        this.answerCount.set(Field(0)) 

      }
    
    @method async saveSurvey(keyToChange: Field , surveyHash: Field, witness: MerkleMapWitness) {
        const initialRoot = this.surveyMapRoot.getAndRequireEquals()
        const currentSurveyCount = this.surveyCount.getAndRequireEquals()
        const [ rootBefore, key ] = witness.computeRootAndKeyV2(Field(0));
        rootBefore.assertEquals(initialRoot);
        key.assertEquals(keyToChange);
        const [ rootAfter, _ ] = witness.computeRootAndKeyV2(surveyHash);
        this.surveyMapRoot.set(rootAfter)
        this.surveyCount.set(currentSurveyCount.add(Field(1)))
    
    }

    @method async saveAnswer(keyToChange: Field , answerHash: Field, answerWitness: MerkleMapWitness,
        surveyWitness: MerkleMapWitness,surveyKey:Field,surveyHash:Field,answererPublicKey:PublicKey
        ,nullifierWitness: MerkleMapWitness, signature:Signature) {
        const answerInitialRoot = this.answerMapRoot.getAndRequireEquals()
        const currentAnswerCount = this.answerCount.getAndRequireEquals()
        const surveyInitialRoot = this.answerMapRoot.getAndRequireEquals()
        const nullifierInitialRoot = this.nullifierMerkleRoot.getAndRequireEquals()
        const [ rootBefore, key ] = answerWitness.computeRootAndKeyV2(Field(0));
        rootBefore.assertEquals(answerInitialRoot);
        key.assertEquals(keyToChange);

        // check for signature
        const signatureMessage = Poseidon.hash(answererPublicKey.toFields().concat(answerHash,surveyKey))
        signature.verify(answererPublicKey,signatureMessage.toFields())

        // check for survey existance 
        // todo check if there are surveys before emitting answers
        const [currentSurveyRoot , currentSurveyKey] = surveyWitness.computeRootAndKeyV2(surveyHash)
        currentSurveyRoot.assertEquals(surveyInitialRoot);
        currentSurveyKey.assertEquals(surveyKey);


        // check for nullifier
        const nullifierKey = Poseidon.hash(answererPublicKey.toFields().concat([surveyKey]))
        const [currentNullifierRoot , currentNullifierKey] = nullifierWitness.computeRootAndKeyV2(Field(0))
        currentNullifierRoot.assertEquals(nullifierInitialRoot);
        currentNullifierKey.assertEquals(nullifierKey);


        const [ rootAfter, _ ] = answerWitness.computeRootAndKeyV2(answerHash);
        const [nullifierRootAfter , _key ] = nullifierWitness.computeRootAndKeyV2(Field(1))
        this.answerMapRoot.set(rootAfter)
        this.nullifierMerkleRoot.set(nullifierRootAfter)
        this.answerCount.set(currentAnswerCount.add(Field(1)))
    }
    
}