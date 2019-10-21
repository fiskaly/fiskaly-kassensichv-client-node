'use strict'

const dotenv = require('dotenv')
const test = require('ava')
const uuid = require('@pgaubatz/uuid').v4
const createSdkClient = require('./client')
const pkg = require('../package.json')

dotenv.config()

const sdkOpts = {}
const {
  API_KEY,
  API_SECRET,
  BASE_URL
} = process.env
if (BASE_URL != null) {
  sdkOpts.baseUrl = BASE_URL
}
if (API_KEY == null) {
  throw new Error('API_KEY environment variable is missing')
}
if (API_SECRET == null) {
  throw new Error('API_SECRET environment variable is missing')
}

const smaMock = {
  signTx: payload => ({
    payload,
    log: Buffer.from(JSON.stringify(payload)).toString('base64')
  })
}
const createConfiguredSdkClient = () => createSdkClient(smaMock, API_KEY, API_SECRET, sdkOpts)
const client = createConfiguredSdkClient()

const tssId = uuid()
const clientId = uuid()
const exportId = uuid()
const txId = uuid()
// eslint-disable-next-line
const serial_number = clientId
// eslint-disable-next-line
const last_revision = 1

test.before(async t => {
  await client({
    url: `/tss/${tssId}`,
    method: 'PUT',
    body: {
      state: 'INITIALIZED',
      description: `Test TSS created by ${pkg.name}/${pkg.version}`
    }
  })
  await client({
    url: `/tss/${tssId}/client/${clientId}`,
    method: 'PUT',
    body: {
      serial_number: clientId
    }
  })
  await client({
    url: `/tss/${tssId}/export/${exportId}`,
    method: 'PUT',
    body: {}
  })
  await client({
    url: `/tss/${tssId}/tx/${txId}`,
    method: 'PUT',
    body: {
      state: 'ACTIVE',
      type: 'OTHER',
      client_id: clientId,
      data: {
        aeao: {
          other: {}
        }
      }
    }
  })
})

/*

Every code example is assumed to start with the following code:

const {
  API_KEY,
  API_SECRET,
} = process.env
const client = require('fiskaly-kassensichv-client')(API_KEY, API_SECRET)

*/

test('list all clients', async t => {
  const response = await client({
    url: '/client',
    method: 'GET'
  })
  const { body } = response

  // The code example ends here.

  t.is(body._type, 'CLIENT_LIST')
})

test('list clients', async t => {
  // const tssId = "...";
  const response = await client({
    url: `tss/${tssId}/client`,
    method: 'GET'
  })
  const { body } = response

  // The code example ends here.

  t.is(body._type, 'CLIENT_LIST')
})

test('retrieve client', async t => {
  // const tssId = "...";
  // const clientId = "...";
  const response = await client({
    url: `tss/${tssId}/client/${clientId}`,
    method: 'GET'
  })
  const { body } = response

  // The code example ends here.

  t.is(body._type, 'CLIENT')
  t.is(body._id, clientId)
})

test('upsert client', async t => {
  // const tssId = "...";
  // const clientId = "...";
  // const serial_number = "..."
  const response = await client({
    url: `tss/${tssId}/client/${clientId}`,
    method: 'PUT',
    body: {
      serial_number
    }
  })
  const { body } = response

  // The code example ends here.

  t.is(body._type, 'CLIENT')
  t.is(body._id, clientId)
})

test('cancel export', async t => {
  // const tssId = "...";
  // const exportId = "...";
  const response = await client({
    url: `tss/${tssId}/export/${exportId}`,
    method: 'DELETE'
  })
  const { body } = response

  // The code example ends here.

  t.is(body._type, 'EXPORT')
  t.is(body._id, exportId)
})

test.skip('list all exports', async t => {
  const response = await client({
    url: '/export',
    method: 'GET'
  })
  const { body } = response

  // The code example ends here.

  t.is(body._type, 'EXPORT_LIST')
})

test('list exports', async t => {
  // const tssId = "...";
  const response = await client({
    url: `tss/${tssId}/export`,
    method: 'GET'
  })
  const { body } = response

  // The code example ends here.

  t.is(body._type, 'EXPORT_LIST')
})

test('retrieve export', async t => {
  // const tssId = "...";
  // const exportId = "...";
  const response = await client({
    url: `tss/${tssId}/export/${exportId}`,
    method: 'GET'
  })
  const { body } = response

  // The code example ends here.

  t.is(body._type, 'EXPORT')
  t.is(body._id, exportId)
})

test('trigger export', async t => {
  // const tssId = "...";
  const exportId = uuid()
  const response = await client({
    url: `tss/${tssId}/export/${exportId}`,
    method: 'PUT',
    body: {}
  })
  const { body } = response

  // The code example ends here.

  t.is(body._type, 'EXPORT')
  t.is(body._id, exportId)
})

test('list tss', async t => {
  const response = await client({
    url: '/tss',
    method: 'GET'
  })
  const { body } = response

  // The code example ends here.

  t.is(body._type, 'TSS_LIST')
})

test('retrieve tss', async t => {
  // const tssId = "...";
  const response = await client({
    url: `tss/${tssId}`,
    method: 'GET'
  })
  const { body } = response

  // The code example ends here.

  t.is(body._type, 'TSS')
  t.is(body._id, tssId)
})

test('upsert tss', async t => {
  // const tssId = "...";
  const response = await client({
    url: `tss/${tssId}`,
    method: 'PUT',
    body: {
      state: 'INITIALIZED'
    }
  })
  const { body } = response

  // The code example ends here.

  t.is(body._type, 'TSS')
  t.is(body._id, tssId)
})

test('list all transactions', async t => {
  const response = await client({
    url: '/tx',
    method: 'GET'
  })
  const { body } = response

  // The code example ends here.

  t.is(body._type, 'TRANSACTION_LIST')
})

test('list transactions', async t => {
  // const tssId = "...";
  const response = await client({
    url: `tss/${tssId}/tx`,
    method: 'GET'
  })
  const { body } = response

  // The code example ends here.

  t.is(body._type, 'TRANSACTION_LIST')
})

test('retrieve transaction', async t => {
  // const tssId = "...";
  // const txId = "...";
  const response = await client({
    url: `tss/${tssId}/tx/${txId}`,
    method: 'GET'
  })
  const { body } = response

  // The code example ends here.

  t.is(body._type, 'TRANSACTION')
  t.is(body._id, txId)
})

test('retrieve transaction log', async t => {
  // const tssId = "...";
  // const txId = "...";
  const response = await client({
    url: `tss/${tssId}/tx/${txId}/log`,
    method: 'GET',
    json: false,
    responseType: 'buffer'
  })

  // The code example ends here.

  t.truthy(response)
})

test('upsert transaction', async t => {
  // const tssId = "...";
  // const txId = "...";
  // const clientId = "...";
  // const last_revision = "...";
  const response = await client({
    url: `tss/${tssId}/tx/${txId}`,
    method: 'PUT',
    body: {
      state: 'ACTIVE',
      type: 'OTHER',
      client_id: clientId,
      data: {
        aeao: {
          other: {}
        }
      }
    },
    query: { last_revision }
  })
  const { body } = response

  // The code example ends here.

  t.is(body._type, 'TRANSACTION')
  t.is(body._id, txId)
})
