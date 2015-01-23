// Imports

var crypto = require('crypto');
var ursa = require('ursa');
var fs = require('fs');

var privatePem = fs.readFileSync('./examples/simple-lighting/key.pem');
var publicPem = fs.readFileSync('./examples/simple-lighting/cert.pem');

// Signature Verification

var signer = crypto.createSign('sha512');

signer.update("Hi");

var sign = signer.sign(privatePem, 'base64');

var verifier = crypto.createVerify('sha512');

verifier.update("Hi");

console.log(verifier.verify(publicPem, sign, 'base64'));

// Encryption/Decryption

var privateKey = ursa.createPrivateKey(privatePem);
var publicKey = ursa.createPublicKey(publicPem);

msg = publicKey.encrypt("Hi", 'utf8', 'base64');
msg = privateKey.decrypt(msg, 'base64', 'utf8');

console.log(msg);
