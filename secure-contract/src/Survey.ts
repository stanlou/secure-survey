import {
  Bool,
  Field,
  MerkleMap,
  MerkleMapWitness,
  method,
  Nullifier,
  Poseidon,
  PrivateKey,
  Provable,
  PublicKey,
  Reducer,
  SmartContract,
  State,
  state,
  Struct,
} from 'o1js';
import { createAnswerStruct } from './helpers/structConstructor';
import { ReduceProof } from './ReduceProof';

export class Survey extends Struct({
  dbId: Field, // Identifier for the survey
  data: Field, // Content of the survey
}) {
  hash(): Field {
    return Poseidon.hash(Survey.toFields(this));
  }
}

export class Answer extends Struct({
  dbId: Field, // Identifier for the answer
  survey: Survey, // Reference to the asnwered survey
  data: Field, // Content of the answer
}) {
  hash(): Field {
    return Poseidon.hash(Answer.toFields(this));
  }
}
export class ActionData extends Struct({
  isSurvey: Bool,
  survey: Survey,
  answer: Answer,
  nullifier: Nullifier,
  
}) {
  hash(): Field {
    return Poseidon.hash(ActionData.toFields(this));
  }
}

const INITIAL_MERKLE_MAP_ROOT = new MerkleMap().getRoot();
export class SurveyContract extends SmartContract {
  @state(Field) surveyMapRoot = State<Field>();
  @state(Field) surveyCount = State<Field>();
  @state(Field) answerMapRoot = State<Field>();
  @state(Field) answerCount = State<Field>();
  @state(Field) nullifierMapRoot = State<Field>();
  @state(Field) lastProcessedActionState = State<Field>();
 
  @state(Field) nullifierMessage = State<Field>();


  reducer = Reducer({ actionType: ActionData });

  init() {
    super.init();
    this.surveyMapRoot.set(INITIAL_MERKLE_MAP_ROOT);
    this.answerMapRoot.set(INITIAL_MERKLE_MAP_ROOT);
    this.nullifierMapRoot.set(INITIAL_MERKLE_MAP_ROOT);
  }

  // Method to reinitialize the smart contract states , only used for development
  @method async initState() {
    const currentSurveyRoot = this.surveyMapRoot.getAndRequireEquals();
    const currentAnswerRoot = this.answerMapRoot.getAndRequireEquals();
    const currentNullifierRoot = this.nullifierMapRoot.getAndRequireEquals();
    const currentSurveyCount = this.surveyCount.getAndRequireEquals();
    const currentAnswerCount = this.answerCount.getAndRequireEquals();

    this.surveyMapRoot.set(INITIAL_MERKLE_MAP_ROOT);
    this.answerMapRoot.set(INITIAL_MERKLE_MAP_ROOT);
    this.nullifierMapRoot.set(INITIAL_MERKLE_MAP_ROOT);
    this.surveyCount.set(Field(0));
    this.answerCount.set(Field(0));
  }
  // Method to save a survey in the Merkle tree
  @method async saveSurvey(survey: Survey) {
    const answer = createAnswerStruct('', '', survey);
    const dispatchedData = new ActionData({answer,survey,isSurvey: Bool(true),nullifier: Nullifier.fromJSON(
      Nullifier.createTestNullifier([], PrivateKey.random())
    ),})
    this.reducer.dispatch(dispatchedData);
  }

  // Method to save an answer to a survey
  @method async saveAnswer(
    answer: Answer,
    nullifier: Nullifier,
  ) {
    const dispatchedData = new ActionData({answer,nullifier,isSurvey:Bool(false),survey:answer.survey})
    this.reducer.dispatch(dispatchedData)
  }

  @method async updateStates(
    reduceProof: ReduceProof
  ) {
    reduceProof.verify();

    const lastProcessedActionState =
      this.lastProcessedActionState.getAndRequireEquals();
      const currentSurveyRoot = this.surveyMapRoot.getAndRequireEquals();
      const currentAnswerRoot = this.answerMapRoot.getAndRequireEquals();
      const currentNullifierRoot = this.nullifierMapRoot.getAndRequireEquals();
  
    // Proof inputs check
    reduceProof.publicOutput.initialActionState.assertEquals(
      lastProcessedActionState
    );
    reduceProof.publicOutput.initialSurveyMapRoot.assertEquals(currentSurveyRoot);
    reduceProof.publicOutput.initialAnswerMapRoot.assertEquals(currentAnswerRoot);
    reduceProof.publicOutput.initialNullifierMapRoot.assertEquals(currentNullifierRoot);

    this.account.actionState.requireEquals(
      reduceProof.publicOutput.actionListState
    );

    this.surveyMapRoot.set(reduceProof.publicOutput.finalSurveyMapRoot);
    this.answerMapRoot.set(reduceProof.publicOutput.finalAnswerMapRoot);
    this.nullifierMapRoot.set(reduceProof.publicOutput.finalNullifierMapRoot);
    this.lastProcessedActionState.set(reduceProof.publicOutput.actionListState);
  }

}
