import { writeFile } from "node:fs/promises";
import { speakDiagnostic } from "./gnani.js";

const audio = await speakDiagnostic(
  "Namaskaram! ShadowScale AI voice assistant ready ga undi."
);

await writeFile("gnani-test.wav", audio);

console.log("Gnani TTS test successful!");