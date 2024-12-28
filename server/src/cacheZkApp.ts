import { Cache } from "o1js";
import { ReduceProgram, SurveyContract } from "secure-survey";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isEmptyDirectory(directoryPath): boolean {
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${err.message}`);
      return true;
    }
    if (files.length === 0) {
      console.log("Directory is empty.");
      return true;
    } else {
      console.log("Directory is not empty.");
      return false;
    }
  });
  return true;
} 

export const cacheZkApp = async () => {
  const zkAppCache: Cache = Cache.FileSystem("./zkAppCache");
  const zkProgramCache: Cache = Cache.FileSystem("./zkProgramCache");
  if (isEmptyDirectory(path.join(__dirname, "../zkProgramCache"))) {
    console.log("caching zkProgram")
    await ReduceProgram.compile({ cache: zkProgramCache });
  }
  if (isEmptyDirectory(path.join(__dirname, "../zkAppCache"))) {
    console.log("caching zkApp")

    await SurveyContract.compile({ cache: zkAppCache });
  }

  console.log("Finish Caching ...");
};
