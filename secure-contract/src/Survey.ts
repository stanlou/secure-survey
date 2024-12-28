import {
  Bool,
  Field,
  MerkleMap,
  method,
  Nullifier,
  Poseidon,
  PublicKey,
  Reducer,
  Signature,
  SmartContract,
  State,
  state,
  Struct,
} from 'o1js';
import { ReduceProof } from './ReduceProof.js';
import { ActionData, DispatchData } from './structs/ActionData.js';

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
const serverPublicKeyBase58 =
  'B62qihpfJjEcwDYkLhHoTAST1uFChgStMSM2mLVdPB5ybSRqKkocXao';
const INITIAL_MERKLE_MAP_ROOT = new MerkleMap().getRoot();
export class SurveyContract extends SmartContract {
  @state(Field) surveyMapRoot = State<Field>();
  @state(Field) answerMapRoot = State<Field>();
  @state(Field) nullifierMapRoot = State<Field>();
  @state(Field) nullifierMessage = State<Field>();
  @state(PublicKey) serverPublicKey = State<PublicKey>();

  @state(Field) lastProcessedActionState = State<Field>();

  reducer = Reducer({ actionType: ActionData });

  init() {
    super.init();
    this.surveyMapRoot.set(INITIAL_MERKLE_MAP_ROOT);
    this.answerMapRoot.set(INITIAL_MERKLE_MAP_ROOT);
    this.nullifierMapRoot.set(INITIAL_MERKLE_MAP_ROOT);
    this.lastProcessedActionState.set(Reducer.initialActionState);
    this.nullifierMessage.set(Field.random());
    this.serverPublicKey.set(PublicKey.fromBase58(serverPublicKeyBase58));
  }

  // Method to reinitialize the smart contract states , only used for development
  @method async initState() {
    this.surveyMapRoot.set(INITIAL_MERKLE_MAP_ROOT);
    this.answerMapRoot.set(INITIAL_MERKLE_MAP_ROOT);
    this.nullifierMapRoot.set(INITIAL_MERKLE_MAP_ROOT);
  }

  // Method to save a survey in the Merkle tree
  @method async saveSurvey(survey: Survey, nullifier: Nullifier) {
    const dispatchContent = new DispatchData({
      answerDbId: Field(0),
      surveyDbId: survey.dbId,
      answerData: Field(0),
      surveyData: survey.data,
    });
    const dispatchedData = new ActionData({
      content: dispatchContent,
      nullifier,
      isSurvey: Bool(true),
    });
    this.reducer.dispatch(dispatchedData);
  }

  // Method to save an answer to a survey
  @method async saveAnswer(answer: Answer, nullifier: Nullifier) {
    const dispatchContent = new DispatchData({
      answerDbId: answer.dbId,
      surveyDbId: answer.survey.dbId,
      answerData: answer.data,
      surveyData: answer.survey.data,
    });
    const dispatchedData = new ActionData({
      content: dispatchContent,
      nullifier,
      isSurvey: Bool(false),
    });
    this.reducer.dispatch(dispatchedData);
  }

  @method async updateStates(
    reduceProof: ReduceProof,
    serverSignature: Signature
  ) {
    const serverPubKey = this.serverPublicKey.getAndRequireEquals();
    const lastProcessedActionState =
      this.lastProcessedActionState.getAndRequireEquals();
    const currentSurveyRoot = this.surveyMapRoot.getAndRequireEquals();
    const currentAnswerRoot = this.answerMapRoot.getAndRequireEquals();
    const currentNullifierRoot = this.nullifierMapRoot.getAndRequireEquals();

    serverSignature
      .verify(serverPubKey, [
        currentSurveyRoot,
        currentAnswerRoot,
        currentNullifierRoot,
      ])
      .assertTrue();

    reduceProof.verify();

    // Proof inputs check
    reduceProof.publicOutput.initialActionState.assertEquals(
      lastProcessedActionState
    );

    reduceProof.publicOutput.initialSurveyMapRoot.assertEquals(
      currentSurveyRoot
    );
    reduceProof.publicOutput.initialAnswerMapRoot.assertEquals(
      currentAnswerRoot
    );
    reduceProof.publicOutput.initialNullifierMapRoot.assertEquals(
      currentNullifierRoot
    );

    this.account.actionState.requireEquals(
      reduceProof.publicOutput.actionListState
    );

    this.surveyMapRoot.set(reduceProof.publicOutput.finalSurveyMapRoot);
    this.answerMapRoot.set(reduceProof.publicOutput.finalAnswerMapRoot);
    this.nullifierMapRoot.set(reduceProof.publicOutput.finalNullifierMapRoot);
    this.lastProcessedActionState.set(reduceProof.publicOutput.actionListState);
  }
}
