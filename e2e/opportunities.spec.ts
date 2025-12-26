/**
 * Tests E2E - Détection Opportunités
 */

import { test, expect } from '@playwright/test'

test.describe('Moteur Opportunités', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@aura.fr')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('Détection opportunités depuis Client360', async ({ page }) => {
    await page.goto('/dashboard/clients/test-client-id')
    await page.click('text=Opportunités')
    
    // Bouton détection
    const detectBtn = page.getByText('Détecter')
    if (await detectBtn.isVisible()) {
      await detectBtn.click()
      await page.waitForTimeout(2000)
    }
    
    // Vérifier affichage opportunités
    await expect(page.locator('[data-testid="opportunity-card"]').or(page.getByText('Aucune opportunité'))).toBeVisible()
  })

  test('Affichage priorités opportunités', async ({ page }) => {
    await page.goto('/dashboard/clients/test-client-id')
    await page.click('text=Opportunités')
    
    const cards = page.locator('[data-testid="opportunity-card"]')
    const count = await cards.count()
    
    if (count > 0) {
      // Vérifier présence badge priorité
      await expect(cards.first().locator('.badge, [data-priority]')).toBeVisible()
    }
  })

  test('Affichage score opportunités', async ({ page }) => {
    await page.goto('/dashboard/clients/test-client-id')
    await page.click('text=Opportunités')
    
    const cards = page.locator('[data-testid="opportunity-card"]')
    const count = await cards.count()
    
    if (count > 0) {
      // Vérifier présence score
      await expect(cards.first()).toContainText(/\d+/)
    }
  })

  test('Types d\'opportunités détectées', async ({ page }) => {
    await page.goto('/dashboard/clients/test-client-id')
    await page.click('text=Opportunités')
    
    // Liste des types attendus
    const expectedTypes = [
      'Diversification',
      'Retraite',
      'Optimisation fiscale',
      'Assurance-vie',
      'Succession',
      'PER',
    ]
    
    const content = await page.content()
    const hasAnyType = expectedTypes.some(type => content.includes(type))
    
    // Soit on a des opportunités avec ces types, soit aucune opportunité
    expect(hasAnyType || content.includes('Aucune opportunité')).toBeTruthy()
  })
})
