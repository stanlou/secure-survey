<template>
  <div>
    {{  stepDisplay}}
    <el-button type="primary" @click="authenticateWithMina">Connect Mina Wallet</el-button>
    <p v-if="publicKeyBase58">Connected Account: {{ publicKeyBase58 }}</p>
    <p v-if="error" style="color: red;">Error: {{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {useZkAppStore } from "@/store/zkAppModule"
import { storeToRefs } from "pinia";

const {setupZkApp } = useZkAppStore()
const {error, stepDisplay,publicKeyBase58} = storeToRefs(useZkAppStore())
// Function to authenticate with Mina wallet
const authenticateWithMina = async () => {
  await setupZkApp();
};
</script>

<style scoped>
</style>
