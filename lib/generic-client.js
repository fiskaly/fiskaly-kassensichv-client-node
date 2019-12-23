'use strict'

const createClient = require('./client')

class Client {

    constructor(sma, apiKey, apiSecret) {
        this.client = createClient(sma, apiKey, apiSecret)
    }

    async request({method, path, query, headers, body}) {
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