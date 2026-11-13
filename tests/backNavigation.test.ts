import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBackNavigation, subscribeToAndroidBack } from '../services/backNavigation.ts';

test('closes the newest overlay before detail, screen, and exit confirmation', () => {
  const back = createBackNavigation();
  const actions: string[] = [];
  const home = back.register(() => actions.push('confirm exit'), -1000);
  const screen = back.register(() => actions.push('library'), 10);
  const detail = back.register(() => actions.push('list'), 20);
  const modal = back.register(() => actions.push('close modal'), 100);
  const nested = back.register(() => actions.push('close nested modal'), 100);
  back.goBack(); nested();
  back.goBack(); modal();
  back.goBack(); detail();
  back.goBack(); screen();
  back.goBack(); home();
  assert.deepEqual(actions, ['close nested modal', 'close modal', 'list', 'library', 'confirm exit']);
  assert.equal(back.goBack(), false);
});

test('a screen registered after an overlay cannot hide its back handler', () => {
  const back = createBackNavigation();
  let action = '';
  back.register(() => { action = 'modal'; }, 100);
  back.register(() => { action = 'screen'; }, 10);
  back.goBack();
  assert.equal(action, 'modal');
});

test('removed handlers cannot receive back events, including repeated cleanup', () => {
  const back = createBackNavigation();
  let calls = 0;
  const remove = back.register(() => calls++);
  remove(); remove();
  assert.equal(back.goBack(), false);
  assert.equal(calls, 0);
});

test('native listener is removed if registration resolves after unmount', async () => {
  let resolve!: (value: { remove(): Promise<void> }) => void;
  let listener!: () => void;
  let calls = 0;
  let removals = 0;
  const stop = subscribeToAndroidBack({
    addListener(event, callback) {
      assert.equal(event, 'backButton');
      listener = callback;
      return new Promise(done => { resolve = done; });
    },
  }, () => calls++);
  stop();
  listener();
  resolve({ async remove() { removals++; } });
  await new Promise(done => setImmediate(done));
  assert.equal(calls, 0);
  assert.equal(removals, 1);
});
