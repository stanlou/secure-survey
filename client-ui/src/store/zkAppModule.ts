import { defineStore } from "pinia";
import ZkappWorkerClient from "../zkappWorkerClient";
import axios from "axios";
import { API_URL } from "../webService/apiService";
import {  Nullifier } from "o1js";
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
const ZKAPP_ADDRESS = "B62qrTgHX1jTxqxCRqVRcLffZDngbrhrcqgH6sn7pvHLwpPFBYyRrk7";
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
    zkAppStates : null as null | any,
    compiled: false
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
          this.stepDisplay = "Setting Mina instance...";
          await this.zkappWorkerClient.setActiveInstanceToDevnet();

          const accounts = await window.mina.requestAccounts();

          this.publicKeyBase58 = accounts[0];
          this.stepDisplay = "Checking if fee payer account exists...";
          const res = await this.zkappWorkerClient.fetchAccount(
            this.publicKeyBase58
          );
          this.accountExists = res.error === null;

          await this.zkappWorkerClient.loadContract();

          this.stepDisplay = "Compiling zkApp...";
          await this.zkappWorkerClient.compileContract();
          this.stepDisplay = "";
          this.compiled = true
          this.zkAppStates = await this.zkappWorkerClient.initZkappInstance(ZKAPP_ADDRESS);
          this.hasBeenSetup = true;
          this.hasWallet = true;
        } catch (error: any) {
          return { message: error.message };
        }
      } else {
        this.hasWallet = false;
        this.stepDisplay = "Mina Wallet not detected";

        this.error = {
          message: "Mina Wallet not detected. Please install Auro Wallet.",
        };
        return;
      }
    },
    async checkAccountExists() {
      try {
        for (;;) {
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

        this.stepDisplay = "Creating a nullifier"
        const nullifierKey = createNullifier(this.publicKeyBase58,survey.id)

        const jsonNullifier = await (window as any).mina.createNullifier({
          message: [nullifierKey]
        })

        
        await this.zkappWorkerClient!.createSurveyTransaction(survey,jsonNullifier);

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
        const transactionLink = `https://minascan.io/devnet/tx/${hash}?type=zk-tx`;
        this.currentTransactionLink = transactionLink;
        this.stepDisplay = "";
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
        const nullifierKey = createNullifier(this.publicKeyBase58,answer.survey.id)


        this.stepDisplay = "Creating a nullifier...";
        const jsonNullifier = await (window as any).mina.createNullifier({
          message: [nullifierKey]
        })
        try {
          await axios.post(API_URL+"/nullifier/save",{key:Nullifier.fromJSON(jsonNullifier).key()});

        }catch(err:any) {
          this.stepDisplay = "";
          throw err.response.data.message
        }

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
        const transactionLink = `https://minascan.io/devnet/tx/${hash}?type=zk-tx`;
        this.currentTransactionLink = transactionLink;
        this.stepDisplay = "";
      } catch (err:any) {
        console.log("error ", err);
        throw err

      } finally {
        this.loading = false;
      }
    },
  },
});
