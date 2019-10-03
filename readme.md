# fiskaly KassenSichV client for Node.js

[![Build Status](https://travis-ci.org/fiskaly/fiskaly-kassensichv-client-node.svg?branch=master)](https://travis-ci.org/fiskaly/fiskaly-kassensichv-client-node)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=fiskaly_fiskaly-kassensichv-client-node&metric=alert_status)](https://sonarcloud.io/dashboard?id=fiskaly_fiskaly-kassensichv-client-node)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=fiskaly_fiskaly-kassensichv-client-node&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=fiskaly_fiskaly-kassensichv-client-node)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=fiskaly_fiskaly-kassensichv-client-node&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=fiskaly_fiskaly-kassensichv-client-node)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=fiskaly_fiskaly-kassensichv-client-node&metric=security_rating)](https://sonarcloud.io/dashboard?id=fiskaly_fiskaly-kassensichv-client-node)


The fiskaly KassenSichV client is an HTTP client that is needed<sup>[1](#fn1)</sup> for accessing the [kassensichv.io](https://kassensichv.io) API that implements a cloud-based, virtual **CTSS** (~Certified~ Technical Security System) / **TSE** (Technische Sicherheitseinrichtung) as defined by the German **KassenSichV** ([Kassen­sich­er­ungsver­ord­nung](https://www.bundesfinanzministerium.de/Content/DE/Downloads/Gesetze/2017-10-06-KassenSichV.pdf)).

Conceptually this client is a thin (convenience) wrapper above the [got](https://github.com/sindresorhus/got) HTTP client library for Node.js. 
This means you will have to look up the [API documentation](https://github.com/sindresorhus/got#api) of got to learn how this client is used. From a developer's point of view, the only difference is that you have to `require('fiskaly-kassensichv-client')` instead of `require('got')`.

## Features

- [x] Automatic authentication handling (fetch/refresh JWT and re-authenticate upon 401 errors).
- [x] Automatic retries on failures (server errors or network timeouts/issues).
- [x] Automatic JSON parsing and serialization of request and response bodies.
- [X] [<a name="fn1">1</a>] compliance regarding [BSI CC-PP-0105-2019](https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/Zertifizierung/Reporte/ReportePP/pp0105b_pdf.pdf?__blob=publicationFile&v=7) which mandates a locally executed SMA component for creating signed log messages.
- [ ] Automatic offline-handling (collection and documentation according to [Anwendungserlass zu § 146a AO](https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Weitere_Steuerthemen/Abgabenordnung/AO-Anwendungserlass/2019-06-17-einfuehrung-paragraf-146a-AO-anwendungserlass-zu-paragraf-146a-AO.pdf?__blob=publicationFile&v=1))

## Install

```
$ npm install fiskaly-kassensichv-client
```

## Usage

```js
const apiKey = '...' // create your own API key and secret at https://dashboard.fiskaly.com
const apiSecret = '...'
const client = require('fiskaly-kassensichv-client')(apiKey, apiSecret)
const uuid = require('uuid')

async function main() {
  const tssId = uuid.v4()
  const response = await client({
    url: `/tss/${tssId}`,
    method: 'PUT',
    body: {
      state: 'INITIALIZED',
      description: 'My first TSS created by the fiskaly KassenSichV Node.js client'
    }
  })
  console.log(response.body)
  //=> '{ state: 'INITIALIZED' ...'
}

main().catch(console.error)
```

## Related

- [fiskaly.com](https://fiskaly.com)
- [dashboard.fiskaly.com](https://dashboard.fiskaly.com)
- [kassensichv.io](https://kassensichv.io)
- [kassensichv.net](https://kassensichv.net)
