'use strict'

const pkg = require('./package.json')
const got = require('got')
const debug = require('debug')(pkg.name)
const sma = require('./sma')

function extendClient (client, options, testProperties = {}) {
  const extendedClient = client.extend(options)
  if (process.env.NODE_ENV === 'test') {
    extendedClient.__test__ = Object.assign(
      {},
      client.__test__,
      testProperties
    )
  }
  return extendedClient
}

function createBaseClient (client, opts = {}) {
  const mergedOptions = got.mergeOptions(opts, {
    json: true,
    baseUrl: 'https://kassensichv.fiskaly.com/api/v0',
    headers: {
      'user-agent': `${pkg.name}-node/${pkg.version} (${pkg.homepage})`
    }
  })
  return extendClient(client, mergedOptions)
}

function createAuthenticatingClient (client, apiKey, apiSecret) {
  const authContext = {}
  const fetchToken = async (body) => {
    const result = await client({
      method: 'POST',
      url: '/auth',
      body
    })
    authContext.accessToken = result.body.access_token
    authContext.refreshToken = result.body.refresh_token
    authContext.refreshInterval = result.body.refresh_token_expires_in * 1000 / 10
    debug('Fetched fresh accessToken: %s', authContext.accessToken)
  }
  const auth = async () => {
    clearInterval(authContext.timerId)
    await fetchToken({
      api_key: apiKey,
      api_secret: apiSecret
    })
    const { refreshInterval } = authContext
    debug('Successfully fetched accessToken')
    debug('Will refresh accessToken every %d seconds', refreshInterval / 1000)
    authContext.timerId = setInterval(() => {
      fetchToken({ refresh_token: authContext.refreshToken })
    }, refreshInterval)
  }
  const hooks = {
    beforeRequest: [
      async (options) => {
        if (authContext.accessToken == null) {
          debug('Fetching fresh accessToken...')
          await auth()
        }
        options.headers.authorization = `Bearer ${authContext.accessToken}`
      }
    ],
    afterResponse: [
      async (response, retry) => {
        const { body, statusCode } = response
        const isMissingAccessToken = statusCode === 401
        const isMalformedAccessToken = statusCode === 400 && /could not parse jwt/.test(body)
        const shouldRecreateAccessToken = isMissingAccessToken || isMalformedAccessToken
        if (shouldRecreateAccessToken) {
          debug('Authentication failed. Will delete accessToken and retry request...')
          delete authContext.accessToken
          return retry({ json: false }) // FIXME: without the { json: false } hack got will try to JSON.parse() the body twice
        }
        return response
      }
    ]
  }
  return extendClient(client, { hooks }, { authContext })
}

function createTxInterceptingClient (client) {
  const overrideTxPath = (str) => {
    const [path, query] = str.split('?')
    const parts = [path, '/log', query && `?${query}`]
    return parts.filter(Boolean).join('')
  }
  const overrideTxRequestOptions = (options, body) => {
    options.path = overrideTxPath(options.path)
    options.pathname = overrideTxPath(options.pathname)
    options.href = overrideTxPath(options.href)
    options.body = body
    options.headers['content-length'] = body.length
  }
  const signTx = async (tssId, payload) => {
    debug('Signing transaction for TSS %s: %o', tssId, payload)
    const signedTx = await sma.signTx(payload)
    return signedTx
  }
  const interceptTxRequest = async (options) => {
    const { body, href, path } = options
    debug('Intercepting transaction upsert request: %s', href)
    const [, tssId] = /^\/api\/v\d\/tss\/(.+)\/tx\//i.exec(path)
    const payload = JSON.parse(body)
    const log = await signTx(tssId, payload)
    const content = JSON.stringify({ payload, log })
    overrideTxRequestOptions(options, content)
  }
  const putMethodRegex = /put/i
  const txPathRegex = /^\/api\/v\d\/tss\/.+\/tx\/.+/i
  const hooks = {
    beforeRequest: [
      async (options) => {
        const { path, method } = options
        if (putMethodRegex.test(method) && txPathRegex.test(path)) {
          await interceptTxRequest(options)
        }
      }
    ]
  }
  return extendClient(client, { hooks }, { sma })
}

function createClient (apiKey, apiSecret, opts = {}) {
  const base = createBaseClient(got, opts)
  const authenticating = createAuthenticatingClient(base, apiKey, apiSecret)
  const txIntercepting = createTxInterceptingClient(authenticating)
  return txIntercepting
}

module.exports = createClient
