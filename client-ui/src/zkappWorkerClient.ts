import { fetchAccount } from 'o1js';

import type {
  ZkappWorkerRequest,
  ZkappWorkerReponse,
  WorkerFunctions,
} from './zkappWorker';

export default class ZkappWorkerClient {
  // worker functions

  async setActiveInstanceToDevnet() {
    return this._call('setActiveInstanceToDevnet', {});
  }

  async loadContract() {
    return this._call('loadContract', {});
  }

  async compileContract() {
    return this._call('compileContract', {});
  }

  async fetchAccount(publicKey:string): ReturnType<typeof fetchAccount> {
    const result = this._call('fetchAccount', {
      publicKey58: publicKey
    });
    return result as ReturnType<typeof fetchAccount>;
  }

  async initZkappInstance(publicKeyBase58: string) {
    return await this._call('initZkappInstance',{publicKeyBase58});
  }

  async proveTransaction() {
    return this._call('proveTransaction', {});
  }

  async getTransactionJSON() {
    const result = await this._call('getTransactionJSON', {});
    return result;
  }

  // worker initialization

  worker: Worker;

  promises: {
    [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
  };

  nextId: number;

  constructor() {
    this.worker = new Worker(new URL('./zkappWorker.ts', import.meta.url), { type: 'module' });
    this.promises = {};
    this.nextId = 0;

    this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
      this.promises[event.data.id].resolve(event.data.data);
      delete this.promises[event.data.id];
    };
  }

  _call(fn: WorkerFunctions, args: any) {
    return new Promise((resolve, reject) => {
      this.promises[this.nextId] = { resolve, reject };

      const message: ZkappWorkerRequest = {
        id: this.nextId,
        fn,
        args,
      };

      this.worker.postMessage(message);

      this.nextId++;
    });
  }
}