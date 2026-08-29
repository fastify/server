import type { AddressInfo } from "node:net";
import type { kInternalServers, kRaw, kState } from "../lib/symbols";
import type {
  CustomServerOptions,
  HTTP2RequestListener,
  HTTP2SecureRequestListener,
  HTTP2SecureServer,
  HTTP2SecureServerOptions,
  HTTP2Server,
  HTTP2ServerOptions,
  HTTPRequestListener,
  HTTPServer,
  HTTPServerOptions,
  HTTPSRequestListener,
  HTTPSServer,
  HTTPSServerOptions,
  RequestListener,
} from "./server";

export interface ServerState {
  listen: boolean;
  listening: boolean;
  closed: boolean;
  closing: boolean;
  error: boolean;
  aborted: boolean;
}

interface ProxyProperties<T> {
  [kRaw]: T;
  [kState]: ServerState;
  [kInternalServers]: Array<T>;
  addresses: () => Array<string | AddressInfo>;
}

export type ProxyHTTPServer = HTTPServer & ProxyProperties<HTTPServer>;
export type ProxyHTTPSServer = HTTPSServer & ProxyProperties<HTTPSServer>;
export type ProxyHTTP2Server = HTTP2Server & ProxyProperties<HTTP2Server>;
export type ProxyHTTP2SecureServer = HTTP2SecureServer &
  ProxyProperties<HTTP2SecureServer>;
export type ProxyServer =
  | ProxyHTTPServer
  | ProxyHTTPSServer
  | ProxyHTTP2Server
  | ProxyHTTP2SecureServer;

export function createServer<T extends CustomServerOptions>(
  options: T,
  requestListener: RequestListener,
): ProxyHTTP2SecureServer;
export function createServer<T extends HTTP2SecureServerOptions>(
  options: T,
  requestListener: HTTP2SecureRequestListener,
): ProxyHTTP2SecureServer;
export function createServer<T extends HTTP2ServerOptions>(
  options: T,
  requestListener: HTTP2RequestListener,
): ProxyHTTP2Server;
export function createServer<T extends HTTPSServerOptions>(
  options: T,
  requestListener: HTTPSRequestListener,
): ProxyHTTPSServer;
export function createServer<T extends HTTPServerOptions>(
  options: T,
  requestListener: HTTPRequestListener,
): ProxyHTTPServer;
