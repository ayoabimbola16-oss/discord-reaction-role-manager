import test from 'node:test';
import assert from 'node:assert/strict';
import { processUsers } from '../src/roles.js';

function logger() { return { result() {} }; }
function member(id, hasRole, operations) { return { user: { tag: `user${id}` }, roles: { cache: new Map(hasRole ? [['role', {}]] : []), add: async () => operations.push(`add:${id}`), remove: async () => operations.push(`remove:${id}`) } }; }
test('ADD changes missing roles and skips existing and departed users', async () => {
  const operations = []; const members = new Map([['1', member('1', false, operations)], ['2', member('2', true, operations)]]);
  const guild = { members: { fetch: async ({ user }) => { if (!members.has(user)) { const error = new Error('unknown'); error.code = 10007; throw error; } return members.get(user); } } };
  const result = await processUsers({ guild, role: { id: 'role' }, userIds: new Set(['1', '2', '3']), action: 'ADD', logger: logger() });
  assert.deepEqual(operations, ['add:1']); assert.deepEqual(result, { reactors: 3, changed: 1, alreadySatisfied: 1, notMember: 1, failed: 0, wouldChange: 0 });
});
test('REMOVE changes present roles, skips missing role, and continues after a failure', async () => {
  const operations = []; const ok = member('1', true, operations); const absent = member('2', false, operations);
  const guild = { members: { fetch: async ({ user }) => { if (user === '3') return { user: { tag: 'bad' }, roles: { cache: new Map([['role', {}]]), remove: async () => { throw new Error('permission denied'); } } }; return user === '1' ? ok : absent; } } };
  const result = await processUsers({ guild, role: { id: 'role' }, userIds: new Set(['1', '2', '3']), action: 'REMOVE', logger: logger() });
  assert.deepEqual(operations, ['remove:1']); assert.equal(result.changed, 1); assert.equal(result.alreadySatisfied, 1); assert.equal(result.failed, 1);
});
