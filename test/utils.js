"use strict";
const { hostname } = require("node:os");
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

    global.context = {
      privateKey: pki.privateKeyToPem(privateKey),
      publicKey: pki.publicKeyToPem(publicKey),
      certificate: pki.certificateToPem(certificate),
    };
  }
}

module.exports.buildCertificate = buildCertificate;
