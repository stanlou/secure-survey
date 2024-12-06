<template>
    <div id="surveyVizPanel" />
  </template>
  
<script>
import 'survey-analytics/survey.analytics.min.css';
import { Model } from 'survey-core';
import { VisualizationPanel } from 'survey-analytics';

const surveyJson = {
  "pages": [
    {
      "name": "page1",
      "elements": [
        {
          "name": "question1",
          "type": "checkbox",
          "title": "what is your favourite color",
          "choices": [
            {
              "text": "Black",
              "value": "Item 1"
            },
            {
              "text": "White",
              "value": "Item 2"
            },
            {
              "text": "Red",
              "value": "Item 3"
            }
          ],
          "isRequired": true
        },
        {
          "name": "question2",
          "type": "radiogroup",
          "title": "who is the best player",
          "choices": [
            {
              "text": "messi",
              "value": "Item 1"
            },
            {
              "text": "xavi",
              "value": "Item 2"
            },
            {
              "text": "iniesta",
              "value": "Item 3"
            }
          ],
          "isRequired": true
        },
        {
          "name": "question3",
          "type": "tagbox",
          "title": "choose your position",
          "choices": [
            {
              "text": "defender",
              "value": "Item 1"
            },
            {
              "text": "midfield",
              "value": "Item 2"
            },
            {
              "text": "attacker",
              "value": "Item 3"
            }
          ]
        },
        {
          "name": "question4",
          "type": "boolean",
          "title": "are you rich"
        },
        {
          "name": "question6",
          "type": "ranking",
          "choices": [
            {
              "text": "css",
              "value": "Item 1"
            },
            {
              "text": "barca",
              "value": "Item 2"
            },
            {
              "text": "city",
              "value": "Item 3"
            }
          ]
        },
        {
          "name": "question5",
          "type": "dropdown",
          "title": "where do you live",
          "choices": [
            {
              "text": "sfax",
              "value": "Item 1"
            },
            {
              "text": "tunis",
              "value": "Item 2"
            },
            {
              "text": "sousse",
              "value": "Item 3"
            }
          ]
        }
      ]
    }
  ],
  "title": "my First survey",
  "description": "this is a testing survey\r\n",
  "logoPosition": "right"
}

const surveyResults = [{
  "surveyId": "0d02fd77-6020-486a-a2dd-86d30f275052",
  "question1": [
    "Item 2"
  ],
  "question2": "Item 1",
  "question3": [
    "Item 2"
  ],
  "question4": false,
  "question5": "Item 1",
  "question6": [
    "Item 1",
    "Item 3",
    "Item 2"
  ]
}];
const vizPanelOptions = {
  allowHideQuestions: false
}
export default {
  mounted() {
    const survey = new Model(surveyJson);
    const vizPanel = new VisualizationPanel(
      survey.getAllQuestions(),
      surveyResults,
      vizPanelOptions
    );
    vizPanel.render("surveyVizPanel");
  
}

}

</script>