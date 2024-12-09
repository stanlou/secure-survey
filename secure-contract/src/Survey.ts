import {
  Bool,
  Field,
  MerkleMap,
  MerkleMapWitness,
  method,
  Poseidon,
  PublicKey,
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
  surveyDbId: Field, // Reference to the survey ID
  data: Field, // Content of the answer
}) {
  hash(): Field {
    return Poseidon.hash(Answer.toFields(this));
  }
}
// TODO:: uppercase 
const initialMerkleMapRoot =  new MerkleMap().getRoot()
export class SurveyContract extends SmartContract {
  @state(Field) surveyMapRoot = State<Field>();
  @state(Field) surveyCount = State<Field>();
  @state(Field) answerMapRoot = State<Field>();
  @state(Field) answerCount = State<Field>();
  @state(Field) nullifierMapRoot = State<Field>();
  @state(Bool) isInitialized = State(Bool(true));

  init() {
    super.init();
    this.surveyMapRoot.set(initialMerkleMapRoot);
    this.answerMapRoot.set(initialMerkleMapRoot);
    this.nullifierMapRoot.set(initialMerkleMapRoot);
  }

  // Method to reinitialize the smart contract states , only used for development 
  @method async initState(){
    const currentSurveyRoot = this.surveyMapRoot.getAndRequireEquals()
    const currentAnswerRoot = this.answerMapRoot.getAndRequireEquals()
    const currentNullifierRoot = this.nullifierMapRoot.getAndRequireEquals()
    const currentSurveyCount = this.surveyCount.getAndRequireEquals()
    const currentAnswerCount = this.answerCount.getAndRequireEquals()

    this.surveyMapRoot.set(initialMerkleMapRoot);
    this.answerMapRoot.set(initialMerkleMapRoot);
    this.nullifierMapRoot.set(initialMerkleMapRoot);
    this.surveyCount.set(Field(0))
    this.answerCount.set(Field(0))

  }
  // Method to save a survey in the Merkle tree
  @method async saveSurvey(survey: Survey, witness: MerkleMapWitness) {
    // Ensure the contract is initialized
    const isInitialized = this.isInitialized.getAndRequireEquals();
    isInitialized.assertTrue("Contract is not initialized.");

    // Get the current survey root and count
    const initialRoot = this.surveyMapRoot.getAndRequireEquals();
    const currentSurveyCount = this.surveyCount.getAndRequireEquals();

    // Ensure the survey data is valid
    survey.data.assertNotEquals(Field(0), "Survey data must not be empty.");

    // Verify the witness and update the Merkle tree
    const [rootBefore, key] = witness.computeRootAndKey(Field(0));
    rootBefore.assertEquals(initialRoot, "Invalid Merkle tree witness.");
    key.assertEquals(survey.dbId, "Survey ID does not match the witness key.");
    const [rootAfter, _] = witness.computeRootAndKey(survey.hash());
    
    // Update the contract state
    this.surveyMapRoot.set(rootAfter);
    this.surveyCount.set(currentSurveyCount.add(Field(1)));
  }

  // Method to save an answer to a survey
  @method async saveAnswer(
    answer: Answer,
    survey: Survey,
    answerWitness: MerkleMapWitness,
    surveyWitness: MerkleMapWitness,
    answererPublicKey: PublicKey,
    nullifierWitness: MerkleMapWitness,
  ) {
    // Ensure the contract is initialized
    const isInitialized = this.isInitialized.getAndRequireEquals();
    isInitialized.assertTrue("Contract is not initialized.");

    const answerInitialRoot = this.answerMapRoot.getAndRequireEquals();
    const currentAnswerCount = this.answerCount.getAndRequireEquals();
    const surveyInitialRoot = this.surveyMapRoot.getAndRequireEquals();
    const nullifierInitialRoot = this.nullifierMapRoot.getAndRequireEquals();

    // Validate the answer's data
    answer.data.assertNotEquals(Field(0), "Answer data must not be empty.");

    // Verify the answer Merkle tree witness
    const [rootBefore, key] = answerWitness.computeRootAndKey(Field(0));
    rootBefore.assertEquals(answerInitialRoot, "Invalid answer Merkle tree witness.");
    key.assertEquals(answer.dbId, "Answer ID does not match the witness key.");

    // Verify the survey exists
    survey.data.assertNotEquals(Field(0), "Survey data must not be empty.");
    const [currentSurveyRoot, currentSurveyKey] =
      surveyWitness.computeRootAndKey(survey.data);
    currentSurveyRoot.assertEquals(surveyInitialRoot, "Survey does not exist.");
    currentSurveyKey.assertEquals(survey.dbId, "Survey ID mismatch.");

    // Check for duplicate submissions (nullifier check)
    const nullifierKey = Poseidon.hash(
      answererPublicKey.toFields().concat([survey.dbId])
    );
    const [currentNullifierRoot, currentNullifierKey] =
      nullifierWitness.computeRootAndKey(Field(0));
    currentNullifierRoot.assertEquals(nullifierInitialRoot, "Invalid nullifier witness.");
    currentNullifierKey.assertEquals(nullifierKey, "Nullifier key mismatch.");

    const [rootAfter, _] = answerWitness.computeRootAndKey(answer.hash());
    const [nullifierRootAfter, _key] = nullifierWitness.computeRootAndKey(Field(1));
    this.answerMapRoot.set(rootAfter);
    this.nullifierMapRoot.set(nullifierRootAfter);
    this.answerCount.set(currentAnswerCount.add(Field(1)));
  }
}
