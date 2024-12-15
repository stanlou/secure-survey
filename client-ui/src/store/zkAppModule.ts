import { defineStore } from "pinia";
import ZkappWorkerClient from "../zkappWorkerClient";
import axios from "axios";
import { API_URL } from "../webService/apiService";
import { Field, Nullifier, Poseidon, PublicKey } from "o1js";
import { createAnswerStruct } from "secure-survey";
import { createNullifier } from "../helper/nullifier";
import { AnswerType, SurveyType } from "../types";

interface MinaWallet {
  requestAccounts: () => Promise<string[]>;
  signMessage: (args: {
    message: string;
  }) => Promise<{ publicKey: string; signature: string }>;
}

declare global {
  interface Window {
    mina?: MinaWallet;
  }
}
const ZKAPP_ADDRESS = "B62qnoqVwzVdCduoh1R7xYof7zPyCMsFbkUdKMC8mT4pMhcop7fEbJp";
const TRANSACTION_FEE = 0.1;
export const useZkAppStore = defineStore("useZkAppModule", {
  state: () => ({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    hasWallet: null as null | boolean,
    stepDisplay: "" as string,
    hasBeenSetup: false,
    accountExists: false,
    publicKeyBase58: null as null | any,
    requestedConnexion: false,
    error: null as Object | any,
    loading: false,
    currentTransactionLink: "",
  }),
  getters: {},
  actions: {
    async setupZkApp() {
      if (window.mina) {
        try {
          this.requestedConnexion = true;
          this.stepDisplay = "Loading web worker...";
          this.zkappWorkerClient = new ZkappWorkerClient();
          await new Promise((resolve) => setTimeout(resolve, 5000));
          this.stepDisplay = "Done loading web worker";
          await this.zkappWorkerClient.setActiveInstanceToDevnet();

          const accounts = await window.mina.requestAccounts();

          this.publicKeyBase58 = accounts[0];
          this.stepDisplay = `Using key: ${this.publicKeyBase58}`;
          this.stepDisplay = "Checking if fee payer account exists...";
          const res = await this.zkappWorkerClient.fetchAccount(
            this.publicKeyBase58
          );
          this.accountExists = res.error === null;

          await this.zkappWorkerClient.loadContract();

          this.stepDisplay = "Compiling zkApp...";
          await this.zkappWorkerClient.compileContract();
          this.stepDisplay = "zkApp compiled";
          
          await this.zkappWorkerClient.initZkappInstance(ZKAPP_ADDRESS);

          this.hasBeenSetup = true;
          this.hasWallet = true;
          this.stepDisplay = "";
          await this.zkappWorkerClient.loadOffChainStorage();
          console.log("loaded offchainstorage....");
        } catch (error: any) {
          return { message: error.message };
        }
      } else {
        this.hasWallet = false;
        this.error = {
          message: "Mina Wallet not detected. Please install Auro Wallet.",
        };
        return;
      }
    },
    async checkAccountExists() {
      try {
        for (;;) {
          this.stepDisplay = "Checking if fee payer account exists...";
          const res = await this.zkappWorkerClient!.fetchAccount(
            this.publicKeyBase58
          );
          const accountExists = res.error == null;
          if (accountExists) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      } catch (error: any) {
        this.stepDisplay = `Error checking account: ${error.message}`;
      }

      this.accountExists = true;
    },
    async createSurvey(survey: SurveyType) {
      try {
        this.loading = true;

        this.stepDisplay = "Creating a transaction...";
        await this.zkappWorkerClient!.fetchAccount(this.publicKeyBase58);

        await this.zkappWorkerClient!.createSurveyTransaction(survey);

        this.stepDisplay = "Creating proof...";
        await this.zkappWorkerClient!.proveTransaction();

        this.stepDisplay = "Getting transaction JSON...";
        const transactionJSON =
        await this.zkappWorkerClient!.getTransactionJSON();
        this.stepDisplay = "Requesting send transaction...";

        const { hash } = await (window as any).mina.sendTransaction({
          transaction: transactionJSON,
          feePayer: {
            fee: TRANSACTION_FEE,
            memo: "",
          },
        });
        const transactionLink = `https://minascan.io/devnet/tx/${hash}`;
        this.currentTransactionLink = transactionLink;
        this.stepDisplay = transactionLink;
      } catch (err) {
        console.log("error ", err);
      } finally {
        this.loading = false;
      }
    },
    async createAnswer(answer: AnswerType) {
      try {
        this.loading = true;
        await this.zkappWorkerClient!.fetchAccount(this.publicKeyBase58);
        this.stepDisplay = "Creating a nullifier"
        const nullifierKey = createNullifier(this.publicKeyBase58,answer)


        this.stepDisplay = "Creating a nullifier...";
        const jsonNullifier = await (window as any).mina.createNullifier({
          message: [nullifierKey]
        })
        await axios.post(API_URL+"/nullifier/save",{key:Nullifier.fromJSON(jsonNullifier).key()});

        this.stepDisplay = "Creating a transaction...";

        await this.zkappWorkerClient!.createAnswerTransaction(answer,this.publicKeyBase58,jsonNullifier);

        this.stepDisplay = "Creating proof...";
        await this.zkappWorkerClient!.proveTransaction();
        this.stepDisplay = "Getting transaction JSON...";
        const transactionJSON = await this.zkappWorkerClient!.getTransactionJSON();
        this.stepDisplay = "Requesting send transaction...";

        const { hash } = await (window as any).mina.sendTransaction({
          transaction: transactionJSON,
          feePayer: {
            fee: TRANSACTION_FEE,
            memo: "",
          },
        });
        const transactionLink = `https://minascan.io/devnet/tx/${hash}`;
        this.currentTransactionLink = transactionLink;
        this.stepDisplay = transactionLink;
      } catch (err) {
        console.log("error ", err);
      } finally {
        this.loading = false;
      }
    },
  },
});
