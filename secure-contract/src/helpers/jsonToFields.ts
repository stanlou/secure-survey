import { Field } from "o1js";

export const jsonToFields = (jsonString:string) =>  {
    const utf8Bytes = new TextEncoder().encode(jsonString);
    const fields = [];
    for (let i = 0; i < utf8Bytes.length; i += 31) {
      const chunk = utf8Bytes.slice(i, i + 31); // Poseidon accepts Field elements, which can hold up to 254 bits
      let fieldValue = Field(0);
      for (let j = 0; j < chunk.length; j++) {
        fieldValue = fieldValue.mul(Field(256)).add(Field(chunk[j]));
      }
      fields.push(fieldValue);
    }
    return fields;
  }
