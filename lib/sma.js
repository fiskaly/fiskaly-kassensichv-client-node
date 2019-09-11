'use strict'

const pkg = require('../package.json')
const debug = require('debug')(pkg.name)
const path = require('path')
const ffi = require('ffi-napi')
const ref = require('ref-napi')

const libPlatform = osPlatform()
const libArch = osArch()
const libFile = `com.fiskaly.kassensichv.sma-${libPlatform}-${libArch}`
const libPath = path.resolve(__dirname, 'sma', 'dist', libFile)
debug('Loading sma library %s', libPath)
const lib = ffi.Library(libPath, {
  Invoke: ['char *', ['char *']],
  Free: ['void', ['char *']]
})

function osPlatform () {
  if (process.platform === 'win32') {
    return 'windows'
  } else {
    return process.platform
  }
}

function osArch () {
  if (process.arch === 'x32') {
    return '386'
  } else if (process.arch === 'x64') {
    return 'amd64'
  } else {
    return process.arch
  }
}

function readAndFreeCString (CStr) {
  if (CStr != null) {
    const str = CStr.readCString()
    lib.Free(CStr)
    return str
  }
}

async function invoke (method, maybeParams) {
  return new Promise((resolve, reject) => {
    const params = Array.isArray(maybeParams)
      ? maybeParams
      : [maybeParams]
    const id = Date.now()
    const request = {
      jsonrpc: '2.0',
      method,
      params,
      id
    }
    const requestJson = JSON.stringify(request)
    const requestCStr = ref.allocCString(requestJson)
    lib.Invoke.async(requestCStr, (err, responseCStr) => {
      const responseJson = readAndFreeCString(responseCStr)
      if (err) {
        reject(err)
      } else {
        const response = JSON.parse(responseJson)
        const { result, error } = response
        if (error != null) {
          const { message, ...props } = error
          const err = Object.assign(new Error(message), props)
          reject(err)
        } else {
          resolve(result)
        }
      }
    })
  })
}

async function signTx (payload) {
  return invoke('sign-transaction', payload)
}

async function version () {
  return invoke('version')
}

module.exports = {
  signTx,
  version
}
