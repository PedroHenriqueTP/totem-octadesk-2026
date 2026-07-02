import { test, expect } from '@playwright/test';

test('E2E Navigation completes the entire diagnostic journey', async ({ page }) => {
  await page.goto('/');

  // Step 0: Recepção
  await page.getByRole('button', { name: 'Iniciar Diagnóstico' }).click();

  // Step 1: Cadastro
  await page.getByPlaceholder('Nome').fill('Pedro Teste');
  await page.getByPlaceholder('Empresa').fill('Empresa Teste SA');
  await page.getByPlaceholder('Contato').fill('(11) 98888-8888');
  await page.getByPlaceholder('Cargo (ex: CEO, Comprador, Diretor)').fill('CEO');

  await page.getByRole('button', { name: 'Participe e descubra soluções!' }).click();

  // Step 2: Pergunta 1 - Dor Principal
  await expect(page.locator('text=PERGUNTA 1 DE 4')).toBeVisible();
  await page.locator('button:has-text("Quero alcançar mais clientes")').click();

  // Step 3: Pergunta 2 - Colaboradores
  await expect(page.locator('text=PERGUNTA 2 DE 4')).toBeVisible();
  await page.locator('button:has-text("Entre 200 a 500")').click();

  // Step 3: Pergunta 3 - Atendimentos
  await expect(page.locator('text=PERGUNTA 3 DE 4')).toBeVisible();
  await page.locator('button:has-text("Mais de 200")').click();

  // Step 3: Pergunta 4 - Plataforma
  await expect(page.locator('text=PERGUNTA 4 DE 4')).toBeVisible();
  await page.locator('button:has-text("Principalmente marketplaces")').click();

  // Step 4: Processando -> transitions automatically to Step 5
  await expect(page.locator('text=Processando Informações')).toBeVisible();

  // Step 5: Direcionamento
  await expect(page.locator('text=Obrigado pela sua participação!')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Novo Diagnóstico' }).click();

  // Back to Step 0: Recepção
  await expect(page.getByRole('button', { name: 'Iniciar Diagnóstico' })).toBeVisible();
});

