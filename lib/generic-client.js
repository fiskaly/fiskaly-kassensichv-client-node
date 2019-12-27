'use strict'

const createClient = require('./client')

class Client {

    constructor(sma, apiKey, apiSecret, baseUrl) {
        this.client = createClient(sma, apiKey, apiSecret, baseUrl)
    }

    async request(method, path, body, query, headers) {
        return await this.client({
            method, 
            url: path, 
            query, 
            headers,
            body
        })
    }

}

module.exports = Client