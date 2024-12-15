import { Poseidon, PublicKey } from "o1js"
import { createAnswerStruct, createSurveyStruct } from "secure-survey"
import { AnswerType } from "../types"

export const createNullifier = (publicKeyBase58:string,answer:AnswerType) => {
    const publicKey = PublicKey.fromBase58(publicKeyBase58)
    const surveyStruct = createSurveyStruct(answer.survey.id,JSON.stringify(answer.survey.data))
    return  Poseidon.hash(publicKey.toFields().concat([surveyStruct.dbId])).toString()
}