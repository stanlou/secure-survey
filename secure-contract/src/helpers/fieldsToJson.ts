import { Field } from "o1js";

export const fieldsToJson = (fields:Field[]) => {
    let byteArray = [];
    for (let field of fields) {
      let value = field.toBigInt();  
      const bytes = [];
      while (value > 0) {
        bytes.unshift(Number(value % 256n));  
        value = value / 256n;
      }
      byteArray.push(...bytes);
    }
    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(byteArray)); 
  }
  
  