'use strict'

async function signTx (payload) {
  // TODO: actually sign payload using binary SMA library.
  // for now this is just a dummy implementation:
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

module.exports = {
  signTx
}
