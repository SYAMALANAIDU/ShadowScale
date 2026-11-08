import { readFileSync } from "node:fs";
import { join } from "node:path";
import Fastify from "fastify";
import { recordMetric } from "./metrics/metrics";
import { getMetrics } from "./metrics/metrics";

const app = Fastify({ logger: true });app.get("/products", async (request, reply) => {
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
    const shadowResponse = await fetch(shadowUrl);
    const shadowTimeMs = Date.now() - shadowStart;
    const shadowData = await shadowResponse.json();

    const matches =
      JSON.stringify(primaryData.products) ===
      JSON.stringify(shadowData.products);

    app.log.info({
      result: matches ? "MATCH" : "MISMATCH",
      primaryTimeMs,
      shadowTimeMs,
      primaryData,
      shadowData,
    }, "SHADOW COMPARISON");
    recordMetric({
  result: matches ? "MATCH" : "MISMATCH",
  primaryTimeMs,
  shadowTimeMs,
});

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
app.get("/metrics", async () => {
  return getMetrics();
});

app.get("/", async (request, reply) => { return reply.type("text/html").send(readFileSync(join(process.cwd(), "public", "index.html"), "utf8")); });

app.listen({
  port: 3003,
  host: "127.0.0.1",
});

console.log("ShadowScale Comparison Engine running on port 3003");

