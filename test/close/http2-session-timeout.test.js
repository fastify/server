"use strict";
const { describe, test, before } = require("node:test");
const { createServer } = require("../../lib/index");
const { connect, constants } = require("node:http2");
const { once } = require("node:stream");
const { buildCertificate } = require("../utils");
const { withResolvers } = require("../../lib/utils");

describe("http2SessionTimeout", () => {
  before(buildCertificate);

  test("http2 close with async-await", async () => {
    const server = createServer({
      http2: true,
      http2SessionTimeout: 100,
    });
    await server.listen();
    const session = connect(server.listeningOrigin);
    session.on("error", () => {});
    await once(session, "connect");
    await server.close();
  });

  test("http2s close with async-await", async () => {
    const server = createServer({
      http2: true,
      https: {
        key: global.context.privateKey,
        cert: global.context.certificate,
      },
      http2SessionTimeout: 100,
    });
    await server.listen();
    const session = connect(server.listeningOrigin, {
      rejectUnauthorized: false,
    });
    session.on("error", () => {});
    await once(session, "connect");
    await server.close();
  });

  test("http2 server-side emit timeout ", async (t) => {
    t.plan(1);

    const server = createServer({
      http2: true,
      http2SessionTimeout: 100,
    });
    const { promise, resolve } = withResolvers();
    server.on("stream", (stream) => {
      stream.session.once("timeout", resolve);
      stream.respond({
        [constants.HTTP2_HEADER_STATUS]: 200,
        [constants.HTTP2_HEADER_CONTENT_TYPE]:
          "application/json; charset=utf-8",
      });
      stream.end("{}");
    });
    await server.listen();
    const session = connect(server.listeningOrigin);
    session.on("error", () => {});
    await once(session, "connect");
    const request = session.request({ ":method": "GET", ":path": "/" }).end();
    const [headers] = await once(request, "response");
    t.assert.strictEqual(headers[":status"], 200);
    request.resume();
    await promise;
    await server.close();
  });

  test("http2 server-side emit timeout ", async (t) => {
    t.plan(1);

    const server = createServer({
      http2: true,
      http2SessionTimeout: 100,
    });
    await server.listen();
    const waitSessionConnect = once(server, "session");
    const session = connect(server.listeningOrigin);
    session.on("error", () => {});
    await once(session, "connect");
    await waitSessionConnect;
    const waitSessionClosed = once(session, "close");
    await server.close();
    await waitSessionClosed;
    t.assert.strictEqual(session.closed, true);
  });
});
