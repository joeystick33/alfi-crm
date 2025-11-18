# Staging Deployment and Testing Guide

**Project:** ALFI CRM Multi-Tenant Refactoring  
**Version:** 1.0.0  
**Date:** November 17, 2025  
**Environment:** Staging

---

## Overview

This guide provides step-by-step instructions for deploying the multi-tenant refactoring to the staging environment and conducting comprehensive testing before production deployment.

**Objectives:**
1. Deploy code to staging environment
2. Verify all refactored functionality
3. Test tenant isolation
4. Validate performance
5. Identify and resolve any issues

---

## Pre-Deployment Checklist

### Environment Verification

- [ ] Staging environment accessible
- [ ] Database connection verified
- [ ] Environment variables configured
- [ ] Backup system operational
- [ ] Monitoring tools active
- [ ] Test data available

### Code Verification

- [ ] Latest code pulled from main branch
- [ ] All tests passing locally
- [ ] Build successful
- [ ] No merge conflicts
- [ ] Dependencies up to date

---

## Deployment Steps

### Step 1: Backup Staging Database

```bash
# Navigate to project directory
cd /path/to/alfi-crm

# Create backup
npm run db:backup:staging

# Or manually
pg_dump -h staging-db-host -U postgres -d alfi_crm_staging \
  > backups/staging-backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup created
ls -lh backups/ | tail -1
```

**Expected Output:**
```
-rw-r--r-- 1 user group 45M Nov 17 10:00 staging-backup-20251117-100000.sql
```

---

### Step 2: Deploy Code

```bash
# Pull latest code
git fetch origin
git checkout main
git pull origin main

# Verify correct branch and commit
git log -1
git status

# Install dependencies
npm ci

# Build application
npm run build

# Verify build successful
ls -la .next/
```

**Expected Output:**
```
Build completed successfully
✓ Compiled successfully
```

---

### Step 3: Run Database Migrations

```bash
# Check migration status
npx prisma migrate status

# Apply migrations (if any)
npx prisma migrate deploy

# Verify schema
npx prisma db pull
```

**Note:** This deployment has no new migrations, but always check.

---

### Step 4: Restart Application

```bash
# Using PM2
pm2 restart alfi-crm-staging --update-env

# Or using systemd
sudo systemctl restart alfi-crm-staging

# Or using Docker
docker-compose -f docker-compose.staging.yml restart

# Verify application started
pm2 status
```

**Expected Output:**
```
┌─────┬────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name               │ status  │ restart │ uptime   │
├─────┼────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ alfi-crm-staging   │ online  │ 0       │ 2s       │
└─────┴────────────────────┴─────────┴─────────┴──────────┘
```

---

### Step 5: Initial Health Checks

```bash
# Health endpoint
curl https://staging.alfi-crm.com/api/health

# Expected: {"status":"ok","timestamp":"..."}

# Check application logs
pm2 logs alfi-crm-staging --lines 50

# Expected: No errors, successful startup messages
```

---

## Testing Phase

### Test 1: Authentication and Authorization

#### 1.1 User Login

```bash
# Test login
curl -X POST https://staging.alfi-crm.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "role": "ADVISOR"
    },
    "token": "..."
  }
}
```

**Checklist:**
- [ ] Login successful
- [ ] Token received
- [ ] User data correct
- [ ] No errors in logs

#### 1.2 Tenant Isolation

```bash
# Login as User A (Cabinet 1)
TOKEN_A=$(curl -X POST https://staging.alfi-crm.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user-a@cabinet1.com","password":"password"}' \
  | jq -r '.data.token')

# Login as User B (Cabinet 2)
TOKEN_B=$(curl -X POST https://staging.alfi-crm.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user-b@cabinet2.com","password":"password"}' \
  | jq -r '.data.token')

# User A gets their documents
curl https://staging.alfi-crm.com/api/documents \
  -H "Authorization: Bearer $TOKEN_A"

# User B gets their documents
curl https://staging.alfi-crm.com/api/documents \
  -H "Authorization: Bearer $TOKEN_B"
```

**Verification:**
- [ ] User A sees only Cabinet 1 documents
- [ ] User B sees only Cabinet 2 documents
- [ ] No cross-cabinet data visible
- [ ] No errors in logs

---

### Test 2: Documents Domain

#### 2.1 List Documents

```bash
# Get authentication token
TOKEN=$(curl -X POST https://staging.alfi-crm.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.data.token')

# List all documents
curl https://staging.alfi-crm.com/api/documents \
  -H "Authorization: Bearer $TOKEN"
```

**Checklist:**
- [ ] Documents returned
- [ ] fileSize is number (not Decimal object)
- [ ] Nested relations formatted correctly
- [ ] Response time < 2 seconds

#### 2.2 Create Document

```bash
# Create document
curl -X POST https://staging.alfi-crm.com/api/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Document",
    "fileUrl": "https://example.com/test.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "type": "CONTRACT",
    "clientId": "client-id-here"
  }'
```

**Checklist:**
- [ ] Document created successfully
- [ ] Returns formatted document
- [ ] Timeline event created
- [ ] Status code 201

#### 2.3 Update Document

```bash
# Update document
curl -X PATCH https://staging.alfi-crm.com/api/documents/[document-id] \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "signatureStatus": "SIGNED"
  }'
```

**Checklist:**
- [ ] Document updated
- [ ] Timeline event created for signature
- [ ] Returns formatted document
- [ ] Status code 200

#### 2.4 Delete Document

```bash
# Delete document
curl -X DELETE https://staging.alfi-crm.com/api/documents/[document-id] \
  -H "Authorization: Bearer $TOKEN"
```

**Checklist:**
- [ ] Document deleted
- [ ] Returns success response
- [ ] Status code 200

---

### Test 3: Projets Domain

#### 3.1 List Projets

```bash
# List projets
curl https://staging.alfi-crm.com/api/projets \
  -H "Authorization: Bearer $TOKEN"
```

**Checklist:**
- [ ] Projets returned
- [ ] estimatedBudget is number
- [ ] actualBudget is number
- [ ] Nested client formatted

#### 3.2 Create Projet

```bash
# Create projet
curl -X POST https://staging.alfi-crm.com/api/projets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client-id-here",
    "type": "INVESTMENT",
    "name": "Test Projet",
    "estimatedBudget": 50000,
    "status": "PLANNED"
  }'
```

**Checklist:**
- [ ] Projet created
- [ ] Timeline event created
- [ ] Patrimoine recalculated (if budget specified)
- [ ] Status code 201

#### 3.3 Update Projet

```bash
# Update projet status
curl -X PATCH https://staging.alfi-crm.com/api/projets/[projet-id] \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED"
  }'
```

**Checklist:**
- [ ] Projet updated
- [ ] Status changed to COMPLETED
- [ ] endDate set automatically
- [ ] progress set to 100
- [ ] Timeline event created

#### 3.4 Delete Projet

```bash
# Delete projet
curl -X DELETE https://staging.alfi-crm.com/api/projets/[projet-id] \
  -H "Authorization: Bearer $TOKEN"
```

**Checklist:**
- [ ] Projet deleted
- [ ] Patrimoine recalculated
- [ ] Returns success response

---

### Test 4: Opportunités Domain

#### 4.1 List Opportunités

```bash
# List opportunités
curl https://staging.alfi-crm.com/api/opportunites \
  -H "Authorization: Bearer $TOKEN"
```

**Checklist:**
- [ ] Opportunités returned
- [ ] estimatedValue is number
- [ ] confidence is number
- [ ] Nested relations formatted

#### 4.2 Create Opportunité

```bash
# Create opportunité
curl -X POST https://staging.alfi-crm.com/api/opportunites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client-id-here",
    "conseillerId": "conseiller-id-here",
    "type": "INVESTMENT",
    "name": "Test Opportunité",
    "estimatedValue": 100000,
    "priority": "HIGH"
  }'
```

**Checklist:**
- [ ] Opportunité created
- [ ] Timeline event created
- [ ] Status code 201

#### 4.3 Convert to Projet

```bash
# First create a projet
PROJET_ID=$(curl -X POST https://staging.alfi-crm.com/api/projets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client-id-here",
    "type": "INVESTMENT",
    "name": "Converted Projet"
  }' | jq -r '.data.id')

# Convert opportunité
curl -X POST https://staging.alfi-crm.com/api/opportunites/[opportunite-id]/convert \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"projetId\": \"$PROJET_ID\"}"
```

**Checklist:**
- [ ] Opportunité converted
- [ ] Status changed to CONVERTED
- [ ] convertedToProjetId set
- [ ] Timeline event created
- [ ] Patrimoine recalculated

---

### Test 5: Other Domains

#### 5.1 Clients

```bash
# List clients
curl https://staging.alfi-crm.com/api/clients \
  -H "Authorization: Bearer $TOKEN"

# Get client by ID
curl https://staging.alfi-crm.com/api/clients/[client-id] \
  -H "Authorization: Bearer $TOKEN"
```

**Checklist:**
- [ ] Clients returned
- [ ] Decimal fields converted to numbers
- [ ] Nested relations formatted

#### 5.2 Objectifs

```bash
# List objectifs
curl https://staging.alfi-crm.com/api/objectifs \
  -H "Authorization: Bearer $TOKEN"
```

**Checklist:**
- [ ] Objectifs returned
- [ ] Proper formatting applied

#### 5.3 Simulations

```bash
# List simulations
curl https://staging.alfi-crm.com/api/simulations \
  -H "Authorization: Bearer $TOKEN"
```

**Checklist:**
- [ ] Simulations returned
- [ ] Proper formatting applied

#### 5.4 Notifications

```bash
# List notifications
curl https://staging.alfi-crm.com/api/notifications \
  -H "Authorization: Bearer $TOKEN"
```

**Checklist:**
- [ ] Notifications returned
- [ ] Read/unread status correct

#### 5.5 Rendez-vous

```bash
# List rendez-vous
curl https://staging.alfi-crm.com/api/rendez-vous \
  -H "Authorization: Bearer $TOKEN"
```

**Checklist:**
- [ ] Rendez-vous returned
- [ ] Nested relations formatted

---

### Test 6: Performance Testing

#### 6.1 Response Time Test

```bash
# Test response times for each endpoint
for endpoint in documents projets opportunites clients objectifs simulations notifications rendez-vous; do
  echo "Testing $endpoint..."
  time curl -s https://staging.alfi-crm.com/api/$endpoint \
    -H "Authorization: Bearer $TOKEN" > /dev/null
done
```

**Acceptance Criteria:**
- [ ] All endpoints respond in < 2 seconds
- [ ] No timeouts
- [ ] Consistent performance

#### 6.2 Load Test (Optional)

```bash
# Install Apache Bench if not available
# sudo apt-get install apache2-utils

# Test with 100 concurrent requests
ab -n 1000 -c 100 -H "Authorization: Bearer $TOKEN" \
  https://staging.alfi-crm.com/api/documents
```

**Acceptance Criteria:**
- [ ] No failed requests
- [ ] Average response time < 2s
- [ ] No memory leaks

---

### Test 7: Error Handling

#### 7.1 Invalid Authentication

```bash
# Test with invalid token
curl https://staging.alfi-crm.com/api/documents \
  -H "Authorization: Bearer invalid-token"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "statusCode": 401
}
```

#### 7.2 Invalid Input

```bash
# Test with invalid data
curl -X POST https://staging.alfi-crm.com/api/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "type": "INVALID_TYPE"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Invalid DocumentType for field: type",
  "statusCode": 400
}
```

**Checklist:**
- [ ] Proper error messages
- [ ] Correct status codes
- [ ] No stack traces exposed

---

### Test 8: Data Integrity

#### 8.1 Patrimoine Recalculation

```bash
# Get client patrimoine before
BEFORE=$(curl https://staging.alfi-crm.com/api/patrimoine/client/[client-id] \
  -H "Authorization: Bearer $TOKEN" | jq '.data.totalActifs')

# Create a projet with budget
curl -X POST https://staging.alfi-crm.com/api/projets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "[client-id]",
    "type": "INVESTMENT",
    "name": "Test Projet",
    "estimatedBudget": 10000
  }'

# Get client patrimoine after
AFTER=$(curl https://staging.alfi-crm.com/api/patrimoine/client/[client-id] \
  -H "Authorization: Bearer $TOKEN" | jq '.data.totalActifs')

# Verify recalculation occurred
echo "Before: $BEFORE, After: $AFTER"
```

**Checklist:**
- [ ] Patrimoine recalculated
- [ ] Values updated correctly
- [ ] No calculation errors

#### 8.2 Timeline Events

```bash
# Create a document
DOC_ID=$(curl -X POST https://staging.alfi-crm.com/api/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "fileUrl": "https://example.com/test.pdf",
    "fileSize": 1024,
    "mimeType": "application/pdf",
    "type": "CONTRACT",
    "clientId": "[client-id]"
  }' | jq -r '.data.id')

# Check timeline events
curl https://staging.alfi-crm.com/api/clients/[client-id]/timeline \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data[] | select(.relatedEntityId == "'$DOC_ID'")'
```

**Checklist:**
- [ ] Timeline event created
- [ ] Event details correct
- [ ] Related entity linked

---

## Monitoring During Testing

### Application Logs

```bash
# Monitor logs in real-time
pm2 logs alfi-crm-staging --lines 100

# Filter for errors
pm2 logs alfi-crm-staging --err

# Search for specific patterns
pm2 logs alfi-crm-staging | grep "Error\|Warning"
```

### Database Monitoring

```bash
# Check active connections
psql -h staging-db-host -U postgres -d alfi_crm_staging \
  -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
psql -h staging-db-host -U postgres -d alfi_crm_staging \
  -c "SELECT query, mean_exec_time FROM pg_stat_statements 
      ORDER BY mean_exec_time DESC LIMIT 10;"
```

### System Resources

```bash
# Check CPU and memory
pm2 monit

# Or using system tools
top -p $(pgrep -f alfi-crm-staging)
```

---

## Issue Tracking

### Issue Log Template

For any issues found during testing:

```markdown
## Issue #[NUMBER]

**Severity:** [CRITICAL/HIGH/MEDIUM/LOW]
**Domain:** [Documents/Projets/Opportunités/etc.]
**Endpoint:** [API endpoint]

**Description:**
[Describe the issue]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Error Messages:**
```
[Error logs]
```

**Impact:**
[How this affects users/system]

**Priority:**
[P0/P1/P2/P3]

**Status:**
[OPEN/IN_PROGRESS/RESOLVED]
```

---

## Test Results Summary

### Overall Results

- **Total Tests:** [NUMBER]
- **Passed:** [NUMBER]
- **Failed:** [NUMBER]
- **Blocked:** [NUMBER]
- **Pass Rate:** [PERCENTAGE]%

### Domain-Specific Results

| Domain | Tests | Passed | Failed | Pass Rate |
|--------|-------|--------|--------|-----------|
| Documents | 10 | - | - | -% |
| Projets | 10 | - | - | -% |
| Opportunités | 10 | - | - | -% |
| Clients | 5 | - | - | -% |
| Objectifs | 5 | - | - | -% |
| Simulations | 5 | - | - | -% |
| Notifications | 5 | - | - | -% |
| Rendez-vous | 5 | - | - | -% |

### Critical Issues

- [ ] No critical issues found
- [ ] Critical issues documented and resolved

### Performance Results

- **Average Response Time:** [TIME]ms
- **P95 Response Time:** [TIME]ms
- **P99 Response Time:** [TIME]ms
- **Error Rate:** [PERCENTAGE]%

---

## Sign-off

### Testing Complete

- [ ] All tests executed
- [ ] Results documented
- [ ] Issues logged
- [ ] Performance acceptable
- [ ] Ready for production

### Approvals

- [ ] QA Lead: _________________ Date: _______
- [ ] Technical Lead: _________________ Date: _______
- [ ] Product Owner: _________________ Date: _______

---

## Next Steps

### If All Tests Pass

1. Document test results
2. Get stakeholder approval
3. Schedule production deployment
4. Notify deployment team
5. Proceed with production deployment

### If Issues Found

1. Document all issues
2. Prioritize issues
3. Fix critical issues
4. Re-test in staging
5. Repeat until all tests pass

---

**Document Version:** 1.0  
**Last Updated:** November 17, 2025  
**Status:** Ready for execution
