export interface SurveyType  {
    id: string
    data: object
}

export type AnswerType = {
    id: string
    data: object
    survey: SurveyType
}
export type AnswerCreateInput = {
    data: object
    surveyId: string
}
export type NullifierType = {
    key: string
}

export type Group = {
    x: Field;
    y: Field;
};
export type NullifierJson = {
    publicKey: Group;
    public: {
        nullifier: Group;
        s: Field;
    };
    private: {
        c: Field;
        g_r: Group;
        h_m_pk_r: Group;
    };
};
