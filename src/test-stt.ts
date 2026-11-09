import { readFile } from "node:fs/promises";
import { transcribeIncident } from "./gnani.js";

const audio = await readFile("gnani-test.wav");

const transcript = await transcribeIncident(
  audio,
  "gnani-test.wav"
);

console.log("Gnani STT Result:");
console.log(transcript);