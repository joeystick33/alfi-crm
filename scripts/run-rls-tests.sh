#!/bin/bash

# Script pour exécuter les tests RLS avec les bonnes variables d'environnement

# Charger les variables d'environnement depuis .env
export $(cat alfi-crm/.env | grep -v '^#' | xargs)

# Exécuter les tests simplifiés (qui fonctionnent avec la base actuelle)
npx tsx alfi-crm/scripts/test-rls-simple.ts
