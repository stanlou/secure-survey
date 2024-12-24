import {
  Bool,
  Field,
  MerkleMapWitness,
  Nullifier,
  Poseidon,
  Provable,
  PublicKey,
  SelfProof,
  Struct,
  ZkProgram,
} from 'o1js';

 class Survey extends Struct({
  dbId: Field, // Identifier for the survey
  data: Field, // Content of the survey
}) {
  hash(): Field {
    return Poseidon.hash(Survey.toFields(this));
  }
}

 class Answer extends Struct({
  dbId: Field, // Identifier for the answer
  survey: Survey, // Reference to the asnwered survey
  data: Field, // Content of the answer
}) {
  hash(): Field {
    return Poseidon.hash(Answer.toFields(this));
  }
}
 class ActionData extends Struct({
  isSurvey: Bool,
  survey: Survey,
  answer: Answer,
  nullifier: Nullifier,
  
}) {
  hash(): Field {
    return Poseidon.hash(ActionData.toFields(this));
  }
}




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

export const actionListAdd = (hash: Field, action: Field): Field => {
  return Poseidon.hashWithPrefix('MinaZkappSeqEvents**', [
    hash,
    Poseidon.hashWithPrefix('MinaZkappEvent******', [action]),
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
  answererPublicKey: PublicKey
): Promise<{ publicOutput: ReducePublicOutput }> {

  prevProof.verify();

  let newActionSubListState = actionListAdd(
    prevProof.publicOutput.actionSubListState,
    input.hash()
  );
  // check provable.if assertions with @shigato-dev19
  const newPublicOutput = Provable.if(
    input.isSurvey,
    ReducePublicOutput,
    (() => {
      // Ensure the survey data is valid
      input.survey.data.assertNotEquals(
        Field(0),
        'Survey data must not be empty.'
      );
      // Verify the witness and update the Merkle tree
      const [rootBefore, key] = surveyWitness.computeRootAndKey(Field(0));
      rootBefore.assertEquals(
        prevProof.publicOutput.finalSurveyMapRoot,
        'Invalid Merkle tree witness.'
      );
      key.assertEquals(
        input.survey.dbId,
        'Survey ID does not match the witness key.'
      );
      const [rootAfter, _] = surveyWitness.computeRootAndKey(
        input.survey.hash()
      );

      return new ReducePublicOutput({
        initialSurveyMapRoot: prevProof.publicOutput.initialSurveyMapRoot,
        initialAnswerMapRoot: prevProof.publicOutput.initialAnswerMapRoot,
        initialNullifierMapRoot: prevProof.publicOutput.initialNullifierMapRoot,
        finalAnswerMapRoot: prevProof.publicOutput.finalAnswerMapRoot,
        finalNullifierMapRoot: prevProof.publicOutput.finalNullifierMapRoot,
        finalSurveyMapRoot: rootAfter,
        initialActionState: prevProof.publicOutput.initialActionState,
        actionSubListState: newActionSubListState,
        actionListState: prevProof.publicOutput.actionListState,
      });
    })(),
    (() => {
      input.answer.data.assertNotEquals(
        Field(0),
        'Answer data must not be empty.'
      );

      // Verify the answer Merkle tree witness
      const [rootBefore, key] = answerWitness.computeRootAndKey(Field(0));
      rootBefore.assertEquals(
        prevProof.publicOutput.finalAnswerMapRoot,
        'Invalid answer Merkle tree witness.'
      );
      key.assertEquals(
        input.answer.dbId,
        'Answer ID does not match the witness key.'
      );

      // Verify the survey exists
      const [currentSurveyRoot, currentSurveyKey] =
        surveyWitness.computeRootAndKey(input.answer.survey.hash());
      currentSurveyRoot.assertEquals(
        prevProof.publicOutput.finalSurveyMapRoot,
        'Survey does not exist.'
      );
      currentSurveyKey.assertEquals(
        input.answer.survey.dbId,
        'Survey ID mismatch.'
      );

      // Check for duplicate submissions (nullifier check)
      const nullifierKey = Poseidon.hash(
        answererPublicKey.toFields().concat([input.answer.survey.dbId])
      );
      // verify the nullifier
      input.nullifier.verify([nullifierKey]);

      input.nullifier.assertUnused(
        nullifierWitness,
        prevProof.publicOutput.finalNullifierMapRoot
      );

      const nullifierRootAfter = input.nullifier.setUsed(nullifierWitness);

      const [rootAfter, _] = answerWitness.computeRootAndKey(
        input.answer.hash()
      );
      return new ReducePublicOutput({
        initialSurveyMapRoot: prevProof.publicOutput.initialSurveyMapRoot,
        initialAnswerMapRoot: prevProof.publicOutput.initialAnswerMapRoot,
        initialNullifierMapRoot: prevProof.publicOutput.initialNullifierMapRoot,
        finalAnswerMapRoot: rootAfter,
        finalNullifierMapRoot: nullifierRootAfter,
        finalSurveyMapRoot: prevProof.publicOutput.finalSurveyMapRoot,
        initialActionState: prevProof.publicOutput.initialActionState,
        actionSubListState: newActionSubListState,
        actionListState: prevProof.publicOutput.actionListState,
      });
    })()
  );

  return {
    publicOutput: newPublicOutput,
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
        PublicKey,
      ],
      async method(
        input: ActionData,
        prevProof: SelfProof<ActionData, ReducePublicOutput>,
        surveyWitness: MerkleMapWitness,
        answerWitness: MerkleMapWitness,
        nullifierWitness: MerkleMapWitness,
        answererPublicKey: PublicKey
      ) {
        return update(
          input,
          prevProof,
          surveyWitness,
          answerWitness,
          nullifierWitness,
          answererPublicKey
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

export class ReduceProof extends ZkProgram.Proof(ReduceProgram) {}
