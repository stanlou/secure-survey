interface MinaWallet {
    requestAccounts: () => Promise<string[]>;
    signMessage: (args: { message: string }) => Promise<{ publicKey: string; signature: string }>;
  }
  
  declare global {
    interface Window {
      mina?: MinaWallet;
    }
  }
  
  export async function connectToMinaWallet(): Promise<{ success: boolean; account?: string; message?: string }> {
    if (window.mina) {
      try {
        const accounts = await window.mina.requestAccounts();
        if (accounts.length > 0) {
          return { success: true, account: accounts[0] };
        }
        return { success: false, message: "No accounts found in Mina Wallet." };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    } else {
      return { success: false, message: "Mina Wallet not detected. Please install Auro Wallet." };
    }
  }