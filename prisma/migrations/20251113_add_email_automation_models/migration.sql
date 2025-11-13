-- Migration: Ajout des modèles Email, Automation, Alerts, Calendar Sync
-- Date: 2024-11-13

-- Table emails
CREATE TABLE IF NOT EXISTS "emails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "threadId" TEXT,
    "provider" TEXT NOT NULL CHECK ("provider" IN ('GMAIL', 'OUTLOOK')),
    "from" TEXT NOT NULL,
    "to" TEXT[] NOT NULL DEFAULT '{}',
    "cc" TEXT[] NOT NULL DEFAULT '{}',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "snippet" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "labels" TEXT[] NOT NULL DEFAULT '{}',
    "direction" TEXT NOT NULL CHECK ("direction" IN ('INBOUND', 'OUTBOUND')),
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "cabinetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "emails_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "emails_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "emails_externalId_provider_key" ON "emails"("externalId", "provider");
CREATE INDEX "emails_userId_idx" ON "emails"("userId");
CREATE INDEX "emails_clientId_idx" ON "emails"("clientId");
CREATE INDEX "emails_cabinetId_idx" ON "emails"("cabinetId");
CREATE INDEX "emails_receivedAt_idx" ON "emails"("receivedAt");
CREATE INDEX "emails_isRead_idx" ON "emails"("isRead");

-- Table scheduled_actions
CREATE TABLE IF NOT EXISTS "scheduled_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cabinetId" TEXT NOT NULL,
    "action" TEXT NOT NULL CHECK ("action" IN ('SUSPEND', 'TERMINATE', 'RESTORE', 'DOWNGRADE_PLAN')),
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'EXECUTED', 'FAILED', 'CANCELLED')),
    "executedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "error" TEXT,
    "lastWarningAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "scheduled_actions_cabinetId_idx" ON "scheduled_actions"("cabinetId");
CREATE INDEX "scheduled_actions_status_idx" ON "scheduled_actions"("status");
CREATE INDEX "scheduled_actions_scheduledFor_idx" ON "scheduled_actions"("scheduledFor");

-- Table quota_alerts
CREATE TABLE IF NOT EXISTS "quota_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cabinetId" TEXT NOT NULL,
    "quotaName" TEXT NOT NULL,
    "level" TEXT NOT NULL CHECK ("level" IN ('WARNING', 'CRITICAL')),
    "percentage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "quota_alerts_cabinetId_idx" ON "quota_alerts"("cabinetId");
CREATE INDEX "quota_alerts_quotaName_idx" ON "quota_alerts"("quotaName");
CREATE INDEX "quota_alerts_createdAt_idx" ON "quota_alerts"("createdAt");

-- Table calendar_syncs
CREATE TABLE IF NOT EXISTS "calendar_syncs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL CHECK ("provider" IN ('GOOGLE', 'OUTLOOK')),
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "calendarId" TEXT NOT NULL DEFAULT 'primary',
    "syncToken" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "calendar_syncs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "calendar_syncs_userId_provider_key" ON "calendar_syncs"("userId", "provider");
CREATE INDEX "calendar_syncs_userId_idx" ON "calendar_syncs"("userId");
CREATE INDEX "calendar_syncs_enabled_idx" ON "calendar_syncs"("enabled");

-- Ajout des champs manquants dans la table cabinets si nécessaire
ALTER TABLE "cabinets" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "cabinets" ADD COLUMN IF NOT EXISTS "suspensionReason" TEXT;
ALTER TABLE "cabinets" ADD COLUMN IF NOT EXISTS "terminatedAt" TIMESTAMP(3);
ALTER TABLE "cabinets" ADD COLUMN IF NOT EXISTS "terminationReason" TEXT;

-- Ajout du champ reminderSent dans rendez_vous
ALTER TABLE "rendez_vous" ADD COLUMN IF NOT EXISTS "reminderSent" BOOLEAN NOT NULL DEFAULT false;

-- Ajout du champ renewalReminderSent dans contrats
ALTER TABLE "contrats" ADD COLUMN IF NOT EXISTS "renewalReminderSent" BOOLEAN NOT NULL DEFAULT false;
