# Rollback Plan - Multi-Tenant Refactor Completion

**Project:** ALFI CRM Multi-Tenant Refactoring  
**Version:** 1.0.0  
**Date:** November 17, 2025  
**Prepared by:** Kiro AI

---

## Executive Summary

This document provides detailed procedures for rolling back the multi-tenant refactoring deployment in case of critical issues. The rollback strategy is designed to restore the system to its previous stable state with minimal downtime.

**Rollback Type:** Code reversion (no database schema changes)  
**Estimated Rollback Time:** 2-15 minutes  
**Data Loss Risk:** None (no schema changes)

---

## Rollback Triggers

### Automatic Rollback Triggers

Rollback **IMMEDIATELY** if any of these conditions occur:

1. **Critical System Failures**
   - Application crashes on startup
   - Database connection failures
   - Authentication system failure
   - Error rate > 10%

2. **Security Breaches**
   - Tenant isolation breach detected
   - Unauthorized data access
   - Cross-cabinet data leakage
   - Authentication bypass

3. **Data Integrity Issues**
   - Data corruption detected
   - Missing required data
   - Incorrect data relationships
   - Patrimoine calculation errors

### Manual Rollback Triggers

Consider rollback if:

1. **Performance Degradation**
   - Response times > 5 seconds (p95)
   - Database query timeouts
   - Memory leaks detected
   - CPU usage > 95% sustained

2. **Functional Issues**
   - Critical features not working
   - User workflows broken
   - API endpoints returning errors
   - Error rate > 5%

3. **Business Impact**
   - Users unable to work
   - Support ticket surge
   - Revenue-impacting issues
   - Stakeholder escalation

---

## Rollback Decision Matrix

| Issue Severity | Error Rate | Response Time | Action |
|---------------|------------|---------------|--------|
| Critical | > 10% | > 10s | **IMMEDIATE ROLLBACK** |
| High | 5-10% | 5-10s | **ROLLBACK RECOMMENDED** |
| Medium | 2-5% | 2-5s | **MONITOR & DECIDE** |
| Low | < 2% | < 2s | **CONTINUE MONITORING** |

---

## Rollback Procedures

### Option 1: Quick Code Rollback (Recommended)

**Use when:** Application issues, no database changes needed  
**Duration:** 2-5 minutes  
**Risk:** Low

#### Steps

1. **Identify Previous Stable Version**
   ```bash
   # List recent tags
   git tag -l --sort=-version:refname | head -5
   
   # Identify the tag before multi-tenant refactor
   # Example: v0.9.9-stable
   ```

2. **Revert Code**
   ```bash
   # Navigate to project directory
   cd /path/to/alfi-crm
   
   # Checkout previous stable version
   git fetch --all
   git checkout v0.9.9-stable
   
   # Verify correct version
   git log -1
   ```

3. **Reinstall Dependencies**
   ```bash
   # Clean install dependencies
   rm -rf node_modules
   npm ci
   ```

4. **Rebuild Application**
   ```bash
   # Build for production
   npm run build
   ```

5. **Restart Application**
   ```bash
   # Using PM2
   pm2 restart alfi-crm-production --update-env
   
   # Or using systemd
   sudo systemctl restart alfi-crm
   
   # Or using Docker
   docker-compose restart
   ```

6. **Verify Rollback**
   ```bash
   # Health check
   curl https://alfi-crm.com/api/health
   
   # Test authentication
   curl -X POST https://alfi-crm.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test"}'
   
   # Check application logs
   pm2 logs alfi-crm-production --lines 50
   ```

---

### Option 2: Database + Code Rollback

**Use when:** Database migrations were applied (not applicable for this deployment)  
**Duration:** 5-15 minutes  
**Risk:** Medium

#### Steps

1. **Stop Application**
   ```bash
   pm2 stop alfi-crm-production
   ```

2. **Restore Database**
   ```bash
   # Identify backup file
   ls -lh backups/ | grep $(date +%Y%m%d)
   
   # Restore from backup
   psql -h <host> -U <user> -d <database> < backup-YYYYMMDD-HHMMSS.sql
   
   # Or using npm script
   npm run db:restore:production backup-YYYYMMDD-HHMMSS.sql
   ```

3. **Verify Database Restoration**
   ```bash
   # Connect to database
   psql -h <host> -U <user> -d <database>
   
   # Check record counts
   SELECT 'documents' as table, COUNT(*) FROM documents
   UNION ALL
   SELECT 'projets', COUNT(*) FROM projets
   UNION ALL
   SELECT 'opportunites', COUNT(*) FROM opportunites;
   
   # Verify data integrity
   SELECT COUNT(*) FROM documents WHERE cabinetId IS NULL;
   ```

4. **Revert Code** (Same as Option 1, steps 2-4)

5. **Restart Application** (Same as Option 1, step 5)

6. **Verify Rollback** (Same as Option 1, step 6)

---

### Option 3: Full System Rollback

**Use when:** Complete system failure, all other options failed  
**Duration:** 10-30 minutes  
**Risk:** High

#### Steps

1. **Enable Maintenance Mode**
   ```bash
   npm run maintenance:enable
   ```

2. **Stop All Services**
   ```bash
   pm2 stop all
   # Or
   sudo systemctl stop alfi-crm
   sudo systemctl stop postgresql
   ```

3. **Restore from System Snapshot**
   ```bash
   # AWS EC2 example
   aws ec2 create-image --instance-id <instance-id> --name "rollback-$(date +%Y%m%d)"
   aws ec2 restore-from-snapshot --snapshot-id <snapshot-id>
   
   # Or using backup tool
   npm run system:restore <snapshot-id>
   ```

4. **Verify System State**
   ```bash
   # Check all services
   pm2 status
   sudo systemctl status postgresql
   sudo systemctl status alfi-crm
   ```

5. **Disable Maintenance Mode**
   ```bash
   npm run maintenance:disable
   ```

6. **Comprehensive Verification**
   ```bash
   npm run test:smoke:production
   ```

---

## Rollback Verification Checklist

### Immediate Verification (0-5 minutes)

- [ ] Application starts successfully
- [ ] Health endpoint responds (200 OK)
- [ ] Database connection established
- [ ] No errors in application logs
- [ ] Authentication working

### Functional Verification (5-15 minutes)

- [ ] Users can log in
- [ ] Documents can be accessed
- [ ] Projets can be viewed
- [ ] Opportunités can be listed
- [ ] Clients can be searched
- [ ] No tenant isolation issues

### Performance Verification (15-30 minutes)

- [ ] Response times < 2 seconds (p95)
- [ ] Error rate < 1%
- [ ] Database queries performing well
- [ ] Memory usage normal
- [ ] CPU usage normal

### Business Verification (30-60 minutes)

- [ ] Critical workflows working
- [ ] No user complaints
- [ ] Support tickets normal
- [ ] Revenue operations unaffected
- [ ] Stakeholders informed

---

## Post-Rollback Actions

### Immediate Actions (0-1 hour)

1. **Notify Stakeholders**
   ```
   Subject: ALFI CRM Deployment Rolled Back
   
   The deployment of the multi-tenant refactoring has been rolled back
   due to [REASON]. The system is now running on the previous stable
   version. All functionality has been restored.
   
   Impact: [DESCRIBE IMPACT]
   Next Steps: [DESCRIBE NEXT STEPS]
   ```

2. **Document Rollback**
   - Record rollback time
   - Document reason for rollback
   - List issues encountered
   - Note any data affected

3. **Preserve Evidence**
   ```bash
   # Save error logs
   pm2 logs alfi-crm-production --lines 1000 > rollback-logs-$(date +%Y%m%d-%H%M%S).log
   
   # Save database state (if applicable)
   pg_dump -h <host> -U <user> -d <database> > rollback-db-state-$(date +%Y%m%d-%H%M%S).sql
   
   # Save monitoring data
   npm run monitoring:export > rollback-metrics-$(date +%Y%m%d-%H%M%S).json
   ```

### Short-term Actions (1-24 hours)

1. **Root Cause Analysis**
   - Analyze error logs
   - Review monitoring data
   - Identify failure points
   - Document findings

2. **Fix Issues**
   - Address identified problems
   - Update code in development
   - Add additional tests
   - Improve error handling

3. **Re-test in Staging**
   - Deploy fixes to staging
   - Run comprehensive tests
   - Verify issues resolved
   - Get stakeholder approval

### Long-term Actions (1-7 days)

1. **Improve Deployment Process**
   - Update deployment checklist
   - Add additional safeguards
   - Improve monitoring
   - Enhance testing

2. **Schedule Re-deployment**
   - Choose new deployment window
   - Notify stakeholders
   - Prepare team
   - Execute deployment

---

## Rollback Communication Plan

### Internal Communication

**Immediate (During Rollback):**
- Notify deployment team via Slack/Teams
- Update status page
- Alert support team

**Post-Rollback:**
- Send email to all stakeholders
- Update project management system
- Schedule post-mortem meeting

### External Communication

**If User-Facing:**
```
Subject: Service Restoration Complete

We have successfully restored the ALFI CRM service to full functionality.
The brief service interruption has been resolved.

We apologize for any inconvenience and thank you for your patience.

If you experience any issues, please contact support@alfi-crm.com
```

**If Internal Only:**
- No external communication needed
- Update internal status page only

---

## Rollback Testing

### Pre-Deployment Rollback Test

Before production deployment, test the rollback procedure in staging:

```bash
# 1. Deploy new version to staging
npm run deploy:staging

# 2. Verify deployment
npm run test:staging

# 3. Practice rollback
git checkout v0.9.9-stable
npm ci
npm run build
pm2 restart alfi-crm-staging

# 4. Verify rollback
npm run test:staging

# 5. Document any issues
```

---

## Rollback Metrics

### Track These Metrics

1. **Rollback Time**
   - Time from decision to completion
   - Target: < 5 minutes for code rollback

2. **System Recovery**
   - Time to full functionality
   - Target: < 10 minutes

3. **Data Integrity**
   - Records affected
   - Target: 0 records lost

4. **User Impact**
   - Users affected
   - Duration of impact
   - Target: Minimize both

---

## Lessons Learned Template

After any rollback, complete this template:

```markdown
# Rollback Post-Mortem

## Incident Details
- Date: [DATE]
- Time: [TIME]
- Duration: [DURATION]
- Severity: [CRITICAL/HIGH/MEDIUM/LOW]

## What Happened
[Describe the issue that triggered the rollback]

## Root Cause
[Identify the underlying cause]

## Timeline
- [TIME]: Issue detected
- [TIME]: Rollback decision made
- [TIME]: Rollback initiated
- [TIME]: Rollback completed
- [TIME]: System verified

## Impact
- Users affected: [NUMBER]
- Data affected: [DESCRIPTION]
- Revenue impact: [AMOUNT]
- Reputation impact: [DESCRIPTION]

## What Went Well
- [List positive aspects]

## What Could Be Improved
- [List areas for improvement]

## Action Items
- [ ] [Action 1] - Owner: [NAME] - Due: [DATE]
- [ ] [Action 2] - Owner: [NAME] - Due: [DATE]

## Prevention
[How to prevent this in the future]
```

---

## Emergency Contacts

### Rollback Team

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Rollback Lead | [Name] | [Phone] | [Email] |
| DevOps Engineer | [Name] | [Phone] | [Email] |
| Database Admin | [Name] | [Phone] | [Email] |
| Backend Lead | [Name] | [Phone] | [Email] |

### Escalation Path

1. **Level 1:** Rollback Lead (0-5 minutes)
2. **Level 2:** Technical Director (5-15 minutes)
3. **Level 3:** CTO (15+ minutes)

### Emergency Hotline

- **24/7 Support:** [Phone Number]
- **Emergency Email:** emergency@alfi-crm.com
- **Slack Channel:** #emergency-response

---

## Appendix

### A. Common Rollback Scenarios

**Scenario 1: Application Won't Start**
```bash
# Check logs
pm2 logs alfi-crm-production --err

# Common causes:
# - Missing environment variables
# - Database connection issues
# - Port already in use

# Solution: Rollback code
git checkout v0.9.9-stable
npm ci && npm run build
pm2 restart alfi-crm-production
```

**Scenario 2: High Error Rate**
```bash
# Check error patterns
pm2 logs alfi-crm-production --err | grep "Error" | sort | uniq -c

# If errors are widespread: Rollback
# If errors are isolated: Investigate further
```

**Scenario 3: Performance Degradation**
```bash
# Check database performance
psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Check slow queries
psql -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# If caused by new code: Rollback
```

### B. Rollback Commands Reference

```bash
# Quick rollback (most common)
git checkout v0.9.9-stable && npm ci && npm run build && pm2 restart alfi-crm-production

# Database restore
npm run db:restore:production backup-YYYYMMDD-HHMMSS.sql

# View recent deployments
git log --oneline --graph --decorate --all | head -20

# Check current version
git describe --tags

# List available backups
ls -lh backups/ | tail -10

# Test database connection
psql -h <host> -U <user> -d <database> -c "SELECT 1;"

# Monitor application
pm2 monit

# View real-time logs
pm2 logs alfi-crm-production --lines 100 --raw
```

### C. Rollback Decision Tree

```
Issue Detected
    ↓
Is it critical? (See Rollback Triggers)
    ↓ YES                    ↓ NO
ROLLBACK IMMEDIATELY    Monitor for 5 minutes
                            ↓
                        Issue resolved?
                            ↓ NO
                        Is error rate > 5%?
                            ↓ YES
                        ROLLBACK RECOMMENDED
```

---

## Approval

### Rollback Plan Review

- [ ] Reviewed by Technical Lead: _________________ Date: _______
- [ ] Reviewed by DevOps Lead: _________________ Date: _______
- [ ] Reviewed by Database Admin: _________________ Date: _______
- [ ] Approved by CTO: _________________ Date: _______

---

**Document Version:** 1.0  
**Last Updated:** November 17, 2025  
**Next Review:** After any rollback event or quarterly
