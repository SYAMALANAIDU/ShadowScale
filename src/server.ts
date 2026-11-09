
import Fastify from "fastify";
import { recordMetric, getMetrics } from "./metrics/metrics.js";

const app = Fastify({ logger: true });

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

    const shadowStart = Date.now();

    try {
      const shadowResponse = await fetch(shadowUrl);
      const shadowData = await shadowResponse.json();
      const shadowTimeMs = Date.now() - shadowStart;

      const matches =
        shadowResponse.ok &&
        JSON.stringify(primaryData.products) ===
        JSON.stringify(shadowData.products);

      recordMetric({
        result: matches ? "MATCH" : "MISMATCH",
        primaryTimeMs,
        shadowTimeMs,
      });

      app.log.info({
        result: matches ? "MATCH" : "MISMATCH",
        primaryTimeMs,
        shadowTimeMs,
      }, "SHADOW COMPARISON");

    } catch (shadowError) {
      const shadowTimeMs = Date.now() - shadowStart;

      app.log.error(shadowError, "Shadow server unavailable");

      recordMetric({
        result: "MISMATCH",
        primaryTimeMs,
        shadowTimeMs,
      });
    }

    return reply.code(primaryResponse.status).send(primaryData);

  } catch (error) {
    app.log.error(error, "Primary server request failed");

    return reply.code(502).send({
      service: "Proxy",
      status: "ERROR",
      message: "Primary server unavailable",
    });
  }
});

app.get("/metrics", async () => {
  return getMetrics();
});

app.listen({
  port: 3001,
  host: "127.0.0.1",
});

console.log("ShadowScale Comparison Engine running on port 3001");



