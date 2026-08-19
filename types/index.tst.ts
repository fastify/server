import type { AddressInfo } from "node:net";
import { expect } from "tstyche";
import {
  createServer,
  type ProxyHTTP2SecureServer,
  type ProxyHTTP2Server,
  type ProxyHTTPServer,
  type ProxyHTTPSServer,
} from ".";

expect(createServer({}, () => {})).type.toBe<ProxyHTTPServer>();
expect(
  createServer(
    {
      https: true,
    },
    () => {},
  ),
).type.toBe<ProxyHTTPSServer>();
expect(
  createServer(
    {
      https: {},
    },
    () => {},
  ),
).type.toBe<ProxyHTTPSServer>();
expect(
  createServer(
    {
      http2: true,
    },
    () => {},
  ),
).type.toBe<ProxyHTTP2Server>();
expect(
  createServer(
    {
      http2: true,
      https: {},
    },
    () => {},
  ),
).type.toBe<ProxyHTTP2SecureServer>();

const proxy = createServer({}, () => {});
expect(proxy.addresses()).type.toBe<Array<string | AddressInfo>>();
