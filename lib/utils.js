function normalizeCallback(callback) {
  if (typeof callback !== "function") {
    // promise chain should only happen on return
    // internal API should always use callback
    // to minimize the event cycle
    const { promise, resolve, reject } = withResolvers();
    function pCallback(error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    }
    pCallback.promise = promise;
    return pCallback;
  } else {
    return callback;
  }
}

// TODO(20.x): remove when node@20 is not supported
function withResolvers() {
  let res, rej;
  const promise = new Promise((resolve, reject) => {
    res = resolve;
    rej = reject;
  });
  return { promise, resolve: res, reject: rej };
}

function listeningOrigin(server, options) {
  const address = server.address();
  if (typeof address === "string") return address;
  const host =
    address.family === "IPv6" ? `[${address.address}]` : address.address;
  return `${options.https ? "https" : "http"}://${host}:${address.port}`;
}

function stateClose(state, internalServers) {
  state.listen = false;
  state.listening = false;
  state.closed = true;
  state.closing = false;
  state.error = false;
  state.aborted = false;
  internalServers.length = 0;
}

module.exports = {
  normalizeCallback,
  withResolvers,
  listeningOrigin,
  stateClose,
};
