import "dotenv/config";

const API_KEY = process.env.GNANI_API_KEY;

function getApiKey(): string {
  if (!API_KEY) {
    throw new Error("Gnani API key is missing. Check your .env file.");
  }
  return API_KEY;
}

// Gnani Timbre: Text to Speech
export async function speakDiagnostic(text: string): Promise<Buffer> {
  const response = await fetch(
    "https://api.vachana.ai/api/v1/tts/inference",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key-ID": getApiKey(),
      },
      body: JSON.stringify({
        text,
        voice: "Suhana",
        model: "timbre-v2.5",
        language: "te-IN",
        speed: 1.0,
        audio_config: {
          sample_rate: 48000,
          num_channels: 1,
          sample_width: 2,
          encoding: "linear_pcm",
          container: "wav",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gnani TTS failed: HTTP ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

// Gnani Prisma: Speech to Text
export async function transcribeIncident(
  audio: Buffer,
  filename = "incident.wav"
): Promise<string> {
  const form = new FormData();

  form.append(
    "audio_file",
    new Blob([new Uint8Array(audio)], { type: "audio/wav" }),
    filename
  );
  form.append("model", "prisma-v3.0");
  form.append("language_code", "te-IN");

  const response = await fetch("https://api.vachana.ai/stt/v3", {
    method: "POST",
    headers: {
      "X-API-Key-ID": getApiKey(),
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Gnani STT failed: HTTP ${response.status}`);
  }

  const result = (await response.json()) as {
    transcript?: string;
  };

  return result.transcript ?? "";
}