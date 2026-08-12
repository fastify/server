"use strict";
const { describe, test } = require("node:test");
const { normalizeListenOptions } = require("../../lib/listen");
const { Socket } = require("node:net");

describe("listen options normalize", () => {
  const handle = Socket();
  const abort = new AbortController();

  const cases = [
    {
      name: "{ handle }",
      actual: { handle },
      expect: { handle },
    },
    {
      name: "{ handle, path }",
      actual: { handle, path: "" },
      expect: { handle },
    },
    {
      name: "{ handle, host }",
      actual: { handle, host: "127.0.0.1" },
      expect: { handle },
    },
    {
      name: "{ handle, host, port }",
      actual: { handle, host: "127.0.0.1", port: 1 },
      expect: { handle },
    },
    {
      name: "{ path }",
      actual: { path: "" },
      expect: { path: "" },
    },
    {
      name: "{ path, host }",
      actual: { path: "", host: "127.0.0.1" },
      expect: { path: "" },
    },
    {
      name: "{ path, port }",
      actual: { path: "", port: 1 },
      expect: { host: "localhost", port: 1 },
    },
    {
      name: "{ path, host, port }",
      actual: { path: "", host: "127.0.0.1", port: 1 },
      expect: { host: "127.0.0.1", port: 1 },
    },
    {
      name: "{ port }",
      actual: { port: 1 },
      expect: { host: "localhost", port: 1 },
    },
    {
      name: "{ host }",
      actual: { host: "127.0.0.1" },
      expect: { host: "127.0.0.1", port: 0 },
    },
    {
      name: "{ host, port }",
      actual: { host: "127.0.0.1", port: 1 },
      expect: { host: "127.0.0.1", port: 1 },
    },
    {
      name: "{ backlog: 1 }",
      actual: { backlog: 1 },
      expect: { host: "localhost", port: 0, backlog: 1 },
    },
    {
      name: "{ backlog: true }",
      actual: { backlog: true },
      expect: { host: "localhost", port: 0 },
    },
    {
      name: "{ exclusive: 1 }",
      actual: { exclusive: 1 },
      expect: { host: "localhost", port: 0 },
    },
    {
      name: "{ exclusive: true }",
      actual: { exclusive: true },
      expect: { host: "localhost", port: 0, exclusive: true },
    },
    {
      name: "{ ipv6Only: 1 }",
      actual: { ipv6Only: 1 },
      expect: { host: "localhost", port: 0 },
    },
    {
      name: "{ ipv6Only: true }",
      actual: { ipv6Only: true },
      expect: { host: "localhost", port: 0, ipv6Only: true },
    },
    {
      name: "{ reusePort: 1 }",
      actual: { reusePort: 1 },
      expect: { host: "localhost", port: 0 },
    },
    {
      name: "{ reusePort: true }",
      actual: { reusePort: true },
      expect: { host: "localhost", port: 0, reusePort: true },
    },
    {
      name: "{ readableAll: 1 }",
      actual: { readableAll: 1 },
      expect: { host: "localhost", port: 0 },
    },
    {
      name: "{ readableAll: true }",
      actual: { readableAll: true },
      expect: { host: "localhost", port: 0, readableAll: true },
    },
    {
      name: "{ writableAll: 1 }",
      actual: { writableAll: 1 },
      expect: { host: "localhost", port: 0 },
    },
    {
      name: "{ writableAll: true }",
      actual: { writableAll: true },
      expect: { host: "localhost", port: 0, writableAll: true },
    },
    {
      name: "{ signal: 1 }",
      actual: { signal: 1 },
      expect: { host: "localhost", port: 0 },
    },
    {
      name: "{ signal: {} }",
      actual: { signal: {} },
      expect: { host: "localhost", port: 0 },
    },
    {
      name: "{ signal: null }",
      actual: { signal: null },
      expect: { host: "localhost", port: 0 },
    },
    {
      name: "{ signal }",
      actual: { signal: abort.signal },
      expect: { host: "localhost", port: 0, signal: abort.signal },
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
