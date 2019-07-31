'use strict'

const sma = require('./sma')
const createClient = require('./client')

module.exports = createClient.bind(null, sma)
