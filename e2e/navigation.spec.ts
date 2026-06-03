import { test, expect } from '@playwright/test';

test('E2E Navigation skips Step 2 and completes the journey', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Iniciar DeepDive' }).click();

  await page.getByPlaceholder('Ex: Reinaldo Alves').fill('Pedro');
  await page.getByPlaceholder('Ex: (11) 99999-9999').fill('(11) 99999-9999');
  await page.getByPlaceholder('Ex: pedro@empresa.com').fill('pedro@empresa.com');
  await page.getByPlaceholder('Ex: Tech Co.').fill('Test Empresa');
  await page.getByPlaceholder('Ex: Marketing, Diretoria ou Vendas').fill('Diretor');

  await page.getByRole('button', { name: 'Avançar' }).click();

  await expect(page.locator('text=Desafio 1 de 5')).toBeVisible();

  await page.getByRole('button', { name: 'Inteligência Artificial atende na hora, entende o contexto e auxilia em qualquer horário.' }).click();
  await page.waitForTimeout(800);

  await page.getByRole('button', { name: 'Agente de I.A. conduz a conversa, apresenta produtos e fecha a venda direto no chat.' }).click();
  await page.waitForTimeout(800);

  await page.getByRole('button', { name: 'Agente de I.A. lê os manuais da empresa e responde de forma natural e instantânea.' }).click();
  await page.waitForTimeout(800);

  await page.getByRole('button', { name: 'Agente de I.A. detecta o abandono na hora e entra em contato via WhatsApp para recuperar a venda.' }).click();
  await page.waitForTimeout(800);

  await page.getByRole('button', { name: 'Pesquisas de satisfação automatizadas ao fim de cada conversa e relatórios em tempo real.' }).click();

  await expect(page.locator('text=Processado')).toBeVisible();

  await expect(page.locator('text=DIAGNÓSTICO DE EFICIÊNCIA CONCLUÍDO').or(page.locator('text=PARABÉNS'))).toBeVisible({ timeout: 6000 });
});
