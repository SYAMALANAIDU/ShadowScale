import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/", async () => {
  return {
    service: "ShadowScale Dashboard",
    status: "operational",
    message: "Dashboard API is running"
  };
});

app.get("/metrics", async () => {
  const response = await fetch("http://127.0.0.1:3003/metrics");
  return await response.json();
});

app.get("/dashboard", async (request, reply) => {
  return reply.type("text/html").send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>ShadowScale Dashboard</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial; background: #101827; color: white; padding: 30px; }
        h1 { color: #60a5fa; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 20px; margin-top: 25px; }
        .card { background: #1e293b; padding: 25px; border-radius: 12px; border: 1px solid #334155; }
        .card h3 { color: #94a3b8; font-size: 15px; }
        .value { font-size: 30px; font-weight: bold; }
        #status { color: #4ade80; }
      </style>
    </head>
    <body>
      <h1>ShadowScale Dashboard</h1>
      <p id="status">Loading metrics...</p>
      <div class="grid">
        <div class="card"><h3>Total Requests</h3><div class="value" id="totalRequests">0</div></div>
        <div class="card"><h3>Matches</h3><div class="value" id="matches">0</div></div>
        <div class="card"><h3>Mismatches</h3><div class="value" id="mismatches">0</div></div>
        <div class="card"><h3>Primary Total Time</h3><div class="value" id="totalPrimaryTime">0</div></div>
        <div class="card"><h3>Shadow Total Time</h3><div class="value" id="totalShadowTime">0</div></div>
        <div class="card"><h3>Average Primary Time</h3><div class="value" id="averagePrimaryTime">0</div></div>
        <div class="card"><h3>Average Shadow Time</h3><div class="value" id="averageShadowTime">0</div></div>
      </div>
      <script>
        async function loadMetrics() {
          try {
            const response = await fetch("/metrics");
            if (!response.ok) throw new Error("Metrics request failed");
            const data = await response.json();
            Object.keys(data).forEach(key => {
              const element = document.getElementById(key);
              if (element) element.textContent = data[key];
            });
            document.getElementById("status").textContent = "Live metrics connected";
          } catch (error) {
            document.getElementById("status").textContent = "Unable to load metrics";
          }
        }
        loadMetrics();
        setInterval(loadMetrics, 3000);
      </script>
    </body>
    </html>
  `);
});

const start = async () => {
  try {
    await app.listen({ port: 3004, host: "127.0.0.1" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();