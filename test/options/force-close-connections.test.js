"use strict";

const { describe, test } = require("node:test");
const http2 = require("node:http2");
const http = require("node:http");
const { once } = require("node:stream");
const { createServer } = require("../../lib");

const handler = (_request, response) => {
  response.writeHead(200, {
    "Content-Type": "application/json",
  });
  response.end(
    JSON.stringify({
      data: "Hello World!",
    }),
  );
};

describe("forceCloseConnections", () => {
  describe("http2", () => {
    test("session should be closed", async (t) => {
      t.plan(2);

      const server = createServer({
        forceCloseConnections: true,
        http2: true,
        http2SessionTimeout: 100,
      });
      server.on("stream", (stream) => {
        stream.respond({
          [http2.constants.HTTP2_HEADER_STATUS]: 200,
          [http2.constants.HTTP2_HEADER_CONTENT_TYPE]:
            "application/json; charset=utf-8",
        });
        stream.end("{}");
      });
      await server.listen();

      const client = http2.connect(server.listeningOrigin);
      const request1 = client.request({
        [http2.constants.HTTP2_HEADER_PATH]: "/",
        [http2.constants.HTTP2_HEADER_METHOD]: "GET",
      });
      await once(request1, "response");

      server.close();

      const request2 = client.request({
        [http2.constants.HTTP2_HEADER_PATH]: "/",
        [http2.constants.HTTP2_HEADER_METHOD]: "GET",
      });
      const [error] = await once(request2, "error");
      t.assert.strictEqual(error.code, "ERR_HTTP2_STREAM_ERROR");
      request2.end();

      t.assert.strictEqual(client.closed, true);
      client.destroy();
    });
  });

  describe("http", () => {
    test("shutdown while keep-alive connections are active", async (t) => {
      t.plan(3);

      const server = createServer(
        {
          forceCloseConnections: true,
        },
        handler,
      );

      await server.listen();

      const keepAliveAgent = new http.Agent({
        keepAlive: true,
      });
      const address = server.address();
      const socketName = keepAliveAgent.getName({
        host: address.address,
        port: address.port,
      });

      const { promise, resolve, reject } = Promise.withResolvers();

      http
        .request(
          server.listeningOrigin,
          {
            agent: keepAliveAgent,
          },
          (response) => {
            const sockets = keepAliveAgent.sockets[socketName];
            t.assert.strictEqual(response.headers.connection, "keep-alive");
            t.assert.strictEqual(sockets[0].closed, false);

            server.close((err) => {
              if (err) {
                reject(err);
              } else {
                // Due to the nature of the way we reap these keep-alive connections,
                // there hasn't been enough time before the server fully closed in order
                // for the client to have seen the socket get destroyed. The mere fact
                // that we have reached this callback is enough indication that the
                // feature being tested works as designed.
                t.assert.strictEqual(sockets[0].closed, false);
                resolve();
              }
            });
          },
        )
        .end();

      await promise;
    });
  });
});
