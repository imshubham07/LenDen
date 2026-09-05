const assert = require('node:assert/strict');
const { Prisma } = require('@prisma/client');
const users = new Map();
const sessions = new Map();
const prisma = { user: {
  async create({ data }) {
    if (users.has(data.mobile)) throw new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '6' });
    const user = { id: String(users.size + 1), ...data };
    users.set(data.mobile, user);
    return { id: user.id, name: user.name, mobile: user.mobile };
  },
  async update({ where, data }) { const user = [...users.values()].find(u => u.id === where.id); Object.assign(user, data); return user; },
  async updateMany({ where, data }) { const user = [...users.values()].find(u => u.id === where.id && (where.recoveryCodeHash === undefined || u.recoveryCodeHash === where.recoveryCodeHash) && u.passwordHash === where.passwordHash); if (!user) return { count: 0 }; Object.assign(user, data); return { count: 1 }; },
  async findUnique({ where }) { return where.mobile ? users.get(where.mobile) : [...users.values()].find(u => u.id === where.id); }
}, borrower: { async findFirst({ where }) { assert.equal(where.userId, '2'); return null; }, async findMany({ where }) { assert.equal(typeof where.userId, 'string'); return []; } } };
for (const [path, exports] of [
  ['../dist/src/lib/prisma', { prisma }],
  ['../dist/src/lib/redis', { redis: { set: async (k,v) => sessions.set(k,v), get: async k => sessions.get(k) ?? null, del: async k => sessions.delete(k), incr: async k => { const n = (sessions.get(k) || 0) + 1; sessions.set(k,n); return n; }, expire: async () => 1 } }],
]) require.cache[require.resolve(path)] = { exports };
const { authRouter } = require('../dist/src/modules/auth/auth.routes');
const { loanRouter } = require('../dist/src/modules/loans/loan.routes');
const { paymentRouter } = require('../dist/src/modules/payments/payment.routes');
const { borrowerRouter } = require('../dist/src/modules/borrowers/borrower.routes');
function request(router, method, url, body = {}, token) {
  return new Promise((resolve, reject) => {
    const req = { method, url, body, headers: token ? { authorization: `Bearer ${token}` } : {}, cookies: {} };
    const res = { statusCode: 200, status(n) { this.statusCode=n; return this; }, setHeader() {}, cookie() {}, clearCookie() {}, json(body) { resolve({ status: this.statusCode, body, req }); } };
    router.handle(req, res, err => err ? reject(err) : resolve({ status: 404 }));
  });
}
(async () => {
  const a = await request(authRouter, 'POST', '/signup', { name: 'First User', mobile: '9999999991', password: 'secret123' });
  assert.equal(a.status, 201); assert.ok(a.body.token); assert.equal(a.body.user.passwordHash, undefined);
  assert.notEqual(users.get('9999999991').passwordHash, 'secret123');
  const b = await request(authRouter, 'POST', '/signup', { name: 'Second User', mobile: '9999999992', password: 'secret123' });
  assert.equal(b.status, 201); assert.notEqual(a.body.user.id, b.body.user.id);
  assert.equal((await request(authRouter, 'POST', '/signup', { name: 'Duplicate', mobile: '9999999991', password: 'secret123' })).status, 409);
  assert.equal((await request(authRouter, 'POST', '/login', { mobile: '9999999991', password: 'wrong123' })).status, 401);
  const login = await request(authRouter, 'POST', '/login', { mobile: '9999999991', password: 'secret123' });
  assert.equal(login.status, 200);
  assert.equal((await request(authRouter, 'GET', '/me', {}, login.body.token)).body.user.id, a.body.user.id);
  for (const account of [a,b]) {
    const ledger = await request(borrowerRouter, 'GET', '/', {}, account.body.token);
    assert.equal(ledger.status, 200); assert.equal(ledger.req.user.id, account.body.user.id);
  }
  assert.equal((await request(borrowerRouter, 'GET', '/')).status, 401);
  assert.equal((await request(borrowerRouter, 'GET', '/other-user-borrower', {}, b.body.token)).status, 404);
  assert.equal((await request(loanRouter, 'POST', '/', { borrowerId: 'other-user-borrower', amount: 100, purpose: 'Test loan', givenDate: '2026-09-05' }, b.body.token)).status, 404);
  assert.equal((await request(paymentRouter, 'POST', '/', { borrowerId: 'other-user-borrower', amount: 100, paymentDate: '2026-09-05' }, b.body.token)).status, 404);
  assert.equal((await request(authRouter, 'POST', '/logout', {}, login.body.token)).status, 200);
  assert.equal((await request(authRouter, 'GET', '/me', {}, login.body.token)).status, 401);
  assert.equal((await request(authRouter, 'POST', '/admin/login')).status, 404);
  await assert.rejects(request(authRouter, 'POST', '/signup', { name: ' ', mobile: 'invalid', password: '123' }));
  assert.equal((await request(authRouter, 'POST', '/recovery-code', { password: 'secret123' })).status, 401);
  assert.equal((await request(authRouter, 'POST', '/recovery-code', { password: 'wrong123' }, b.body.token)).status, 401);
  const recovery = await request(authRouter, 'POST', '/recovery-code', { password: 'secret123' }, b.body.token);
  assert.equal(recovery.status, 200);
  assert.match(recovery.body.recoveryCode, /^[A-F0-9]{4}(-[A-F0-9]{4}){7}$/);
  assert.notEqual(users.get('9999999992').recoveryCodeHash, recovery.body.recoveryCode);
  const resetBody = { mobile: '9999999992', recoveryCode: recovery.body.recoveryCode, newPassword: 'changed123' };
  assert.equal((await request(authRouter, 'POST', '/reset-password', { ...resetBody, recoveryCode: '0'.repeat(32) })).status, 400);
  assert.equal((await request(authRouter, 'POST', '/reset-password', resetBody)).status, 200);
  assert.equal((await request(authRouter, 'POST', '/reset-password', resetBody)).status, 400);
  assert.equal((await request(authRouter, 'GET', '/me', {}, b.body.token)).status, 401);
  assert.equal((await request(authRouter, 'POST', '/login', { mobile: '9999999992', password: 'secret123' })).status, 401);
  const changed = await request(authRouter, 'POST', '/login', { mobile: '9999999992', password: 'changed123' });
  assert.equal(changed.status, 200);
  assert.equal((await request(authRouter, 'GET', '/me', {}, changed.body.token)).status, 200);
  for (let attempt = 0; attempt < 3; attempt++) await request(authRouter, 'POST', '/reset-password', resetBody);
  assert.equal((await request(authRouter, 'POST', '/reset-password', resetBody)).status, 429);
  console.log('PASS: recovery-code authentication, hashing, invalid code, single use, session invalidation, new login, rate limit');
  console.log('PASS: signup, duplicate, validation, password hashing, login, account-scoped ledger, unauthorized access, logout, removed admin endpoint');
})().catch(err => { console.error(err); process.exitCode = 1; });
