const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    compress: true,
    allowedHosts: "all", // This replaces disableHostCheck
    client: {
      webSocketURL: {
        protocol: 'wss', // Use secure WebSocket
        port: 8080, // Match your dev server's port
      },
    },
  },


})
