import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/products", async (request, reply) => {
  const query = request.query as {
    delay?: string;
    fail?: string;
  };

  // Artificial Delay
  const delay = Number(query.delay) || 0;

  if (delay > 0) {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(delay, 10000))
    );
  }

  // Failure Simulation
  if (query.fail === "true") {
    return reply.code(503).send({
      service: "Shadow",
      status: "CHAOS_FAILURE",
      message: "Simulated server failure"
    });
  }

  // Normal Response
  return {
    service: "Shadow",
    status: "operational",
    products: [
      { id: 1, name: "Laptop", price: 75000 },
      { id: 2, name: "Mobile", price: 25000 }
    ]
  };
});

app.listen({
  port: 3002,
  host: "127.0.0.1"
});