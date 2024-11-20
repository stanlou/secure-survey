<template>
    <div>
      <el-button type="primary" @click="authenticateWithMina">Connect Mina Wallet</el-button>
      <p v-if="account">Connected Account: {{ account }}</p>
      <p v-if="error" style="color: red;">Error: {{ error }}</p>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from "vue";
  import { connectToMinaWallet } from "@/helper/walletConnection";
  
  export default defineComponent({
    name: "MinaAuth",
    setup() {
      const account = ref<string | null>(null);
      const error = ref<string | null>(null);
  
      const authenticateWithMina = async () => {
        const result = await connectToMinaWallet();
        if (result.success) {
          account.value = result.account ?? null;
          error.value = null;
        } else {
          account.value = null;
          error.value = result.message ?? "Unknown error.";
        }
      };
  
      return { account, error, authenticateWithMina };
    },
  });
  </script>
  
  <style scoped>
  </style>
  