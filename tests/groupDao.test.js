const test = require('node:test');
const assert = require('node:assert/strict');
const groupDao = require('../src/dao/groupDao');

test('group DAO falls back to in-memory storage when MongoDB is unavailable', async () => {
  const group = await groupDao.createGroup({
    name: 'Local Test Group',
    description: 'Fallback test',
    adminEmail: 'admin@example.com',
    membersEmail: ['admin@example.com', 'member@example.com'],
    thumbnail: '',
    paymentStatus: { amount: 0, currency: 'INR', date: Date.now(), isPaid: false }
  });

  assert.ok(group._id);
  assert.equal(group.name, 'Local Test Group');

  const result = await groupDao.getGroupsPaginated('admin@example.com', 10, 0, { createdAt: -1 });
  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0]._id, group._id);
});
