'use strict'

const dotenv = require('dotenv')
const test = require('ava')
const uuid = require('@pgaubatz/uuid')
const pkg = require('../package.json')
const createSdkClient = require('./client')

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
const sdk = createConfiguredSdkClient()
const tssId = uuid.v4()
const clientId = uuid.v4()
const txId = uuid.v4()

test('do not expose __test__ when NODE_ENV != test', t => {
  process.env.NODE_ENV = 'production'
  const productionSdk = createConfiguredSdkClient()
  process.env.NODE_ENV = 'test'
  t.false('__test__' in productionSdk)
})

test('automatically fetch and refresh accessToken', async t => {
  t.truthy(await sdk({ url: '/client' }))
})

test('automatically repair broken/malformed/invalid accessToken', async t => {
  for await (const accessToken of ['invalid', '', null]) {
    sdk.__test__.authContext.accessToken = accessToken
    t.truthy(await sdk({ url: '/client' }))
  }
})

test.serial('create a TSS', async t => {
  t.truthy(await sdk({
    url: `/tss/${tssId}`,
    method: 'PUT',
    body: {
      state: 'INITIALIZED',
      description: `Test TSS created by ${pkg.name}/${pkg.version}`
    }
  }))
})

test.serial('list all TSS', async t => {
  const list = await sdk({ url: '/tss' })
  t.truthy(list)
  t.true(Array.isArray(list.body.data))
  t.true(list.body.data.some(({ _id }) => _id === tssId), 'created TSS is included in the list')
})

test.serial('create a Client', async t => {
  t.truthy(await sdk({
    url: `/tss/${tssId}/client/${clientId}`,
    method: 'PUT',
    body: {
      serial_number: clientId
    }
  }))
})

test.serial('list all Clients', async t => {
  const list = await sdk({ url: '/client' })
  t.truthy(list)
  t.true(Array.isArray(list.body.data))
  t.true(list.body.data.some(({ _id }) => _id === clientId), 'created Client is included in the list')
})

test.serial('intercept Transactions', async t => {
  let signTxCalled = false
  const { signTx } = sdk.__test__.sma
  sdk.__test__.sma.signTx = async (payload) => {
    signTxCalled = true
    return signTx(payload)
  }
  t.false(signTxCalled)
  const txRev1 = await sdk({
    url: `/tss/${tssId}/tx/${txId}`,
    method: 'PUT',
    body: {
      state: 'ACTIVE',
      type: 'ORDER',
      client_id: clientId,
      data: {
        aeao: {
          receipt_type: 'ORDER',
          line_items: [{ quantity: '1', text: 'Bier', price_per_unit: '3.20' }]
        }
      }
    }
  })
  t.true(signTxCalled)
  t.truthy(txRev1)
  const txRev2 = await sdk({
    url: `/tss/${tssId}/tx/${txId}`,
    method: 'PUT',
    query: {
      last_revision: txRev1.body.revision
    },
    body: {
      type: 'ORDER',
      data: {
        aeao: {
          receipt_type: 'ORDER',
          line_items: [
            {
              quantity: '1',
              text: 'Apfelstrudel',
              price_per_unit: '4.00'
            }
          ]
        }
      },
      state: 'ACTIVE',
      client_id: clientId
    }
  })
  t.truthy(txRev2)
  const txRev3 = await sdk({
    url: `/tss/${tssId}/tx/${txId}`,
    method: 'PUT',
    query: {
      last_revision: txRev2.body.revision
    },
    body: {
      type: 'RECEIPT',
      data: {
        aeao: {
          receipt_type: 'RECEIPT',
          line_items: [
            {
              quantity: '1',
              text: 'Wiener Melange',
              price_per_unit: '2.20'
            },
            {
              quantity: '1',
              text: 'Apfelstrudel',
              price_per_unit: '4.00'
            }
          ],
          amounts_per_vat_rate: [
            {
              vat_rate: '10',
              amount: '2.20'
            },
            {
              vat_rate: '20',
              amount: '4.00'
            }
          ],
          amounts_per_payment_type: [
            {
              payment_type: 'CASH',
              amount: '6.20'
            }
          ]
        }
      },
      state: 'FINISHED',
      client_id: clientId
    }
  })
  t.truthy(txRev3)
})

test.serial('list all Transactions', async t => {
  const list = await sdk({ url: `/tss/${tssId}/tx` })
  t.truthy(list)
  t.true(Array.isArray(list.body.data))
  t.true(list.body.data.some(({ _id }) => _id === txId), 'created Transaction is included in the list')
})
