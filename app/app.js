const express = require('express');
const redis = require('redis');
const os = require('os');

const app = express();
const port = 3000;

// Redis client setup
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

const redisClient = redis.createClient({
  host: redisHost,
  port: redisPort,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('Redis connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('[INFO] Connected to Redis successfully');
});

// Middleware
app.use(express.json());

// Request counter middleware
app.use((req, res, next) => {
  redisClient.incr('request_count', (err, count) => {
    if (!err) {
      res.set('X-Request-Count', count);
    }
    next();
  });
});

// Home route
app.get('/', (req, res) => {
  const message = {
    status: 'success',
    message: 'Hello from OneData Infrastructure Automation!',
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    environment: process.env.NODE_ENV || 'development'
  };
  res.json(message);
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'OK',
    checks: {
      redis: 'checking...'
    }
  };

  redisClient.ping((err, reply) => {
    if (err) {
      healthcheck.checks.redis = 'FAILED';
      healthcheck.status = 'DEGRADED';
      return res.status(503).json(healthcheck);
    }
    healthcheck.checks.redis = 'OK';
    res.status(200).json(healthcheck);
  });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  redisClient.get('request_count', (err, count) => {
    const stats = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      requests: count || 0,
      timestamp: new Date().toISOString()
    };
    res.json(stats);
  });
});

// Cache endpoint
app.post('/cache/:key', (req, res) => {
  const { key } = req.params;
  const { value, ttl } = req.body;

  if (!value) {
    return res.status(400).json({ error: 'Value is required' });
  }

  const expiry = ttl || 3600;
  redisClient.setex(key, expiry, JSON.stringify(value), (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to cache value' });
    }
    res.json({ message: 'Value cached successfully', key, ttl: expiry });
  });
});

// Retrieve from cache
app.get('/cache/:key', (req, res) => {
  const { key } = req.params;
  redisClient.get(key, (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve from cache' });
    }
    if (!data) {
      return res.status(404).json({ error: 'Key not found in cache' });
    }
    res.json({ key, value: JSON.parse(data) });
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`[INFO] App running on port ${port}`);
  console.log(`[INFO] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[INFO] Redis: ${redisHost}:${redisPort}`);
});
