'use strict'

const test = require('ava')
const sma = require('./sma')
const { signTx, version } = sma

test('version', async t => {
  const result = await version()
  t.truthy(result)
  t.truthy(result.commit_hash)
})

test('signTx', async t => {
  const payload = { foo: 'bar' }
  const signedTx = await signTx(payload)
  t.deepEqual(signedTx.payload, payload)
})
