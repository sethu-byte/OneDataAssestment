const express = require('express');
const redis = require('redis');
const app = express();

const PORT = 3000;

// BUG: Missing fallback. If REDIS_HOST is not set → crash / intermittent failure.
const redisHost = process.env.REDIS_HOST; 
const redisPort = 6379;

const client = redis.createClient({
  host: redisHost,
  port: redisPort,
});

client.on('error', (err) => {
  console.error("[ERROR] Redis Connection Failed:", err.message);
});

app.get("/", (req, res) => {
  client.incr('counter', (err, count) => {
    if (err) return res.status(500).json({ error: "Redis error" });
    res.json({ message: "Hello", request_number: count });
  });
});

app.get("/health", (req, res) => {
  client.ping((err) => {
    if (err) return res.status(503).json({ status: "DEGRADED", redis: "FAILED" });
    res.json({ status: "OK", redis: "CONNECTED" });
  });
});

app.listen(PORT, () => {
  console.log(`[APP] Running on port ${PORT}`);
});
