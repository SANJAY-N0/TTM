# TimeToMeal Production Monitoring & Alerting

## 1. Structured Logging
- **Logger**: Pino structured JSON logger.
- **Log Levels**: `info`, `warn`, `error`, `debug`.

## 2. Health & Uptime Verification
- **Endpoint**: `/healthz` (returns HTTP 200 with DB status & timestamp).
- **Service Uptime**: Tracked via UptimeRobot / Grafana.
