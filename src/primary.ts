import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/products", async () => {
  return {
    service: "Primary",
    products: [
      { id: 1, name: "Laptop", price: 75000 },
      { id: 2, name: "Mobile", price: 25000 }
    ]
  };
});

app.listen({ port: 3001, host: "127.0.0.1" });
