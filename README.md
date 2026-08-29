# @fastify/server

## Install

```shell
npm install @fastify/server
```

## Example

This example show the basic usage of create web server.

```TypeScript
import { createServer } from '@fastify/server'

const server = createServer({}, function(request, response) {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ data: "Hello World!" }));
})
server.listen({ port: 3000 })
```

## API

### createServer([options[, requestHandler]]): Server

#### `options.http`

Accept either `true` or the same options passed to [`http.createServer`](https://nodejs.org/docs/latest/api/http.html#httpcreateserveroptions-requestlistener). When combine with `options.http2 = true` it accepts
[`http2.createServer`](https://nodejs.org/docs/latest/api/http2.html#http2createserveroptions-onrequesthandler) instead.

#### `options.https`

Accept either `true` or the same options passed to [`https.createServer`](https://nodejs.org/docs/latest/api/https.html#httpscreateserveroptions-requestlistener). When combine with
`options.http2 = true` it accepts [`http2.createSecureServer`](https://nodejs.org/docs/latest/api/http2.html#http2createsecureserveroptions-onrequesthandler) instead.

#### `options.http2`

Passing `true` to create `node:http2` server, the options for `createServer` will be passed by either `options.http` or `options.https`.

#### `options.serverFactory(requestListener[, options])`

Accept `function` that return server created by `node:http`, `node:https` or `node:http2`.
It will pass through the `options` and `requestListener` for the server creation.

```TypeScript
import http from 'node:http'
import { createServer } from '@fastify/server'

function serverFactory(requestListener, options) {
  // options is the same as 
  // first argument passed to createServer
  return http.createServer(options.http, requestListener)
}

const server = createServer({
  http: {},
  serverFactory
})
server.listen()
```

#### `options.keepAliveTimeout`

Default: 72000 (72 seconds)

Accept any positive integer which used to update the `node:http` and `node:https` keepAliveTimeout.

#### `options.connectionTimeout`

Default: 0

Accept any positive integer which used to update the `node:http`,
`node:https` and `node:http2` timeout.

#### `options.requestTimeout`

Default: 0

Accept any positive integer which used to update the `node:http`
and `node:https` requestTimeout.

#### `options.maxRequestsPerSocket`

Default: 0

Accept any positive integer which used to update the `node:http`
and `node:https` maxRequestsPerSocket.

#### `options.http2SessionTimeout`

Default: 72000 (72 seconds)

Accept any positive integer which used to update the `node:http2`
session timeout.

#### `options.forceCloseConnections`

Default: false

When `true` force close connections when calling `.close`.
Only `node:http` and `node:https` support force closing using `.closeAllConnections`.
`node:http2` will send `GOAWAY` by default and will wait for the session gracefully close.

#### `requestHandler(request, response)`

The `function` that used to attach `request` event for the `node:http`, `node:https` and `node:http2` server. When, using with `node:http2` it should set `allowHTTP1: true` for using the [compatibity feature](https://nodejs.org/docs/latest/api/http2.html#compatibility-api).

### Server

The proxied server returned by `createServer`.
It helps to manage multiple server togather and update the properties.

#### `.listen([options[, callback]])`

Accept the same `options` passed to [`net.Server.listen`](https://nodejs.org/docs/latest/api/net.html#serverlistenoptions-callback).
However, to ensure the security `host` will be default to `localhost` and `port` will be default to `0` if not specified.
The listen order prority is the same as `Node.js`, starting from `handle > port > path`.

The `callback` function will be fired once all server is available.
Same as attaching to `fastify.listening` event.

```TypeScript
import { createServer } from '@fastify/server'

const server = createServer()
server.listen({}, function(error, address) {
  // address is the main server address
})
```

When `callback` is not specified, the function will return `Promise`
which resolved when all servers are available.

```TypeScript
import { createServer } from '@fastify/server'

const server = createServer()
const address = await server.listen({})
```

#### `.close([callback])`

Used to close all the server.

`callback` will be fired once all servers are closed.
Same as attaching to `fastify.close` event.

```TypeScript
import { createServer } from '@fastify/server'

const server = createServer()
await server.listen()
server.close(function(error) {
})
```

When `callback` is not specified, the function will return `Promise`
which resolved when all servers are close.

```TypeScript
import { createServer } from '@fastify/server'

const server = createServer()
await server.listen()
await server.close()
```

#### `.addresses()`

Return all the listening address.

```TypeScript
import { createServer } from '@fastify/server'

const server = createServer()
await server.listen()
const addresses = server.addresses()
for(const address of addresses) {
  if(typeof address === 'string') {
    // unix-socket / Windows pipe
  } else {
    console.log(address.address)
    console.log(address.family)
  }
}
```

#### `.listeningOrigin`

Return URL that allows to connect main server.

```TypeScript
import { createServer } from '@fastify/server'

const server = createServer()
await server.listen()

const response = await fetch(server.listeningOrigin)
```

## Difference from `node:http`, `node:https` and `node:http2`

### All-in-one `createServer`

The `createServer` will determine using which `node` built-in server
based on the options provided. You do not need to change the import
module and just safely update the options accordingly.

### Remove overload of `.listen`

The `.listen` method only takes `options` and `callback` as arguments.
It simplify the API and the process of normalize the arguments.

### Solves `localhost` dual-stack problem

`localhost` may resolve to either `IPv4` or `IPv6` based on operating
system. Sometimes operating system will fallback to `IPv4` if you listen
on `IPv6`. We instead listen on both to prevent this problem.

|Host                                                                              | IPv4           | IPv6 |
|----------------------------------------------------------------------------------|----------------|------|
|`::`                                                                              | ✅<sup>*</sup> | ✅   |
|`::` + [`ipv6Only`](https://nodejs.org/api/net.html#serverlistenoptions-callback) | 🚫             | ✅   |
|`0.0.0.0`                                                                         | ✅             | 🚫   |
|`localhost`                                                                       | ✅             | ✅   |
|`127.0.0.1`                                                                       | ✅             | 🚫   |
|`::1`                                                                             | 🚫             | ✅   |

<sup>*</sup> Using `::` for the address will listen on all IPv6 addresses and,
depending on OS, may also listen on [all IPv4
addresses](https://nodejs.org/api/net.html#serverlistenport-host-backlog-callback).

### Dual `Promise API` and `Callback API`

Unlike `Node.js` built-in, the `.listen` and `.close` will return `Promise`
when you do not provide `callback` function. You can choose to use either
API in your application.

## License

Licensed under [MIT](./LICENSE).
