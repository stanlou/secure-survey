import { Poseidon, PublicKey } from "o1js"
import { createAnswerStruct } from "secure-survey"
import { AnswerType } from "../types"

export const createNullifier = (publicKeyBase58:string,answer:AnswerType) => {
    const publicKey = PublicKey.fromBase58(publicKeyBase58)
    const answerStruct = createAnswerStruct(answer.id,JSON.stringify(answer.data),answer.surveyId)
    return  Poseidon.hash(publicKey.toFields().concat([answerStruct.surveyDbId])).toString()
}