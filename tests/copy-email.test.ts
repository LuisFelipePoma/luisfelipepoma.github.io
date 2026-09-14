/// <reference types="node" />
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {copyEmail} from '../src/scripts/copy-email.ts';

test('copies the approved address through the clipboard adapter', async () => {
  let written = '';
  assert.equal(await copyEmail('lfpasep9@gmail.com', {writeText: async value => {written = value;}}), true);
  assert.equal(written, 'lfpasep9@gmail.com');
});
test('reports denied clipboard access without propagating the failure', async () => {
  assert.equal(await copyEmail('lfpasep9@gmail.com', {writeText: async () => {throw new Error('NotAllowedError');}}), false);
});
test('reports a clipboard unavailable in an insecure or unsupported context', async () => {
  assert.equal(await copyEmail('lfpasep9@gmail.com'), false);
});
