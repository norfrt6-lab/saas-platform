# Incident Response Runbook

## Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| SEV1  | Complete outage | 15 min | Database down, auth broken |
| SEV2  | Major degradation | 30 min | Billing webhook failures, slow queries |
| SEV3  | Minor issue | 4 hours | UI bugs, non-critical feature broken |
| SEV4  | Low priority | 24 hours | Cosmetic issues, minor improvements |

## Quick Checks

### 1. Health Endpoint
```bash
curl https://app.example.com/api/health | jq
```

### 2. Database Connectivity
```bash
# Check connection pool
curl https://app.example.com/api/health | jq '.checks.database'
```

### 3. Stripe Webhook Status
- Check Stripe Dashboard → Developers → Webhooks
- Look for failed delivery attempts
- Check `processed_webhooks` table for gaps

### 4. Auth Issues
- Check Better Auth session store
- Verify OAuth redirect URLs match environment
- Check cookie domain settings

## Common Issues

### Database Connection Pool Exhaustion
**Symptoms**: 503 errors, health check database fail
**Resolution**:
1. Check `max` pool size in `packages/db/src/client.ts`
2. Look for long-running queries: `SELECT * FROM pg_stat_activity WHERE state = 'active'`
3. Kill idle connections if needed
4. Consider increasing pool size or adding PgBouncer

### Stripe Webhook Failures
**Symptoms**: Plans not updating after payment
**Resolution**:
1. Check webhook secret matches environment
2. Verify webhook endpoint URL in Stripe dashboard
3. Check `processed_webhooks` for the event ID
4. Replay failed webhooks from Stripe dashboard

### Memory Issues
**Symptoms**: Health check memory warning, OOM kills
**Resolution**:
1. Check heap usage in health endpoint
2. Look for memory leaks in background jobs
3. Restart the process
4. Profile with `--inspect` flag if recurring

## Escalation

1. On-call engineer investigates
2. If not resolved in 30 min → involve team lead
3. If customer-impacting → update status page
4. Post-incident: create ADR if architectural change needed
