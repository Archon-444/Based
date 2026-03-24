# Incident Response Runbook – Move Market

Use this guide when responding to outages, security incidents, or service degradation.

## 1. Incident Lifecycle Overview

1. **Detection** — Alert fired from monitoring, user report, or engineer observation.
2. **Triage** — Assess severity, confirm incident, assign incident commander (IC).
3. **Containment** — Mitigate or isolate impact.
4. **Resolution** — Restore service to normal.
5. **Post-Incident Review** — Document learnings and action items.

## 2. Roles & Responsibilities

| Role | Responsibility |
|------|----------------|
| Incident Commander (IC) | Leads response, decision making, updates stakeholders. |
| Communications Lead | Status updates (Slack, Statuspage, customers). |
| Subject Matter Expert | Investigates root cause, implements fixes. |
| Scribe | Captures timeline, actions, and evidence for postmortem. |

In smaller incidents one person may cover multiple roles; ensure responsibilities remain clear.

## 3. Severity Levels

| Sev | Description | Examples |
|-----|-------------|----------|
| SEV-1 | Complete outage, loss of funds risk | Smart contract exploit, API unavailable for >10 min |
| SEV-2 | Major degradation, partial outage | Elevated error rates (>5%), oracle delays |
| SEV-3 | Minor impact, single feature degraded | Suggestion endpoint slow, dashboard intermittent |
| SEV-4 | Alert/no impact | Flaky monitoring, false positive |

Always err on the side of higher severity until impact is confirmed.

## 4. Initial Checklist (First 5 Minutes)

1. Acknowledge alert in PagerDuty (or equivalent).
2. Declare incident in `#incident-response` Slack channel.
3. Assign IC + Scribe.
4. Capture initial symptoms:
   - Timestamp
   - Affected services
   - Error messages / logs
5. Notify stakeholders (communication template below).

## 5. Investigation Playbooks

### 5.1 Backend Availability
- Check `/health` endpoint: `curl -I https://api.movemarket.com/health`
- Inspect load balancer metrics (5xx, latency).
- Tail server logs: `kubectl logs -f deployment/movemarket-backend`
- Review `/metrics` for spikes (requests, latency, error counts).
- If crash looping, roll back to previous stable image.

### 5.2 Smart Contract Issues
- Assess on-chain state using Aptos explorer.
- If funds at risk, call `betting::pause` and `collateral_vault::emergency_lock`.
- Notify audit partner if high severity.
- Coordinate governance decision for incident disclosure.

### 5.3 Oracle/Price Feed Disruptions
- Check Pyth feed status (API & Discord channels).
- If feed stale, switch to backup data source via on-chain governance (if available).
- Communicate to users about delayed settlements.

### 5.4 Security Breach Suspected
- Disable wallet bypass headers (set `DEV_BYPASS=false`, redeploy).
- Rotate API keys, revoke compromised secrets.
- Export logs for forensic analysis.
- Engage auditors and legal immediately.

## 6. Communication Templates

### Slack / Internal
```
INCIDENT (SEV-2) – Elevated 5xx responses on /api/suggestions since 12:03 UTC.
IC: @alice | Scribe: @bob
Impact: Users receiving 500 errors when submitting suggestions.
Next update in 15 minutes.
```

### Status Page / External
```
Investigating – We are seeing increased error rates on the Move Market API. Users may experience failure when submitting new suggestions. Our engineers are investigating. Next update in 30 minutes.
```

### Resolution
```
Resolved – The incident impacting suggestion submissions has been resolved. Root cause: exhausted database connections. Mitigation: increased connection pool and added alert. We continue to monitor.
```

## 7. Containment & Recovery

| Scenario | Mitigation |
|----------|------------|
| Backend overloaded | Scale deployment (HPA), enable circuit breaker, reduce rate limit window. |
| Database exhaustion | Increase pool, terminate idle connections, failover to replica. |
| Smart contract bug | Pause affected modules, craft remediation plan, deploy fix under auditor guidance. |
| Key compromise | Rotate keys/secrets, invalidate tokens, update wallets registry. |

## 8. Post-Incident Review (within 48h)

1. Schedule review meeting.
2. Compile timeline from scribe notes.
3. Identify contributing factors (technical & organisational).
4. Produce action items with owners & due dates.
5. Publish postmortem to internal wiki + optionally public blog.

### Postmortem Template
```
Summary:
Impact:
Timeline:
Root Cause:
What Went Well:
What Went Poorly:
Action Items:
```

## 9. Tooling Reference

- Grafana dashboard: `Backend Overview`
- Prometheus alerts: `monitoring/prometheus/alerts.yml`
- Log aggregation: (insert link)
- Runbooks: `DEPLOYMENT_RUNBOOK.md`, `USDC_INTEGRATION.md`

## 10. Preventative Measures

- Maintain automated load tests (`npm run loadtest:all`).
- Review rate limit metrics weekly.
- Keep audit findings tracker updated.
- Run chaos/fire drills quarterly.
- Update runbooks after every incident.
