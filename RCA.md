## Root Cause Analysis

The application intermittently failed to connect to Redis, causing degraded health responses and container restart loops.


## Impact
- API application is not able to connect to Redis
- API application response were degraded

## Root Cause
The environment variable `REDIS_HOST` was not configured in Docker Compose.
Because the application code does not provide a fallback value, Redis hostname resolution fails → application errors.

## Evidence (Logs)
```
[ERROR] Redis Connection Failed: Redis connection to 127.0.0.1:6379 failed - connect ECONNREFUSED 127.0.0.1:6379
```
this has been captured by `docker logs incident-app` and saved in incident-logs.txt

## why the application crash?

- `REDIS_HOST` was never set in docker-compose.yml
- No environment validation logic was implemented

## Proposed Fix

- Add environment validation logic in app.js
  eg: const redisHost = process.env.REDIS_HOST || "redis";

Another Fix:
- Add environment variable in docker-compose.yml
  eg: REDIS_HOST=redis