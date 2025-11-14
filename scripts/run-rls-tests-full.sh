#!/bin/bash

# Script pour exécuter les tests RLS complets avec les bonnes variables d'environnement

# Charger les variables d'environnement depuis .env
export $(cat alfi-crm/.env | grep -v '^#' | xargs)

# Exécuter les tests complets (créent leurs propres données de test)
npx tsx alfi-crm/scripts/test-rls.ts
