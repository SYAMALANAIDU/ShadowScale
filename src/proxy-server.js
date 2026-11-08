"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const fastify_1 = __importDefault(require("fastify"));
const metrics_1 = require("./metrics/metrics");
const metrics_2 = require("./metrics/metrics");
const app = (0, fastify_1.default)({ logger: true });
app.get("/products", async (request, reply) => {
    const query = request.query;
    const shadowParams = new URLSearchParams();
    if (query.delay)
        shadowParams.set("delay", query.delay);
    if (query.fail)
        shadowParams.set("fail", query.fail);
    const shadowUrl = `http://127.0.0.1:3002/products${shadowParams.toString() ? `?${shadowParams.toString()}` : ""}`;
    try {
        const primaryStart = Date.now();
        const primaryResponse = await fetch("http://127.0.0.1:3001/products");
        const primaryTimeMs = Date.now() - primaryStart;
        const primaryData = await primaryResponse.json();
        const shadowStart = Date.now();
        const shadowResponse = await fetch(shadowUrl);
        const shadowTimeMs = Date.now() - shadowStart;
        const shadowData = await shadowResponse.json();
        const matches = JSON.stringify(primaryData.products) ===
            JSON.stringify(shadowData.products);
        app.log.info({
            result: matches ? "MATCH" : "MISMATCH",
            primaryTimeMs,
            shadowTimeMs,
            primaryData,
            shadowData,
        }, "SHADOW COMPARISON");
        (0, metrics_1.recordMetric)({
            result: matches ? "MATCH" : "MISMATCH",
            primaryTimeMs,
            shadowTimeMs,
        });
        return reply.code(primaryResponse.status).send(primaryData);
    }
    catch (error) {
        app.log.error(error, "Proxy request failed");
        return reply.code(502).send({
            service: "Proxy",
            status: "ERROR",
            message: "Unable to reach backend server",
        });
    }
});
app.get("/metrics", async () => {
    return (0, metrics_2.getMetrics)();
});
app.get("/", async (request, reply) => { return reply.type("text/html").send((0, node_fs_1.readFileSync)((0, node_path_1.join)(process.cwd(), "public", "index.html"), "utf8")); });
app.listen({
    port: 3003,
    host: "127.0.0.1",
});
console.log("ShadowScale Comparison Engine running on port 3003");
