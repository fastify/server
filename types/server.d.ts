import type {
  Server as NodeHTTPServer,
  ServerOptions as NodeHTTPServerOptions,
  RequestListener as NodeRequestListener,
} from "node:http";
import type {
  Http2SecureServer as NodeHTTP2SecureServer,
  SecureServerOptions as NodeHTTP2SecureServerOptions,
  Http2Server as NodeHTTP2Server,
  ServerOptions as NodeHTTP2ServerOptions,
} from "node:http2";
import type {
  Server as NodeHTTPSServer,
  ServerOptions as NodeHTTPSServerOptions,
} from "node:https";

interface CommonServerOptions {
  /** @default 72000 */
  keepAliveTimeout?: number;
  /** @default 0 */
  connectionTimeout?: number;
  /** @default 0 */
  maxRequestsPerSocket?: number;
  /** @default 0 */
  requestTimeout?: number;
}

export interface HTTPServerOptions extends CommonServerOptions {
  http?: true | NodeHTTPServerOptions;
  https?: false;
  http2?: false;
}
export type HTTPRequestListener = NodeRequestListener;
export type HTTPServer = NodeHTTPServer;

export interface HTTPSServerOptions extends CommonServerOptions {
  http?: false;
  https: true | NodeHTTPSServerOptions;
  http2?: false;
}
export type HTTPSRequestListener = NodeRequestListener;
export type HTTPSServer = NodeHTTPSServer;

export interface HTTP2ServerOptions extends CommonServerOptions {
  http?: NodeHTTP2ServerOptions;
  https?: false;
  http2: true;
}
export type HTTP2RequestListener = NodeRequestListener;
export type HTTP2Server = NodeHTTP2Server;

export interface HTTP2SecureServerOptions extends CommonServerOptions {
  http?: false;
  https: NodeHTTP2SecureServerOptions;
  http2: true;
}
export type HTTP2SecureRequestListener = NodeRequestListener;
export type HTTP2SecureServer = NodeHTTP2SecureServer;

export interface CustomServerOptions extends CommonServerOptions {
  serverFactory: (
    requestListener: RequestListener,
    options: ServerOptions,
  ) => Server;
}

export type ServerOptions =
  | HTTPServerOptions
  | HTTPSServerOptions
  | HTTP2ServerOptions
  | HTTP2SecureServerOptions
  | CustomServerOptions;
export type RequestListener =
  | HTTPRequestListener
  | HTTPSRequestListener
  | HTTP2RequestListener
  | HTTP2SecureRequestListener;
export type Server = HTTPServer | HTTPSServer | HTTP2Server | HTTP2SecureServer;
