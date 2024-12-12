export interface SurveyType  {
    id: string
    data: object
}

export type AnswerType = {
    id: string
    data: object
    surveyId: string
}
export type AnswerCreateInput = {
    data: object
    surveyId: string
}
export type NullifierType = {
    key: string
}
