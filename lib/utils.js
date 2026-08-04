function normalizeCallback(callback) {
  if (typeof callback !== "function") {
    // promise chain should only happen on return
    // internal API should always use callback
    // to minimize the event cycle
    const { promise, resolve, reject } = withResolvers()
    function callback(error, data) {
      if (error) {
        reject(error)
      } else {
        resolve(data)
      }
    }
    callback.promise = promise
    return callback
  } else {
    return callback
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

module.exports = {
  normalizeCallback,
  withResolvers,
};
