<template>
<div>

  <router-view />

</div>
</template>
<script setup lang="ts">
import { onMounted, watch } from 'vue';
import {useZkAppStore } from "@/store/zkAppModule"
import { storeToRefs } from 'pinia';
const {zkappWorkerClient,hasBeenSetup,accountExists,requestedConnexion} = storeToRefs(useZkAppStore())
const {checkAccountExists,setupZkApp} = (useZkAppStore())
onMounted(async() => {
  await setupZkApp()
})
watch([() => zkappWorkerClient.value,() => hasBeenSetup.value,() => accountExists.value],async ()=> {
  if(hasBeenSetup.value && !accountExists.value){
    await checkAccountExists()
  }
})

</script>
<style scoped>  
</style>
