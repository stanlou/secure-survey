import {
  Bool,
  Field,
  MerkleMap,
  MerkleMapWitness,
  method,
  Poseidon,
  Provable,
  PublicKey,
  Signature,
  SmartContract,
  State,
  state,
  Struct,
} from 'o1js';

export class Survey extends Struct({
  dbId: Field,
  data: Field,
}) {
  hash(): Field {
    return Poseidon.hash(Survey.toFields(this));
  }
}
export class Answer extends Struct({
  dbId: Field,
  surveyDbId: Field,
  data: Field,
}) {
  hash(): Field {
    return Poseidon.hash(Answer.toFields(this));
  }
}

export class SurveyContract extends SmartContract {
  @state(Field) surveyMapRoot = State<Field>();
  @state(Field) surveyCount = State<Field>();
  @state(Field) answerMapRoot = State<Field>();
  @state(Field) answerCount = State<Field>();
  @state(Field) nullifierMapRoot = State<Field>();
  @state(Bool) isInitialized = State<Bool>();

  init() {
    super.init();
    this.surveyMapRoot.set(new MerkleMap().getRoot());
    this.surveyCount.set(Field(0));
    this.answerMapRoot.set(new MerkleMap().getRoot());
    this.answerCount.set(Field(0));
    this.nullifierMapRoot.set(new MerkleMap().getRoot());
    this.isInitialized.set(Bool(true));
  }

  @method async saveSurvey(survey: Survey, witness: MerkleMapWitness) {
    const isInitialized = this.isInitialized.getAndRequireEquals();
    isInitialized.assertTrue();

    const initialRoot = this.surveyMapRoot.getAndRequireEquals();
    const currentSurveyCount = this.surveyCount.getAndRequireEquals();
    survey.data.assertNotEquals(Field(0));
    const [rootBefore, key] = witness.computeRootAndKeyV2(Field(0));
    rootBefore.assertEquals(initialRoot);
    key.assertEquals(survey.dbId);
    const [rootAfter, _] = witness.computeRootAndKeyV2(survey.hash());
    this.surveyMapRoot.set(rootAfter);
    this.surveyCount.set(currentSurveyCount.add(Field(1)));
  }

  @method async saveAnswer(
    answer: Answer,
    survey: Survey,
    answerWitness: MerkleMapWitness,
    surveyWitness: MerkleMapWitness,
    answererPublicKey: PublicKey,
    nullifierWitness: MerkleMapWitness,
    signature: Signature
  ) {
    const isInitialized = this.isInitialized.getAndRequireEquals();
    isInitialized.assertTrue();
    const answerInitialRoot = this.answerMapRoot.getAndRequireEquals();
    const currentAnswerCount = this.answerCount.getAndRequireEquals();
    const surveyInitialRoot = this.surveyMapRoot.getAndRequireEquals();
    const nullifierInitialRoot = this.nullifierMapRoot.getAndRequireEquals();
    const [rootBefore, key] = answerWitness.computeRootAndKeyV2(Field(0));
    rootBefore.assertEquals(answerInitialRoot);
    key.assertEquals(answer.dbId);

    // answer validation
    answer.data.assertNotEquals(Field(0));

    // check for signature
    const signatureMessage = Poseidon.hash(
      answererPublicKey.toFields().concat(survey.dbId)
    );
    signature
      .verify(answererPublicKey, signatureMessage.toFields())
      .assertTrue();

    // check for survey existance
    // check if there are surveys before emitting answers
    survey.data.assertNotEquals(Field(0));
    const [currentSurveyRoot, currentSurveyKey] =
      surveyWitness.computeRootAndKeyV2(survey.data);
    currentSurveyRoot.assertEquals(surveyInitialRoot);
    currentSurveyKey.assertEquals(survey.dbId);

    // check for nullifier
    const nullifierKey = Poseidon.hash(
      answererPublicKey.toFields().concat([survey.dbId])
    );
    const [currentNullifierRoot, currentNullifierKey] =
      nullifierWitness.computeRootAndKeyV2(Field(0));
    currentNullifierRoot.assertEquals(nullifierInitialRoot);
    currentNullifierKey.assertEquals(nullifierKey);
    const [rootAfter, _] = answerWitness.computeRootAndKeyV2(answer.hash());
    const [nullifierRootAfter, _key] = nullifierWitness.computeRootAndKeyV2(
      Field(1)
    );
    this.answerMapRoot.set(rootAfter);
    this.nullifierMapRoot.set(nullifierRootAfter);
    this.answerCount.set(currentAnswerCount.add(Field(1)));
  }
}
