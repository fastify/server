# @fastify/server

## Install

```shell
npm install @fastify/server
```

## Example

This example show the basic usage of create web server.

```typescript
import { createServer } from '@fastify/server'

const server = createServer({}, function(request, response) {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ data: "Hello World!" }));
})
server.listen({ port: 3000 })
```

## API

## Difference from `node:http`, `node:https` and `node:http2`.

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
