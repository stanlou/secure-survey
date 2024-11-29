import { Field, MerkleMap, MerkleMapWitness, method, Poseidon, SmartContract, State, state } from "o1js";

export class SurveyContract extends SmartContract {

    @state(Field) surveyMapRoot = State<Field>();
    @state(Field) surveyCount = State<Field>();
    @state(Field) answerMapRoot = State<Field>();
    @state(Field) answerCount = State<Field>();


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
        this.surveyCount.set(currentSurveyCount.add(1))
    
    }
    
}