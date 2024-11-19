<template>
  <SurveyComponent :model="survey" />
</template>
<script setup lang="ts">
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { SurveyComponent } from 'survey-vue3-ui';

const surveyJson ={
  "logoPosition": "right",
  "pages": [
    {
      "name": "page1",
      "elements": [
        {
          "type": "checkbox",
          "name": "question1",
          "title": "what is your favourite color",
          "isRequired": true,
          "choices": [
            {
              "value": "Item 1",
              "text": "Black"
            },
            {
              "value": "Item 2",
              "text": "White"
            },
            {
              "value": "Item 3",
              "text": "Red"
            }
          ]
        },
        {
          "type": "radiogroup",
          "name": "question2",
          "title": "who is the best player",
          "isRequired": true,
          "choices": [
            {
              "value": "Item 1",
              "text": "messi"
            },
            {
              "value": "Item 2",
              "text": "xavi"
            },
            {
              "value": "Item 3",
              "text": "iniesta"
            }
          ]
        },
        {
          "type": "tagbox",
          "name": "question3",
          "title": "choose your position",
          "choices": [
            {
              "value": "Item 1",
              "text": "defender"
            },
            {
              "value": "Item 2",
              "text": "midfield"
            },
            {
              "value": "Item 3",
              "text": "attacker"
            }
          ]
        },
        {
          "type": "boolean",
          "name": "question4",
          "title": "are you rich"
        },
        {
          "type": "ranking",
          "name": "question6",
          "choices": [
            {
              "value": "Item 1",
              "text": "css"
            },
            {
              "value": "Item 2",
              "text": "barca"
            },
            {
              "value": "Item 3",
              "text": "city"
            }
          ]
        },
        {
          "type": "dropdown",
          "name": "question5",
          "title": "where do you live",
          "choices": [
            {
              "value": "Item 1",
              "text": "sfax"
            },
            {
              "value": "Item 2",
              "text": "tunis"
            },
            {
              "value": "Item 3",
              "text": "sousse"
            }
          ]
        }
      ]
    }
  ]
};
const survey = new Model(surveyJson);

const surveyComplete = (survey: any) => {

  console.log(survey.data)
}
survey.onComplete.add(surveyComplete);

</script>
