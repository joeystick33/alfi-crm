/**
 * Tests E2E - Client360 Tabs
 */

import { test, expect } from '@playwright/test'

test.describe('Client360 - Navigation Tabs', () => {
  const CLIENT_ID = 'test-client-id' // À remplacer par un ID valide en test
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@aura.fr')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.goto(`/dashboard/clients/${CLIENT_ID}`)
  })

  test('Affichage header client', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByText('Vue d\'ensemble')).toBeVisible()
  })

  test('Navigation entre tous les tabs', async ({ page }) => {
    const tabs = [
      'Vue d\'ensemble',
      'Profil',
      'Famille',
      'Patrimoine',
      'Budget',
      'Fiscalité',
      'Contrats',
      'Documents',
      'KYC & Conformité',
      'Objectifs & Projets',
      'Opportunités',
    ]

    for (const tab of tabs) {
      await page.click(`text=${tab}`)
      await page.waitForTimeout(500)
      // Vérifier que le contenu change
      await expect(page.locator('[role="tabpanel"]')).toBeVisible()
    }
  })
})

test.describe('Client360 - Tab Budget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@aura.fr')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.goto('/dashboard/clients/test-client-id')
    await page.click('text=Budget')
  })

  test('Affichage KPIs budget', async ({ page }) => {
    await expect(page.getByText('Revenus mensuels')).toBeVisible()
    await expect(page.getByText('Charges mensuelles')).toBeVisible()
    await expect(page.getByText('Épargne')).toBeVisible()
  })

  test('Affichage alertes budget si présentes', async ({ page }) => {
    // Si alertes présentes
    const alertes = page.locator('[data-testid="budget-alerts"]')
    if (await alertes.isVisible()) {
      await expect(alertes).toContainText(['Alerte', 'Attention'])
    }
  })
})

test.describe('Client360 - Tab Fiscalité', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@aura.fr')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.goto('/dashboard/clients/test-client-id')
    await page.click('text=Fiscalité')
  })

  test('Affichage estimation IR', async ({ page }) => {
    await expect(page.getByText('Impôt sur le Revenu')).toBeVisible()
    await expect(page.getByText('TMI')).toBeVisible()
  })

  test('Affichage IFI si concerné', async ({ page }) => {
    const ifiSection = page.locator('text=IFI')
    if (await ifiSection.isVisible()) {
      await expect(page.getByText('Patrimoine taxable')).toBeVisible()
    }
  })

  test('Affichage optimisations suggérées', async ({ page }) => {
    await expect(page.getByText('Optimisations')).toBeVisible()
  })
})

test.describe('Client360 - Tab Famille', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@aura.fr')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.goto('/dashboard/clients/test-client-id')
    await page.click('text=Famille')
  })

  test('Affichage KPIs famille', async ({ page }) => {
    await expect(page.getByText('Membres')).toBeVisible()
  })

  test('Bouton ajouter membre', async ({ page }) => {
    await expect(page.getByText('Ajouter')).toBeVisible()
  })
})

test.describe('Client360 - Tab KYC', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@aura.fr')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.goto('/dashboard/clients/test-client-id')
    await page.click('text=KYC')
  })

  test('Affichage progress bar complétion', async ({ page }) => {
    await expect(page.getByText('Complétion')).toBeVisible()
    await expect(page.locator('[role="progressbar"]')).toBeVisible()
  })

  test('Affichage score MIF II', async ({ page }) => {
    await expect(page.getByText('Score MIF II')).toBeVisible()
  })

  test('Affichage section LCB-FT', async ({ page }) => {
    await page.click('text=LCB-FT')
    await expect(page.getByText('Niveau de risque')).toBeVisible()
  })
})

test.describe('Client360 - Tab Objectifs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@aura.fr')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.goto('/dashboard/clients/test-client-id')
    await page.click('text=Objectifs')
  })

  test('Affichage 4 KPIs objectifs', async ({ page }) => {
    await expect(page.getByText('Objectifs actifs')).toBeVisible()
    await expect(page.getByText('Atteints')).toBeVisible()
    await expect(page.getByText('À risque')).toBeVisible()
    await expect(page.getByText('Progression globale')).toBeVisible()
  })

  test('Boutons création objectif/projet', async ({ page }) => {
    await expect(page.getByText('Objectif')).toBeVisible()
    await expect(page.getByText('Projet')).toBeVisible()
  })

  test('Affichage temps restant objectif', async ({ page }) => {
    const objectif = page.locator('[data-testid="objectif-card"]').first()
    if (await objectif.isVisible()) {
      await expect(objectif.getByText(/jours|mois|ans/)).toBeVisible()
    }
  })
})

test.describe('Client360 - Tab Contrats', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@aura.fr')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.goto('/dashboard/clients/test-client-id')
    await page.click('text=Contrats')
  })

  test('Affichage onglets catégories', async ({ page }) => {
    await expect(page.getByText('Épargne')).toBeVisible()
    await expect(page.getByText('Crédits')).toBeVisible()
    await expect(page.getByText('Prévoyance')).toBeVisible()
  })

  test('Navigation entre catégories', async ({ page }) => {
    await page.click('text=Crédits')
    await page.waitForTimeout(300)
    await page.click('text=Prévoyance')
    await page.waitForTimeout(300)
    await page.click('text=Épargne')
  })
})
