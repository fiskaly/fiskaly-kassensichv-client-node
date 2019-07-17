# fiskaly KassenSichV client for Node.js

The fiskaly KassenSichV client is an HTTP client that is needed<sup>[1](#fn1)</sup> for accessing the [kassensichv.io](https://kassensichv.io) API that implements a cloud-based, virtual **CTSS** (Certified Technical Security System) / **TSE** (Technische Sicherheitseinrichtung) as defined by the German **KassenSichV** ([Kassen­sich­er­ungsver­ord­nung](https://www.bundesfinanzministerium.de/Content/DE/Downloads/Gesetze/2017-10-06-KassenSichV.pdf)).

Conceptually this client is a thin (convenience) wrapper above the [got](https://github.com/sindresorhus/got) HTTP client library for Node.js. 
This means you will have to look up the [API documentation](https://github.com/sindresorhus/got#api) of got to learn how this client is used. From a developer's point of view, the only difference is that you have to `require('fiskaly-kassensichv-client')` instead of `require('got')`.

## Features

- Automatic authentication handling (fetch/refresh JWT and re-authenticate upon 401 errors).
- Automatic retries on failures (server errors or network timeouts/issues).
- Automatic JSON parsing and serialization of request and response bodies.
- Future: [<a name="fn1">1</a>] compliance regarding [BSI CC-PP-0105-2019](https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/Zertifizierung/Reporte/ReportePP/pp0105b_pdf.pdf?__blob=publicationFile&v=7) which mandates a locally executed SMA component for creating signed log messages. Note: this SMA component will be bundled within this package as a binary shared library in a future release. Currently it's a dummy JavaScript implementation.
- Future: Automatic offline-handling (collection and documentation according to [Anwendungserlass zu § 146a AO](https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Weitere_Steuerthemen/Abgabenordnung/AO-Anwendungserlass/2019-06-17-einfuehrung-paragraf-146a-AO-anwendungserlass-zu-paragraf-146a-AO.pdf?__blob=publicationFile&v=1))

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
