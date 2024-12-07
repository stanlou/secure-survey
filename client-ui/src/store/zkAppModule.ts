import { defineStore } from "pinia";
import ZkappWorkerClient from "../zkappWorkerClient";
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
const ZKAPP_ADDRESS = "";
export const useZkAppStore = defineStore("useZkAppModule", {
  state: () => ({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    hasWallet: null as null | boolean,
    stepDisplay: "" as string,
    hasBeenSetup: false,
    accountExists: false,
    publicKeyBase58: null as null | any,
    zkappPublicKey: null as null | any,
    requestedConnexion: false,
    error: null as Object | any,
  }),
  getters: {},
  actions: {
    async setupZkApp() {
      if (window.mina) {
        try {
          this.requestedConnexion = true;
          this.stepDisplay = "Loading web worker...";
          this.zkappWorkerClient = new ZkappWorkerClient();
         // await new Promise((resolve) => setTimeout(resolve, 5000));
          this.stepDisplay = "Done loading web worker";
           console.log("cccccccccccccccccc")
          await this.zkappWorkerClient.setActiveInstanceToDevnet();
          console.log("qqqqqqqqqqq")

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
    async checkAccountExists () {
          try { 
            for (;;) {
              this.stepDisplay='Checking if fee payer account exists...' 
              const res = await this.zkappWorkerClient!.fetchAccount(this.publicKeyBase58);
              const accountExists = res.error == null;
              if (accountExists) {
                break;
              }
              await new Promise((resolve) => setTimeout(resolve, 5000));
            } 
          } catch (error: any) {
            this.stepDisplay = `Error checking account: ${error.message}`
          }

         this.accountExists = true;
      }
  
  },
});
