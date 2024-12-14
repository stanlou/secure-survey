import {
  Bool,
  Field,
  MerkleMap,
  MerkleMapWitness,
  method,
  Nullifier,
  Poseidon,
  Provable,
  PublicKey,
  Reducer,
  SmartContract,
  State,
  state,
  Struct,
} from 'o1js';

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
// TODO:: uppercase
const INITIAL_MERKLE_MAP_ROOT = new MerkleMap().getRoot();
export class SurveyContract extends SmartContract {
  @state(Field) surveyMapRoot = State<Field>();
  @state(Field) surveyCount = State<Field>();
  @state(Field) answerMapRoot = State<Field>();
  @state(Field) answerCount = State<Field>();
  @state(Field) nullifierMapRoot = State<Field>();
  @state(Bool) isInitialized = State(Bool(true));


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
  @method async saveSurvey(survey: Survey, witness: MerkleMapWitness) {
    // Ensure the contract is initialized
    const isInitialized = this.isInitialized.getAndRequireEquals();
    isInitialized.assertTrue('Contract is not initialized.');

    // Get the current survey root and count
    const initialRoot = this.surveyMapRoot.getAndRequireEquals();
    const currentSurveyCount = this.surveyCount.getAndRequireEquals();

    // Ensure the survey data is valid
    survey.data.assertNotEquals(Field(0), 'Survey data must not be empty.');

    // Verify the witness and update the Merkle tree
    const [rootBefore, key] = witness.computeRootAndKey(Field(0));
    rootBefore.assertEquals(initialRoot, 'Invalid Merkle tree witness.');
    key.assertEquals(survey.dbId, 'Survey ID does not match the witness key.');
    const [rootAfter, _] = witness.computeRootAndKey(survey.hash());

    // Update the contract state
    this.surveyMapRoot.set(rootAfter);
    this.surveyCount.set(currentSurveyCount.add(Field(1)));
  }

  // Method to save an answer to a survey
  @method async saveAnswer(
    answer: Answer,
    answerWitness: MerkleMapWitness,
    surveyWitness: MerkleMapWitness,
    answererPublicKey: PublicKey,
    nullifier: Nullifier,
    nullifierWitness: MerkleMapWitness
  ) {
    // Ensure the contract is initialized
    const isInitialized = this.isInitialized.getAndRequireEquals();
    isInitialized.assertTrue('Contract is not initialized.');

    const answerInitialRoot = this.answerMapRoot.getAndRequireEquals();
    const currentAnswerCount = this.answerCount.getAndRequireEquals();
    const surveyInitialRoot = this.surveyMapRoot.getAndRequireEquals();
    const nullifierInitialRoot = this.nullifierMapRoot.getAndRequireEquals();

    // Validate the answer's data
    answer.data.assertNotEquals(Field(0), 'Answer data must not be empty.');

    // Verify the answer Merkle tree witness
    const [rootBefore, key] = answerWitness.computeRootAndKey(Field(0));
    rootBefore.assertEquals(
      answerInitialRoot,
      'Invalid answer Merkle tree witness.'
    );
    key.assertEquals(answer.dbId, 'Answer ID does not match the witness key.');

    // Verify the survey exists
    const [currentSurveyRoot, currentSurveyKey] =
      surveyWitness.computeRootAndKey(answer.survey.hash());
    currentSurveyRoot.assertEquals(surveyInitialRoot, 'Survey does not exist.');
    currentSurveyKey.assertEquals(answer.survey.dbId, 'Survey ID mismatch.');

    // Check for duplicate submissions (nullifier check)
    const nullifierKey = Poseidon.hash(
      answererPublicKey.toFields().concat([answer.survey.dbId])
    );
    // verify the nullifier
    nullifier.verify([nullifierKey]);

    nullifier.assertUnused(nullifierWitness, nullifierInitialRoot);

    const nullifierRootAfter = nullifier.setUsed(nullifierWitness);

    const [rootAfter, _] = answerWitness.computeRootAndKey(answer.hash());
    this.answerMapRoot.set(rootAfter);
    this.nullifierMapRoot.set(nullifierRootAfter);
    this.answerCount.set(currentAnswerCount.add(Field(1)));
  }
}
