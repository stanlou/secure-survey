import { Poseidon, PublicKey } from "o1js"
import {  createSurveyStruct } from "secure-survey"
import {useZkAppStore } from "@/store/zkAppModule"
export const createNullifier = (publicKeyBase58:string,surveyId:string) => {
    const {zkAppStates} = (useZkAppStore()) 

    const publicKey = PublicKey.fromBase58(publicKeyBase58)
    const surveyStruct = createSurveyStruct(surveyId,"")
    return  Poseidon.hash(publicKey.toFields().concat([surveyStruct.dbId,zkAppStates.nullifierMessage])).toString()
}