const express = require("express");
const client = require("prom-client");
const app = express();
const register = new client.Registry();

// Default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({ register });

app.get("/", (req, res) => {
  res.json({ message: "Hello from monitored app!" });
});

// Metrics endpoint for Prometheus
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
});

app.listen(3000, () => {
  console.log("App running on port 3000");
});
