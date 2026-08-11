import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchAllReactionUsers } from '../src/reactions.js';

function collection(ids) { const map = new Map(ids.map((id) => [id, { id }])); map.lastKey = () => [...map.keys()].at(-1); return map; }
test('deduplicates users across reactions and paginates', async () => {
  const calls = [];
  const paged = { emoji: { identifier: '👍', name: '👍', toString: () => '👍' }, users: { fetch: async ({ after }) => { calls.push(after); return after ? collection(['u101']) : collection(Array.from({ length: 100 }, (_, i) => `u${i + 1}`)); } } };
  const heart = { emoji: { identifier: '❤️', name: '❤️', toString: () => '❤️' }, users: { fetch: async () => collection(['u1', 'u102']) } };
  const users = await fetchAllReactionUsers({ reactions: { cache: new Map([['a', paged], ['b', heart]]) } });
  assert.equal(users.size, 102); assert.deepEqual(calls, [undefined, 'u100']);
});
test('emoji filter and empty reactions return expected users', async () => {
  const reaction = { emoji: { identifier: 'x:1', name: 'x', toString: () => '<:x:1>' }, users: { fetch: async () => collection(['u1']) } };
  assert.deepEqual([...await fetchAllReactionUsers({ reactions: { cache: new Map([['x', reaction]]) } }, 'x:1')], ['u1']);
  assert.equal((await fetchAllReactionUsers({ reactions: { cache: new Map() } })).size, 0);
});
