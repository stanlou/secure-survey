import {
    PublicKey,
    fetchAccount,
  } from 'o1js';
  
  export {  loopUntilAccountExists };
  
  async function loopUntilAccountExists({
    account,
    eachTimeNotExist,
    isZkAppAccount,
  }: {
    account: PublicKey;
    eachTimeNotExist: () => void;
    isZkAppAccount: boolean;
  }) {
    for (;;) {
      let response = await fetchAccount({ publicKey: account });
      let accountExists = response.account !== undefined;
      if (isZkAppAccount) {
        accountExists = response.account?.zkapp?.appState !== undefined;
      }
      if (!accountExists) {
        eachTimeNotExist();
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        return response.account!;
      }
    }
  }
  
  
 