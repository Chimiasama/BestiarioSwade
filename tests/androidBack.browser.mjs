// Run against Vite with Playwright installed (see docs/ANDROID_VOLTAR.md).
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.androidBridge = {};
    window.testBackListeners = new Map();
    window.testExitCount = 0;
    let nextId = 0;
    window.Capacitor = {
      PluginHeaders: [{ name: 'App', methods: [
        { name: 'addListener', rtype: 'callback' },
        { name: 'removeListener', rtype: 'promise' },
        { name: 'exitApp', rtype: 'promise' },
      ] }],
      nativeCallback(_plugin, method, _options, callback) {
        if (method === 'addListener') {
          const id = String(++nextId);
          window.testBackListeners.set(id, callback);
          return Promise.resolve(id);
        }
      },
      nativePromise(_plugin, method, options) {
        if (method === 'removeListener') window.testBackListeners.delete(options.callbackId);
        if (method === 'exitApp') window.testExitCount++;
        return Promise.resolve();
      },
    };
  });
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:3000');
  await page.waitForFunction(() => window.testBackListeners.size === 1);
  const back = async () => {
    await page.evaluate(() => [...window.testBackListeners.values()].forEach(callback => callback({ canGoBack: false })));
  };
  const exitDialog = page.getByRole('alertdialog', { name: 'Fechar o aplicativo?' });
  await back();
  await exitDialog.waitFor();
  await back(); // Back cancels exit; it must never confirm it.
  await exitDialog.waitFor({ state: 'hidden' });
  await back();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await exitDialog.waitFor({ state: 'hidden' });

  await page.getByRole('button', { name: 'Guia Rápido de Regras SWADE' }).click();
  await back();
  assert.equal(await exitDialog.count(), 0);
  await page.getByRole('heading', { name: 'Havenwood', exact: true }).click();
  await page.getByRole('heading', { name: 'Árvore Animada', exact: true }).last().click();
  await page.getByRole('button', { name: 'Consultar atributo Astúcia', exact: true }).click();
  await page.getByRole('dialog', { name: 'Consulta de regras' }).waitFor();
  await back();
  await page.getByRole('dialog', { name: 'Consulta de regras' }).waitFor({ state: 'hidden' });
  await page.getByRole('heading', { name: 'Árvore Animada', exact: true }).waitFor();
  await page.getByTitle('Editar ficha deste monstro no armazenamento local').click();
  await back(); // Editor returns to the same detail, not a remounted library.
  await page.getByRole('button', { name: 'Voltar ao Compêndio' }).waitFor();
  await page.getByRole('heading', { name: 'Árvore Animada', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Mudar Tema, Cores e Fontes do Grimório' }).click();
  await back(); // Theme closes before the creature detail.
  await page.getByRole('button', { name: 'Voltar ao Compêndio' }).waitFor();
  await back(); // Detail -> the book's list.
  await page.getByRole('button', { name: 'Voltar ao Compêndio' }).waitFor({ state: 'hidden' });
  assert.equal(await exitDialog.count(), 0);
  await back(); // Book -> library.
  await page.getByRole('heading', { name: 'Biblioteca de Cenários' }).waitFor();
  assert.equal(await exitDialog.count(), 0);
  await page.getByRole('button', { name: /Compêndio Geral/ }).click();
  await back();
  await page.getByRole('heading', { name: 'Biblioteca de Cenários' }).waitFor();
  assert.equal(await page.evaluate(() => window.testExitCount), 0);
  await back();
  await exitDialog.waitFor();
  await page.getByRole('button', { name: 'Fechar app', exact: true }).click();
  assert.equal(await page.evaluate(() => window.testExitCount), 1);
  assert.equal(await page.evaluate(() => window.testBackListeners.size), 1);
  assert.deepEqual(errors, []);
  console.log('PASS: Android back closes overlays, restores editor origin, navigates detail/list/library, and exits only after confirmation.');
} finally {
  await browser.close();
}
