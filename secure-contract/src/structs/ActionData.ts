import { Bool, Field, Nullifier, Poseidon, Struct } from "o1js";



export class DispatchData extends Struct({
    answerDbId: Field,
    surveyDbId: Field,
    answerData: Field,
    surveyData: Field
  }) {
    hash(): Field {
      return Poseidon.hash(DispatchData.toFields(this));
    }
  }
export class ActionData extends Struct({
    content: DispatchData,
    nullifier: Nullifier,
    isSurvey:Bool
  }) {
    hash(): Field {
      return Poseidon.hash(ActionData.toFields(this));
    }
  }
  