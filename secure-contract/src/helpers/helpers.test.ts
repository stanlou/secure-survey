import { Field, Poseidon } from "o1js";
import { jsonToFields } from "./jsonToFields";

describe("jsonToFields", () => {
    const testData1 = JSON.stringify({
        logoPosition: "right",
        pages: [
          {
            name: "page1",
            elements: [
              {
                type: "checkbox",
                name: "question1",
                title: "what is your favourite color",
                isRequired: true,
                choices: [
                  { value: "Item 1", text: "Black" },
                  { value: "Item 2", text: "White" },
                  { value: "Item 3", text: "Red" },
                ],
              },
              {
                type: "radiogroup",
                name: "question2",
                title: "who is the best player",
                isRequired: true,
                choices: [
                  { value: "Item 1", text: "messi" },
                  { value: "Item 2", text: "xavi" },
                  { value: "Item 3", text: "iniesta" },
                ],
              },
              {
                type: "tagbox",
                name: "question3",
                title: "choose your position",
                choices: [
                  { value: "Item 1", text: "defender" },
                  { value: "Item 2", text: "midfield" },
                  { value: "Item 3", text: "attacker" },
                ],
              },
              {
                type: "boolean",
                name: "question4",
                title: "are you rich",
              },
              {
                type: "ranking",
                name: "question6",
                choices: [
                  { value: "Item 1", text: "css" },
                  { value: "Item 2", text: "barca" },
                  { value: "Item 3", text: "city" },
                ],
              },
              {
                type: "dropdown",
                name: "question5",
                title: "where do you live",
                choices: [
                  { value: "Item 1", text: "sfax" },
                  { value: "Item 2", text: "tunis" },
                  { value: "Item 3", text: "sousse" },
                ],
              },
            ],
          },
        ],
      })
    const testData2 = JSON.stringify({
        "question1": [
          "Item 2"
        ],
        "question2": "Item 2",
        "question3": [
          "Item 1"
        ],
        "question4": false,
        "question5": "Item 3",
        "question6": [
          "Item 2",
          "Item 1",
          "Item 3"
        ]
      })
  it("should convert a JSON string into an array of Field elements", () => {
    const fieldData1 = jsonToFields(testData1);
    const fieldData2 = jsonToFields(testData2);
    console.log(Poseidon.hash(fieldData1).toString())
    console.log(Poseidon.hash(fieldData2).toString())

    expect(Array.isArray(fieldData1)).toBe(true);
    expect(fieldData1).not.toEqual(fieldData2)

    fieldData1.forEach(field => {
      expect(field).toBeInstanceOf(Field);
    });

  });

});
