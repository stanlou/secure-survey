import { Poseidon } from "o1js";
import { Answer, Survey } from "../Survey";
import { jsonToFields } from "./jsonToFields";

export const createSurveyStruct = (dbId: string, surveyData: string) => {
    const hashedSurveyId = Poseidon.hash(jsonToFields(dbId));
    const hashedSurveyData = Poseidon.hash(jsonToFields(surveyData));
    return new Survey({
      dbId: hashedSurveyId,
      data: hashedSurveyData,
    });
  };

export const createAnswerStruct = (
  dbId: string,
  answerData: string,
  survey: Survey
) => {
  const hashedAnswerId = Poseidon.hash(jsonToFields(dbId));
  const hashedAnswerData = Poseidon.hash(jsonToFields(answerData));
  return new Answer({
    dbId: hashedAnswerId,
    data: hashedAnswerData,
    survey
  });
};
