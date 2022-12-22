"use strict";
/*
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
exports.__esModule = true;
var crypto_1 = require("crypto");
var ion_js_1 = require("ion-js");
var Util_1 = require("./Util");
var HASH_LENGTH = 32;
var UPPER_BOUND = 8;
/**
 * Build the candidate digest representing the entire ledger from the Proof hashes.
 * @param proof The Proof object.
 * @param leafHash The revision hash to pair with the first hash in the Proof hashes list.
 * @returns The calculated root hash.
 */
function buildCandidateDigest(proof, leafHash) {
    var parsedProof = parseProof(proof);
    var rootHash = calculateRootHashFromInternalHash(parsedProof, leafHash);
    return rootHash;
}
/**
 * Combine the internal hashes and the leaf hash until only one root hash remains.
 * @param internalHashes An array of hash values.
 * @param leafHash The revision hash to pair with the first hash in the Proof hashes list.
 * @returns The root hash constructed by combining internal hashes.
 */
function calculateRootHashFromInternalHash(internalHashes, leafHash) {
    var rootHash = internalHashes.reduce(joinHashesPairwise, leafHash);
    return rootHash;
}
/**
 * Compare two hash values by converting each Uint8Array byte, which is unsigned by default,
 * into a signed byte, assuming they are little endian.
 * @param hash1 The hash value to compare.
 * @param hash2 The hash value to compare.
 * @returns Zero if the hash values are equal, otherwise return the difference of the first pair of non-matching bytes.
 */
function compareHashValues(hash1, hash2) {
    if (hash1.length !== HASH_LENGTH || hash2.length !== HASH_LENGTH) {
        throw new Error("Invalid hash.");
    }
    for (var i = hash1.length - 1; i >= 0; i--) {
        var difference = (hash1[i] << 24 >> 24) - (hash2[i] << 24 >> 24);
        if (difference !== 0) {
            return difference;
        }
    }
    return 0;
}
/**
 * Helper method that concatenates two Uint8Array.
 * @param arrays List of array to concatenate, in the order provided.
 * @returns The concatenated array.
 */
function concatenate() {
    var arrays = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        arrays[_i] = arguments[_i];
    }
    var totalLength = 0;
    for (var _a = 0, arrays_1 = arrays; _a < arrays_1.length; _a++) {
        var arr = arrays_1[_a];
        totalLength += arr.length;
    }
    var result = new Uint8Array(totalLength);
    var offset = 0;
    for (var _b = 0, arrays_2 = arrays; _b < arrays_2.length; _b++) {
        var arr = arrays_2[_b];
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}
/**
 * Flip a single random bit in the given hash value.
 * This method is intended to be used for purpose of demonstrating the QLDB verification features only.
 * @param original The hash value to alter.
 * @returns The altered hash with a single random bit changed.
 */
function flipRandomBit(original) {
    if (original.length === 0) {
        throw new Error("Array cannot be empty!");
    }
    var bytePos = Math.floor(Math.random() * original.length);
    var bitShift = Math.floor(Math.random() * UPPER_BOUND);
    var alteredHash = original;
    alteredHash[bytePos] = alteredHash[bytePos] ^ (1 << bitShift);
    return alteredHash;
}
exports.flipRandomBit = flipRandomBit;
/**
 * Take two hash values, sort them, concatenate them, and generate a new hash value from the concatenated values.
 * @param h1 Byte array containing one of the hashes to compare.
 * @param h2 Byte array containing one of the hashes to compare.
 * @returns The concatenated array of hashes.
 */
function joinHashesPairwise(h1, h2) {
    if (h1.length === 0) {
        return h2;
    }
    if (h2.length === 0) {
        return h1;
    }
    var concat;
    if (compareHashValues(h1, h2) < 0) {
        concat = concatenate(h1, h2);
    }
    else {
        concat = concatenate(h2, h1);
    }
    var hash = crypto_1.createHash('sha256');
    hash.update(concat);
    var newDigest = hash.digest();
    return newDigest;
}
exports.joinHashesPairwise = joinHashesPairwise;
/**
 * Parse the Block object returned by QLDB and retrieve block hash.
 * @param valueHolder A structure containing an Ion string value.
 * @returns The block hash.
 */
function parseBlock(valueHolder) {
    var block = ion_js_1.dom.load(valueHolder.IonText);
    var blockHash = Util_1.getBlobValue(block, "blockHash");
    return blockHash;
}
exports.parseBlock = parseBlock;
/**
 * Parse the Proof object returned by QLDB into an iterator.
 * The Proof object returned by QLDB is a dictionary like the following:
 * {'IonText': '[{{<hash>}},{{<hash>}}]'}
 * @param valueHolder A structure containing an Ion string value.
 * @returns A list of hash values.
 */
function parseProof(valueHolder) {
    var proofs = ion_js_1.dom.load(valueHolder.IonText);
    return proofs.elements().map(function (proof) { return proof.uInt8ArrayValue(); });
}
/**
 *  Verify document revision against the provided digest.
 * @param documentHash The SHA-256 value representing the document revision to be verified.
 * @param digest The SHA-256 hash value representing the ledger digest.
 * @param proof The Proof object retrieved from GetRevision.getRevision.
 * @returns If the document revision verifies against the ledger digest.
 */
function verifyDocument(documentHash, digest, proof) {
    var candidateDigest = buildCandidateDigest(proof, documentHash);
    return (ion_js_1.toBase64(digest) === ion_js_1.toBase64(candidateDigest));
}
exports.verifyDocument = verifyDocument;
