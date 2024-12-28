# secure-survey

This project is a blockchain-based survey application designed to ensure the integrity of survey data. It leverages Mina Protocol as a verification layer, Vue.js for the frontend, Express.js with Prisma for the backend, and PostgreSQL as the database. By incorporating nullifiers and Merkle trees, it ensures that survey responses remain credible and unique while preventing duplicate submissions.

Features
Survey Management: Create, store, and manage surveys securely.
Answer Tracking: Submit and store answers with guaranteed integrity.
Nullifier Usage: Prevent duplicate responses by users, ensuring fairness.
Database Synchronization: Maintain a consistent state between the database and the blockchain.
Blockchain Verification: Use Mina Protocol as a verification layer for data credibility.
Tables Schema
Survey Table:

id: String (Unique identifier)
data: JSON (Survey details)
status: Enum (pending, succeeded)
Answer Table:

id: String (Unique identifier)
data: JSON (Answer details)
surveyId: Reference to the survey
status: Enum (pending, succeeded)
Smart Contract: SurveyContract
States
surveyMapRoot: Merkle root storing surveys (key: survey id, value: survey hash).
answerMapRoot: Merkle root storing answers (key: answer id, value: answer hash).
nullifierMapRoot: Merkle root storing nullifiers.
nullifierMessage: A unique message ensuring one-time usage of nullifiers across the zkApp.
serverPublicKey: Server's public key used for signature verification.
lastProcessedActionState: Tracks the last processed action in the reducer.
Action Type
The actionType defines the structure of dispatched actions:

Content: Contains survey and answer information.
Nullifier: Ensures uniqueness for actions (dummy nullifier used for surveys).
isSurvey: Boolean to distinguish between survey and answer actions.
Methods
saveSurvey(survey: Survey, nullifier: Nullifier)
Public Inputs:

survey: A struct containing the survey data (ID, content).
nullifier: A dummy nullifier used solely to satisfy the actionType.
Action Dispatched:

content:
answerDbId: Field(0) (not applicable for surveys).
surveyDbId: Extracted from survey.
answerData: Field(0) (not applicable for surveys).
surveyData: Extracted from survey.
nullifier: Dummy nullifier for compatibility.
isSurvey: Bool(true) to indicate this action is for a survey.
saveAnswer(answer: Answer, nullifier: Nullifier)
Public Inputs:

answer: A struct containing the answer data (ID, survey reference, content).
nullifier: Ensures uniqueness for this action.
Action Dispatched:

content:
answerDbId: Extracted from answer.
surveyDbId: Extracted from the referenced survey.
answerData: Extracted from answer.
surveyData: Extracted from the referenced survey.
nullifier: Ensures the user submits only one response.
isSurvey: Bool(false) to indicate this action is for an answer.
updateStates(reduceProof: ReduceProof, serverSignature: Signature)
This method verifies and processes the reducer's actions and updates the contract's states.

Steps:

Verifies the server's signature to ensure the request originates from the trusted server.
Verifies the recursive proof from the zkProgram.
Validates initial state inputs with current states of the contract.
Updates:
surveyMapRoot
answerMapRoot
nullifierMapRoot
lastProcessedActionState
Application Flow
Survey Creation:

A user creates a survey via the frontend.
The survey is saved in the database with a pending status.
The survey is sent to the zkApp, which dispatches an action to the reducer.
Answer Submission:

A user answers a survey via the frontend.
The answer is saved in the database with a pending status.
The answer is sent to the zkApp, which dispatches an action to the reducer.
Cron Job for Synchronization:

Every hour, the server fetches dispatched actions and reduces them using a zkProgram.
The server invokes the updateStates method with a signature, ensuring the update originates from the trusted server.
The database statuses for surveys, answers, and nullifiers are updated from pending to succeeded.
Key Points
Nullifier for Surveys: The nullifier sent when saving a survey is used only to satisfy the action type and is not actively utilized.
Verification Layer: Mina Protocol serves as a verification layer, ensuring the credibility and integrity of the data.
Server Signature: The server's signature in updateStates guarantees the authenticity of state updates.
Conclusion
This survey app demonstrates the integration of blockchain with traditional database systems to ensure the credibility and integrity of survey data. By using Mina Protocol, the app provides a robust verification layer, while nullifiers and Merkle trees prevent data tampering and duplicate submissions.
