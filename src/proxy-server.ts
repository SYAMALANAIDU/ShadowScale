
import { readFile } from "node:fs/promises";
import path from "node:path";
import Fastify from "fastify";

import { recordMetric, getMetrics } from "./metrics/metrics.js";
import { diagnoseIncident } from "./diagnostic.js";
import { compareJson } from "./structural-diff.js";
import { maskSensitiveData } from "./privacy-shield.js";
import { speakDiagnostic, transcribeIncident } from "./gnani.js";

const app = Fastify({
  logger: true,
  bodyLimit: 2 * 1024 * 1024,
});

// Primary API + Asynchronous Shadow Comparison
app.get("/products", async (request, reply) => {
  const query = request.query as {
    delay?: string;
    fail?: string;
  };

  const shadowParams = new URLSearchParams();

  if (query.delay) shadowParams.set("delay", query.delay);
  if (query.fail) shadowParams.set("fail", query.fail);

  const shadowUrl = `http://127.0.0.1:3002/products${
    shadowParams.toString() ? `?${shadowParams.toString()}` : ""
  }`;

  try {
    const primaryStart = Date.now();

    const primaryResponse = await fetch(
      "http://127.0.0.1:3001/products"
    );

    const primaryTimeMs = Date.now() - primaryStart;
    const primaryData = await primaryResponse.json();

    // Shadow comparison runs independently.
    void (async () => {
      try {
        const shadowStart = Date.now();

        const shadowResponse = await fetch(shadowUrl);
        const shadowTimeMs = Date.now() - shadowStart;
        const shadowData = await shadowResponse.json();

        const matches =
          JSON.stringify(primaryData.products) ===
          JSON.stringify(shadowData.products);

        recordMetric({
          result: matches ? "MATCH" : "MISMATCH",
          primaryTimeMs,
          shadowTimeMs,
        });

        app.log.info(
          {
            result: matches ? "MATCH" : "MISMATCH",
            primaryTimeMs,
            shadowTimeMs,
          },
          "ASYNC SHADOW COMPARISON"
        );
      } catch (error) {
        app.log.error(error, "Asynchronous shadow request failed");
      }
    })();

    return reply.code(primaryResponse.status).send(primaryData);
  } catch (error) {
    app.log.error(error, "Proxy request failed");

    return reply.code(502).send({
      service: "Proxy",
      status: "ERROR",
      message: "Unable to reach backend server",
    });
  }
});

// Metrics API
app.get("/metrics", async () => {
  return getMetrics();
});

// Structural JSON Difference + Privacy Shield API
app.get("/diff", async (request, reply) => {
  try {
    const primaryResponse = await fetch(
      "http://127.0.0.1:3001/products"
    );

    const shadowResponse = await fetch(
      "http://127.0.0.1:3002/products"
    );

    if (!primaryResponse.ok || !shadowResponse.ok) {
      return reply.code(502).send({
        error: "Unable to compare backend responses",
      });
    }

    const primaryData = await primaryResponse.json();
    const shadowData = await shadowResponse.json();

    const diffResult = compareJson(primaryData, shadowData);

    const safeDifferences = diffResult.differences.map((difference) => {
      const sensitivePath =
        /password|secret|token|api[_-]?key|authorization|email|private[_-]?key/i
          .test(difference.path);

      if (sensitivePath) {
        return {
          ...difference,
          primaryValue: "[REDACTED]",
          shadowValue: "[REDACTED]",
        };
      }

      return maskSensitiveData(difference) as typeof difference;
    });

    return {
      ...diffResult,
      differences: safeDifferences,
    };
  } catch (error) {
    app.log.error(error, "Structural diff failed");

    return reply.code(502).send({
      error: "Unable to generate structural differences",
    });
  }
});

// Local Diagnostic API
app.get("/diagnostic", async () => {
  return diagnoseIncident();
});

// Gnani AI Voice Diagnostic API
app.post("/voice-diagnostic", async (request, reply) => {
  try {
    const body = request.body as {
      audioBase64?: string;
      filename?: string;
    };

    if (
      !body ||
      typeof body.audioBase64 !== "string" ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(body.audioBase64)
    ) {
      return reply.code(400).send({
        error: "Valid base64 audio is required.",
      });
    }

    const audio = Buffer.from(body.audioBase64, "base64");

    if (audio.length === 0 || audio.length > 1024 * 1024) {
      return reply.code(400).send({
        error: "Audio must be between 1 byte and 1 MB.",
      });
    }

    // Step 1: Gnani Prisma speech-to-text
    const transcript = await transcribeIncident(
      audio,
      body.filename || "incident.wav"
    );

    if (!transcript.trim()) {
      return reply.code(422).send({
        error: "No speech was detected in the audio.",
      });
    }

    // Step 2: Run ShadowScale diagnostics
    const diagnosis = diagnoseIncident();

    // Step 3: Prepare a spoken diagnostic report
    const spokenReport = [
      `Mee voice report: ${transcript}.`,
      `ShadowScale status: ${diagnosis.status}.`,
      `Match rate: ${diagnosis.matchRate} percent.`,
      `Issues: ${diagnosis.issues.join(". ")}.`,
      `Recommendations: ${diagnosis.recommendations.join(". ")}.`,
    ].join(" ");

    // Step 4: Gnani Timbre text-to-speech
    const audioResponse = await speakDiagnostic(spokenReport);

    return {
      success: true,
      transcript,
      diagnosis,
      audioContentType: "audio/wav",
      audioBase64: audioResponse.toString("base64"),
    };
  } catch (error) {
    app.log.error(error, "Voice diagnostic failed");

    return reply.code(502).send({
      error: "Unable to complete Gnani voice diagnosis.",
    });
  }
});

// Dashboard
app.get("/", async (request, reply) => {
  const html = await readFile(
    path.join(process.cwd(), "public", "index.html"),
    "utf8"
  );

  return reply.type("text/html").send(html);
});

// Start server
const start = async () => {
  try {
    await app.listen({
      port: 3003,
      host: "127.0.0.1",
    });

    console.log("ShadowScale Comparison Engine running on port 3003");
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
