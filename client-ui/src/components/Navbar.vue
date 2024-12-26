<template>
    <nav class="navbar navbar-expand-lg navbar-light" style="background: white">
      <div class="container-fluid">
        <a class="navbar-brand" href="#" style="color: #19b394">Navbar</a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNavAltMarkup"
          aria-controls="navbarNavAltMarkup"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
          <div class="navbar-nav">
            <a class="nav-link custom-hover" aria-current="page" href="#"  @click="navigateToHome">Home</a>
            <a class="nav-link custom-hover" href="#" @click="navigateToCreateSurvey">Create Survey</a>
          </div>
        </div>
      </div>
    </nav>
  </template>
  
  <script lang="ts">
  export default {
    name: "Navbar",
    methods: {
      navigateToHome() {
        this.$router.push({ name: "home" });
      },
      navigateToCreateSurvey() {
        this.$router.push({ name: "create-survey" });
      },
    },
  };
  </script>
  
  <style scoped>
  /* Base styles for the navbar links */
  .navbar-nav .nav-link {
    position: relative;
    text-transform: uppercase;
    text-decoration: none;
    color: #000;
    letter-spacing: 0.15em;
    display: inline-block;
    padding: 15px 20px;
  }
  
  /* Animated underline */
  .navbar-nav .nav-link:after {
    content: "";
    display: block;
    height: 2px;
    background-color: transparent;
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    transition: width 0.3s ease, left 0.3s ease, background-color 0.3s ease;
  }
  
  /* Hover effect */
  .navbar-nav .nav-link:hover {
    color: #19b394; /* Green color on hover */
  }
  
  .navbar-nav .nav-link:hover:after {
    background-color: #19b394; /* Green underline */
    width: 100%;
    left: 0;
  }
  
  </style>
  