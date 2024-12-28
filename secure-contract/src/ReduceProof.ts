import {
  Bool,
  Field,
  MerkleMapWitness,
  Poseidon,
  Provable,
  SelfProof,
  Struct,
  ZkProgram,
} from 'o1js';
import { ActionData } from './structs/ActionData.js';
import { Answer, Survey } from './Survey.js';

// https://github.com/o1-labs/o1js-bindings/blob/71f2e698dadcdfc62c76a72248c0df71cfd39d4c/lib/binable.ts#L317
let encoder = new TextEncoder();

function stringToBytes(s: string) {
  return [...encoder.encode(s)];
}

function prefixToField<Field>(
  // Field: GenericSignableField<Field>,
  Field: any,
  prefix: string
) {
  let fieldSize = Field.sizeInBytes;
  if (prefix.length >= fieldSize) throw Error('prefix too long');
  let stringBytes = stringToBytes(prefix);
  return Field.fromBytes(
    stringBytes.concat(Array(fieldSize - stringBytes.length).fill(0))
  );
}

// hashing helpers taken from https://github.com/o1-labs/o1js/blob/72a2779c6728e80e0c9d1462020347c954a0ffb5/src/lib/mina/events.ts#L28
function initialState() {
  return [Field(0), Field(0), Field(0)] as [Field, Field, Field];
}
function salt(prefix: string) {
  return Poseidon.update(initialState(), [prefixToField(Field, prefix)]);
}

function emptyHashWithPrefix(prefix: string) {
  return salt(prefix)[0];
}

export const actionListAdd = (hash: Field, action: ActionData): Field => {
  return Poseidon.hashWithPrefix('MinaZkappSeqEvents**', [
    hash,
    Poseidon.hashWithPrefix(
      'MinaZkappEvent******',
      ActionData.toFields(action)
    ),
  ]);
};
export const merkleActionsAdd = (hash: Field, actionsHash: Field): Field => {
  return Poseidon.hashWithPrefix('MinaZkappSeqEvents**', [hash, actionsHash]);
};

export const emptyActionListHash = emptyHashWithPrefix('MinaZkappActionsEmpty');

export class ReducePublicOutput extends Struct({
  initialSurveyMapRoot: Field,
  finalSurveyMapRoot: Field,
  initialAnswerMapRoot: Field,
  finalAnswerMapRoot: Field,
  initialNullifierMapRoot: Field,
  finalNullifierMapRoot: Field,
  initialActionState: Field,
  actionSubListState: Field,
  actionListState: Field,
}) {}

class ReducerPublicOutputAndChecks extends Struct({
  publicOutput: ReducePublicOutput,
  isValid: Bool,
}) {}

function reduceSurveys(
  input: ActionData,
  prevProof: SelfProof<ActionData, ReducePublicOutput>,
  surveyWitness: MerkleMapWitness,
  newActionSubListState: Field
) {
  // Ensure the survey data is valid
  const validSurveyData = input.content.surveyData.equals(Field(0)).not();
  // Verify the witness and update the Merkle tree
  const [rootBefore, key] = surveyWitness.computeRootAndKey(Field(0));
  const surveyCommitment = rootBefore.equals(
    prevProof.publicOutput.finalSurveyMapRoot
  );
  const validSurveyKey = key.equals(input.content.surveyDbId);
  const survey = new Survey({
    data: input.content.surveyData,
    dbId: input.content.surveyDbId,
  });
  const validChecks = validSurveyData.and(surveyCommitment).and(validSurveyKey);
  const [rootAfter, _] = surveyWitness.computeRootAndKey(survey.hash());

  return new ReducerPublicOutputAndChecks({
    isValid: validChecks,
    publicOutput: {
      initialSurveyMapRoot: prevProof.publicOutput.initialSurveyMapRoot,
      initialAnswerMapRoot: prevProof.publicOutput.initialAnswerMapRoot,
      initialNullifierMapRoot: prevProof.publicOutput.initialNullifierMapRoot,
      finalAnswerMapRoot: prevProof.publicOutput.finalAnswerMapRoot,
      finalNullifierMapRoot: prevProof.publicOutput.finalNullifierMapRoot,
      finalSurveyMapRoot: rootAfter,
      initialActionState: prevProof.publicOutput.initialActionState,
      actionSubListState: newActionSubListState,
      actionListState: prevProof.publicOutput.actionListState,
    },
  });
}

function reduceAnswers(
  input: ActionData,
  prevProof: SelfProof<ActionData, ReducePublicOutput>,
  surveyWitness: MerkleMapWitness,
  answerWitness: MerkleMapWitness,
  nullifierWitness: MerkleMapWitness,
  newActionSubListState: Field,
  nullifierMessage: Field
) {
  const validAnswerData = input.content.answerData.equals(Field(0)).not();

  // Verify the answer Merkle tree witness
  const [rootBefore, key] = answerWitness.computeRootAndKey(Field(0));
  const validAnswerCommitment = rootBefore.equals(
    prevProof.publicOutput.finalAnswerMapRoot
  );

  const validAnswerkeyCommitment = key.equals(input.content.answerDbId);

  const survey = new Survey({
    data: input.content.surveyData,
    dbId: input.content.surveyDbId,
  });
  const answer = new Answer({
    dbId: input.content.answerDbId,
    data: input.content.answerData,
    survey,
  });
  // Verify the survey exists
  const [currentSurveyRoot, currentSurveyKey] = surveyWitness.computeRootAndKey(
    survey.hash()
  );
  const surveyExists = currentSurveyRoot.equals(
    prevProof.publicOutput.finalSurveyMapRoot
  );
  const validSurveyId = currentSurveyKey.equals(survey.dbId);

  // Check for duplicate submissions (nullifier check)

  const nullifierKey = Poseidon.hash(
    input.nullifier
      .getPublicKey()
      .toFields()
      .concat([survey.dbId, nullifierMessage])
  );

  input.nullifier.verify([nullifierKey]);

  input.nullifier.assertUnused(
    nullifierWitness,
    prevProof.publicOutput.finalNullifierMapRoot
  );

  const nullifierRootAfter = input.nullifier.setUsed(nullifierWitness);

  const validChecks = validAnswerData
    .and(validAnswerCommitment)
    .and(validAnswerkeyCommitment)
    .and(surveyExists)
    .and(validSurveyId);

  const [rootAfter, _] = answerWitness.computeRootAndKey(answer.hash());
  return new ReducerPublicOutputAndChecks({
    publicOutput: {
      initialSurveyMapRoot: prevProof.publicOutput.initialSurveyMapRoot,
      initialAnswerMapRoot: prevProof.publicOutput.initialAnswerMapRoot,
      initialNullifierMapRoot: prevProof.publicOutput.initialNullifierMapRoot,
      finalAnswerMapRoot: rootAfter,
      finalNullifierMapRoot: nullifierRootAfter,
      finalSurveyMapRoot: prevProof.publicOutput.finalSurveyMapRoot,
      initialActionState: prevProof.publicOutput.initialActionState,
      actionSubListState: newActionSubListState,
      actionListState: prevProof.publicOutput.actionListState,
    },
    isValid: validChecks,
  });
}

export async function init(
  surveyMapRoot: Field,
  answerMapRoot: Field,
  nullifierMapRoot: Field,
  initialActionListState: Field
): Promise<{ publicOutput: ReducePublicOutput }> {
  return {
    publicOutput: new ReducePublicOutput({
      initialSurveyMapRoot: surveyMapRoot,
      finalSurveyMapRoot: surveyMapRoot,
      initialAnswerMapRoot: answerMapRoot,
      finalAnswerMapRoot: answerMapRoot,
      initialNullifierMapRoot: nullifierMapRoot,
      finalNullifierMapRoot: nullifierMapRoot,
      initialActionState: initialActionListState,
      actionSubListState: emptyActionListHash,
      actionListState: initialActionListState,
    }),
  };
}

export async function update(
  input: ActionData,
  prevProof: SelfProof<ActionData, ReducePublicOutput>,
  surveyWitness: MerkleMapWitness,
  answerWitness: MerkleMapWitness,
  nullifierWitness: MerkleMapWitness,
  nullifierMessage: Field
): Promise<{ publicOutput: ReducePublicOutput }> {
  prevProof.verify();

  let newActionSubListState = actionListAdd(
    prevProof.publicOutput.actionSubListState,
    input
  );

  const newPublicOutput = Provable.if(
    input.isSurvey,
    ReducerPublicOutputAndChecks,
    reduceSurveys(input, prevProof, surveyWitness, newActionSubListState),
    reduceAnswers(
      input,
      prevProof,
      surveyWitness,
      answerWitness,
      nullifierWitness,
      newActionSubListState,
      nullifierMessage
    )
  );
  newPublicOutput.isValid.assertEquals(true);
  return {
    publicOutput: newPublicOutput.publicOutput,
  };
}

export async function cutActions(
  input: ActionData,
  prevProof: SelfProof<ActionData, ReducePublicOutput>
): Promise<{ publicOutput: ReducePublicOutput }> {
  return {
    publicOutput: new ReducePublicOutput({
      initialSurveyMapRoot: prevProof.publicOutput.initialSurveyMapRoot,
      initialAnswerMapRoot: prevProof.publicOutput.initialAnswerMapRoot,
      initialNullifierMapRoot: prevProof.publicOutput.initialNullifierMapRoot,
      finalAnswerMapRoot: prevProof.publicOutput.finalAnswerMapRoot,
      finalNullifierMapRoot: prevProof.publicOutput.finalNullifierMapRoot,
      finalSurveyMapRoot: prevProof.publicOutput.finalSurveyMapRoot,
      initialActionState: prevProof.publicOutput.initialActionState,
      actionSubListState: emptyActionListHash,
      actionListState: merkleActionsAdd(
        prevProof.publicOutput.actionListState,
        prevProof.publicOutput.actionSubListState
      ),
    }),
  };
}

export const ReduceProgram = ZkProgram({
  name: 'reduce-program',
  publicInput: ActionData,
  publicOutput: ReducePublicOutput,
  methods: {
    init: {
      privateInputs: [Field, Field, Field, Field],
      async method(
        input: ActionData,
        initialSurveyMapRoot: Field,
        initialAnswerMapRoot: Field,
        initialNullifierMapRoot: Field,
        initialActionListState: Field
      ) {
        return init(
          initialSurveyMapRoot,
          initialAnswerMapRoot,
          initialNullifierMapRoot,
          initialActionListState
        );
      },
    },
    update: {
      privateInputs: [
        SelfProof,
        MerkleMapWitness,
        MerkleMapWitness,
        MerkleMapWitness,
        Field,
      ],
      async method(
        input: ActionData,
        prevProof: SelfProof<ActionData, ReducePublicOutput>,
        surveyWitness: MerkleMapWitness,
        answerWitness: MerkleMapWitness,
        nullifierWitness: MerkleMapWitness,
        nullifierMessage: Field
      ) {
        return update(
          input,
          prevProof,
          surveyWitness,
          answerWitness,
          nullifierWitness,
          nullifierMessage
        );
      },
    },
    cutActions: {
      privateInputs: [SelfProof],
      async method(
        input: ActionData,
        prevProof: SelfProof<ActionData, ReducePublicOutput>
      ) {
        return cutActions(input, prevProof);
      },
    },
  },
});

let ReduceProof_ = ZkProgram.Proof(ReduceProgram);
export class ReduceProof extends ReduceProof_ {}
