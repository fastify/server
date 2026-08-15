"use strict";
const { hostname } = require("node:os");
const { lookup } = require("node:dns");
const { pki } = require("node-forge");

function buildCertificate() {
  if (!global.context?.certificate || !global.context?.privateKey) {
    const now = new Date();
    const { publicKey, privateKey } = pki.rsa.generateKeyPair(2048);
    const certificate = pki.createCertificate();
    certificate.publicKey = publicKey;
    certificate.serialNumber = "01";
    certificate.validity.notBefore = now;
    certificate.validity.notAfter = new Date(Number(now) + 86400000);
    const attrs = [
      { shortName: "CN", value: hostname() },
      { shortName: "C", value: "US" },
      { shortName: "ST", value: "California" },
      { shortName: "L", value: "San Francisco" },
      { shortName: "O", value: "Fastify" },
      { shortName: "OU", value: "Development Team" },
    ];
    certificate.setSubject(attrs);
    certificate.setIssuer(attrs);

    certificate.sign(privateKey);

    global.context ??= {};
    global.context.privateKey = pki.privateKeyToPem(privateKey);
    global.context.publicKey = pki.publicKeyToPem(publicKey);
    global.context.certificate = pki.certificateToPem(certificate);
  }
}

// same system do not enable IPv6 or do not return IPv6 for localhost
// even when we specified `{ all: true }`.
// we need the localhost count for those system to ensure test assert
// correctly.
function localhostCount(_, done) {
  if (!global.context?.localhostCount) {
    lookup("localhost", { all: true }, (error, addresses) => {
      if (error) {
        done(error);
      } else {
        global.context ??= {};
        global.context.localhostCount = addresses.length;
        done();
      }
    });
  }
}

module.exports.localhostCount = localhostCount;
module.exports.buildCertificate = buildCertificate;
