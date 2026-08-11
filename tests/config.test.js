import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCli } from '../src/cli.js';
import { createConfig } from '../src/config.js';

const tokenEnv = { DISCORD_BOT_TOKEN: 'test-token', DISCORD_SERVER_ID: '12345678901234567', DISCORD_MESSAGE_ID: '12345678901234568', DISCORD_ROLE_ID: '12345678901234569' };
test('CLI values override environment values', () => {
  const config = createConfig(parseCli(['add', '--server', '22345678901234567', '--message', '22345678901234568', '--role', '22345678901234569']), tokenEnv);
  assert.equal(config.action, 'ADD'); assert.equal(config.serverId, '22345678901234567');
});
test('invalid action, IDs, and token are rejected', () => {
  assert.throws(() => createConfig({ action: 'DELETE' }, tokenEnv), /Action/);
  assert.throws(() => createConfig({ action: 'ADD', server: 'bad', message: tokenEnv.DISCORD_MESSAGE_ID, role: tokenEnv.DISCORD_ROLE_ID }, tokenEnv), /snowflake/);
  assert.throws(() => createConfig({ action: 'ADD' }, { ...tokenEnv, DISCORD_BOT_TOKEN: '' }), /BOT_TOKEN/);
});
test('parser handles options and help', () => {
  assert.deepEqual(parseCli(['remove', '--dry-run', '--emoji', '👍']), { action: 'REMOVE', dryRun: true, emoji: '👍' });
  assert.deepEqual(parseCli(['--help']), { help: true });
});
