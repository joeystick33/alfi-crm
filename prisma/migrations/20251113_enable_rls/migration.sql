-- Enable Row Level Security on all tables with cabinetId
-- This ensures complete data isolation between cabinets

-- Module 1: Multi-tenant et Utilisateurs
ALTER TABLE cabinets ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE apporteurs_affaires ENABLE ROW LEVEL SECURITY;

-- Module 2: Clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Module 3: Patrimoine
ALTER TABLE actifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_actifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE passifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;

-- Module 4: Documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE actif_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE passif_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrat_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

-- Module 5: Objectifs et Projets
ALTER TABLE objectifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE projet_documents ENABLE ROW LEVEL SECURITY;

-- Module 6: Opportunités
ALTER TABLE opportunites ENABLE ROW LEVEL SECURITY;

-- Module 7: Tâches et Agenda
ALTER TABLE taches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tache_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_syncs ENABLE ROW LEVEL SECURITY;

-- Module 8: Communications
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE campagnes ENABLE ROW LEVEL SECURITY;

-- Module 9: Templates
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Module 10: Simulations
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

-- Module 11: Conformité
ALTER TABLE consentements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reclamations ENABLE ROW LEVEL SECURITY;

-- Module 12: Historisation
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Module 13: Export
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: Cabinet Isolation
-- ============================================

-- Policy for normal users (non-SuperAdmin)
-- Users can only access data from their own cabinet
CREATE POLICY cabinet_isolation_policy ON cabinets
  FOR ALL
  USING (id = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON users
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON clients
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON actifs
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON passifs
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON contrats
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON documents
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON objectifs
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON projets
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON opportunites
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON taches
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON rendez_vous
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON emails
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON notifications
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON campagnes
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON templates
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON simulations
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON reclamations
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON audit_logs
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON export_jobs
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON assistant_assignments
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

CREATE POLICY cabinet_isolation_policy ON apporteurs_affaires
  FOR ALL
  USING (cabinetId = current_setting('app.current_cabinet_id', true)::text);

-- ============================================
-- RLS POLICIES: SuperAdmin Access
-- ============================================

-- SuperAdmin can access all data across all cabinets
CREATE POLICY superadmin_access_policy ON cabinets
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON users
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON clients
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON actifs
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON passifs
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON contrats
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON documents
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON objectifs
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON projets
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON opportunites
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON taches
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON rendez_vous
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON emails
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON notifications
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON campagnes
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON templates
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON simulations
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON reclamations
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON audit_logs
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON export_jobs
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON assistant_assignments
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

CREATE POLICY superadmin_access_policy ON apporteurs_affaires
  FOR ALL
  USING (current_setting('app.is_superadmin', true)::boolean = true);

-- ============================================
-- RLS POLICIES: Related Tables (via foreign keys)
-- ============================================

-- Family members: accessible via client's cabinet
CREATE POLICY family_member_access_policy ON family_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = family_members.clientId 
      AND clients.cabinetId = current_setting('app.current_cabinet_id', true)::text
    )
    OR current_setting('app.is_superadmin', true)::boolean = true
  );

-- Client actifs: accessible via client's cabinet
CREATE POLICY client_actif_access_policy ON client_actifs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_actifs.clientId 
      AND clients.cabinetId = current_setting('app.current_cabinet_id', true)::text
    )
    OR current_setting('app.is_superadmin', true)::boolean = true
  );

-- Document relations: accessible via cabinet
CREATE POLICY client_document_access_policy ON client_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_documents.clientId 
      AND clients.cabinetId = current_setting('app.current_cabinet_id', true)::text
    )
    OR current_setting('app.is_superadmin', true)::boolean = true
  );

CREATE POLICY actif_document_access_policy ON actif_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM actifs 
      WHERE actifs.id = actif_documents.actifId 
      AND actifs.cabinetId = current_setting('app.current_cabinet_id', true)::text
    )
    OR current_setting('app.is_superadmin', true)::boolean = true
  );

CREATE POLICY passif_document_access_policy ON passif_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM passifs 
      WHERE passifs.id = passif_documents.passifId 
      AND passifs.cabinetId = current_setting('app.current_cabinet_id', true)::text
    )
    OR current_setting('app.is_superadmin', true)::boolean = true
  );

CREATE POLICY contrat_document_access_policy ON contrat_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM contrats 
      WHERE contrats.id = contrat_documents.contratId 
      AND contrats.cabinetId = current_setting('app.current_cabinet_id', true)::text
    )
    OR current_setting('app.is_superadmin', true)::boolean = true
  );

CREATE POLICY projet_document_access_policy ON projet_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projets 
      WHERE projets.id = projet_documents.projetId 
      AND projets.cabinetId = current_setting('app.current_cabinet_id', true)::text
    )
    OR current_setting('app.is_superadmin', true)::boolean = true
  );

CREATE POLICY tache_document_access_policy ON tache_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM taches 
      WHERE taches.id = tache_documents.tacheId 
      AND taches.cabinetId = current_setting('app.current_cabinet_id', true)::text
    )
    OR current_setting('app.is_superadmin', true)::boolean = true
  );

-- KYC documents: accessible via client's cabinet
CREATE POLICY kyc_document_access_policy ON kyc_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = kyc_documents.clientId 
      AND clients.cabinetId = current_setting('app.current_cabinet_id', true)::text
    )
    OR current_setting('app.is_superadmin', true)::boolean = true
  );

-- Consentements: accessible via client's cabinet
CREATE POLICY consentement_access_policy ON consentements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = consentements.clientId 
      AND clients.cabinetId = current_setting('app.current_cabinet_id', true)::text
    )
    OR current_setting('app.is_superadmin', true)::boolean = true
  );

-- Timeline events: accessible via client's cabinet
CREATE POLICY timeline_event_access_policy ON timeline_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = timeline_events.clientId 
      AND clients.cabinetId = current_setting('app.current_cabinet_id', true)::text
    )
    OR current_setting('app.is_superadmin', true)::boolean = true
  );

-- Calendar syncs: accessible by user's cabinet
CREATE POLICY calendar_sync_access_policy ON calendar_syncs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = calendar_syncs.userId 
      AND users.cabinetId = current_setting('app.current_cabinet_id', true)::text
    )
    OR current_setting('app.is_superadmin', true)::boolean = true
  );
