/**
 * Tests E2E - Wizard Création Client 7 Étapes
 */

import { test, expect } from '@playwright/test'

test.describe('Wizard Création Client', () => {
  test.beforeEach(async ({ page }) => {
    // Login (à adapter selon votre auth)
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@aura.fr')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('Étape 1 - Type de relation', async ({ page }) => {
    await page.goto('/dashboard/clients/nouveau')
    
    // Vérifier présence des options
    await expect(page.getByText('Type de relation')).toBeVisible()
    await expect(page.getByText('Prospect')).toBeVisible()
    await expect(page.getByText('Client')).toBeVisible()
    
    // Sélectionner Prospect
    await page.click('text=Prospect')
    await expect(page.locator('[data-selected="PROSPECT"]')).toBeVisible()
    
    // Sélectionner Particulier
    await page.click('text=Particulier')
    
    // Suivant
    await page.click('text=Suivant')
    await expect(page.getByText('Étape 2')).toBeVisible()
  })

  test('Étape 2 - Identification avec validation', async ({ page }) => {
    await page.goto('/dashboard/clients/nouveau')
    
    // Passer étape 1
    await page.click('text=Prospect')
    await page.click('text=Particulier')
    await page.click('text=Suivant')
    
    // Tester validation - clic suivant sans remplir
    await page.click('text=Suivant')
    await expect(page.getByText('Prénom requis')).toBeVisible()
    await expect(page.getByText('Nom requis')).toBeVisible()
    
    // Remplir les champs
    await page.selectOption('select[name="civility"]', 'M')
    await page.fill('[name="firstName"]', 'Jean')
    await page.fill('[name="lastName"]', 'Dupont')
    await page.fill('[name="birthDate"]', '1980-05-15')
    
    // Suivant
    await page.click('text=Suivant')
    await expect(page.getByText('Étape 3')).toBeVisible()
  })

  test('Étape 3 - Coordonnées avec validation email', async ({ page }) => {
    await page.goto('/dashboard/clients/nouveau')
    
    // Passer étapes 1-2
    await page.click('text=Prospect')
    await page.click('text=Particulier')
    await page.click('text=Suivant')
    await page.selectOption('select[name="civility"]', 'M')
    await page.fill('[name="firstName"]', 'Jean')
    await page.fill('[name="lastName"]', 'Dupont')
    await page.fill('[name="birthDate"]', '1980-05-15')
    await page.click('text=Suivant')
    
    // Tester validation email
    await page.fill('[name="email"]', 'invalid-email')
    await page.click('text=Suivant')
    await expect(page.getByText('Email invalide')).toBeVisible()
    
    // Corriger email
    await page.fill('[name="email"]', 'jean.dupont@email.com')
    await page.click('text=Suivant')
    await expect(page.getByText('Étape 4')).toBeVisible()
  })

  test('Parcours complet création client', async ({ page }) => {
    await page.goto('/dashboard/clients/nouveau')
    
    // Étape 1
    await page.click('text=Client')
    await page.click('text=Particulier')
    await page.click('text=Suivant')
    
    // Étape 2
    await page.selectOption('select[name="civility"]', 'MME')
    await page.fill('[name="firstName"]', 'Marie')
    await page.fill('[name="lastName"]', 'Martin')
    await page.fill('[name="birthDate"]', '1975-03-20')
    await page.click('text=Suivant')
    
    // Étape 3
    await page.fill('[name="email"]', 'marie.martin@email.com')
    await page.fill('[name="mobile"]', '0612345678')
    await page.click('text=Suivant')
    
    // Étape 4
    await page.selectOption('select[name="maritalStatus"]', 'MARRIED')
    await page.selectOption('select[name="matrimonialRegime"]', 'COMMUNAUTE_LEGALE')
    await page.fill('[name="numberOfChildren"]', '2')
    await page.click('text=Suivant')
    
    // Étape 5
    await page.selectOption('select[name="professionCategory"]', 'SALARIE')
    await page.fill('[name="profession"]', 'Directrice Marketing')
    await page.fill('[name="annualIncome"]', '75000')
    await page.click('text=Suivant')
    
    // Étape 6
    await page.fill('[name="financialAssets"]', '150000')
    await page.fill('[name="realEstateAssets"]', '350000')
    await page.fill('[name="totalLiabilities"]', '200000')
    await page.click('text=Suivant')
    
    // Étape 7
    await page.click('text=Équilibré')
    await page.selectOption('select[name="investmentHorizon"]', 'MOYEN_TERME')
    await page.fill('[name="investmentKnowledge"]', '60')
    
    // Créer le client
    await page.click('text=Créer le client')
    
    // Vérifier redirection vers Client360
    await page.waitForURL(/\/dashboard\/clients\/[a-z0-9]+/)
    await expect(page.getByText('Marie Martin')).toBeVisible()
  })

  test('Sauvegarde brouillon', async ({ page }) => {
    await page.goto('/dashboard/clients/nouveau')
    
    // Remplir partiellement
    await page.click('text=Prospect')
    await page.click('text=Particulier')
    await page.click('text=Suivant')
    await page.fill('[name="firstName"]', 'Test')
    await page.fill('[name="lastName"]', 'Brouillon')
    
    // Sauvegarder brouillon
    await page.click('text=Sauvegarder brouillon')
    await expect(page.getByText('Sauvegarde...')).toBeVisible()
    await expect(page.getByText('Sauvegarder brouillon')).toBeVisible()
  })
})
