"use strict";
const { describe, test } = require("node:test");
const { normalizeListenOptions } = require("../../lib/listen");
const { Socket } = require("node:net");

describe("listen options normalize", () => {
  const handle = Socket();
  const abort = new AbortController();

  const cases = [
    {
      actual: {
        handle,
      },
      expect: {
        handle,
      },
      name: "{ handle }",
    },
    {
      actual: {
        handle,
        path: "",
      },
      expect: {
        handle,
      },
      name: "{ handle, path }",
    },
    {
      actual: {
        handle,
        host: "127.0.0.1",
      },
      expect: {
        handle,
      },
      name: "{ handle, host }",
    },
    {
      actual: {
        handle,
        host: "127.0.0.1",
        port: 1,
      },
      expect: {
        handle,
      },
      name: "{ handle, host, port }",
    },
    {
      actual: {
        path: "",
      },
      expect: {
        path: "",
      },
      name: "{ path }",
    },
    {
      actual: {
        host: "127.0.0.1",
        path: "",
      },
      expect: {
        path: "",
      },
      name: "{ path, host }",
    },
    {
      actual: {
        path: "",
        port: 1,
      },
      expect: {
        host: "localhost",
        port: 1,
      },
      name: "{ path, port }",
    },
    {
      actual: {
        host: "127.0.0.1",
        path: "",
        port: 1,
      },
      expect: {
        host: "127.0.0.1",
        port: 1,
      },
      name: "{ path, host, port }",
    },
    {
      actual: {
        port: 1,
      },
      expect: {
        host: "localhost",
        port: 1,
      },
      name: "{ port }",
    },
    {
      actual: {
        host: "127.0.0.1",
      },
      expect: {
        host: "127.0.0.1",
        port: 0,
      },
      name: "{ host }",
    },
    {
      actual: {
        host: "127.0.0.1",
        port: 1,
      },
      expect: {
        host: "127.0.0.1",
        port: 1,
      },
      name: "{ host, port }",
    },
    {
      actual: {
        backlog: 1,
      },
      expect: {
        backlog: 1,
        host: "localhost",
        port: 0,
      },
      name: "{ backlog: 1 }",
    },
    {
      actual: {
        backlog: true,
      },
      expect: {
        host: "localhost",
        port: 0,
      },
      name: "{ backlog: true }",
    },
    {
      actual: {
        exclusive: 1,
      },
      expect: {
        host: "localhost",
        port: 0,
      },
      name: "{ exclusive: 1 }",
    },
    {
      actual: {
        exclusive: true,
      },
      expect: {
        exclusive: true,
        host: "localhost",
        port: 0,
      },
      name: "{ exclusive: true }",
    },
    {
      actual: {
        ipv6Only: 1,
      },
      expect: {
        host: "localhost",
        port: 0,
      },
      name: "{ ipv6Only: 1 }",
    },
    {
      actual: {
        ipv6Only: true,
      },
      expect: {
        host: "localhost",
        ipv6Only: true,
        port: 0,
      },
      name: "{ ipv6Only: true }",
    },
    {
      actual: {
        reusePort: 1,
      },
      expect: {
        host: "localhost",
        port: 0,
      },
      name: "{ reusePort: 1 }",
    },
    {
      actual: {
        reusePort: true,
      },
      expect: {
        host: "localhost",
        port: 0,
        reusePort: true,
      },
      name: "{ reusePort: true }",
    },
    {
      actual: {
        readableAll: 1,
      },
      expect: {
        host: "localhost",
        port: 0,
      },
      name: "{ readableAll: 1 }",
    },
    {
      actual: {
        readableAll: true,
      },
      expect: {
        host: "localhost",
        port: 0,
        readableAll: true,
      },
      name: "{ readableAll: true }",
    },
    {
      actual: {
        writableAll: 1,
      },
      expect: {
        host: "localhost",
        port: 0,
      },
      name: "{ writableAll: 1 }",
    },
    {
      actual: {
        writableAll: true,
      },
      expect: {
        host: "localhost",
        port: 0,
        writableAll: true,
      },
      name: "{ writableAll: true }",
    },
    {
      actual: {
        signal: 1,
      },
      expect: {
        host: "localhost",
        port: 0,
      },
      name: "{ signal: 1 }",
    },
    {
      actual: {
        signal: {},
      },
      expect: {
        host: "localhost",
        port: 0,
      },
      name: "{ signal: {} }",
    },
    {
      actual: {
        signal: null,
      },
      expect: {
        host: "localhost",
        port: 0,
      },
      name: "{ signal: null }",
    },
    {
      actual: {
        signal: abort.signal,
      },
      expect: {
        host: "localhost",
        port: 0,
        signal: abort.signal,
      },
      name: "{ signal }",
    },
  ];

  for (const { name, actual, expect } of cases) {
    test(name, (t) => {
      t.plan(1);
      const result = normalizeListenOptions(actual);
      t.assert.deepStrictEqual(result, expect);
    });
  }
});
