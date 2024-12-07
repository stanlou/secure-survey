<template>
<div>

  <router-view />

</div>
</template>
<script setup lang="ts">
import { watch } from 'vue';
import {useZkAppStore } from "@/store/zkAppModule"
import { storeToRefs } from 'pinia';
const {zkappWorkerClient,hasBeenSetup,accountExists,requestedConnexion} = storeToRefs(useZkAppStore())
const {checkAccountExists} = (useZkAppStore())

watch([() => zkappWorkerClient.value,() => hasBeenSetup.value,() => accountExists.value],async ()=> {
  console.log("watch")
  if(hasBeenSetup.value && !accountExists.value && requestedConnexion.value){
    console.log("watch 222")

    await checkAccountExists()
  }
})

</script>
<style scoped>  
</style>
