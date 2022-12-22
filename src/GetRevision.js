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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var client_qldb_1 = require("@aws-sdk/client-qldb");
var ion_js_1 = require("ion-js");
var ConnectToLedger_1 = require("./ConnectToLedger");
var GetDigest_1 = require("./GetDigest");
var SampleData_1 = require("./model/SampleData");
var BlockAddress_1 = require("./qldb/BlockAddress");
var Constants_1 = require("./qldb/Constants");
var LogUtil_1 = require("./qldb/LogUtil");
var Util_1 = require("./qldb/Util");
var Verifier_1 = require("./qldb/Verifier");
/**
 * Get the revision data object for a specified document ID and block address.
 * Also returns a proof of the specified revision for verification.
 * @param ledgerName Name of the ledger containing the document to query.
 * @param documentId Unique ID for the document to be verified, contained in the committed view of the document.
 * @param blockAddress The location of the block to request.
 * @param digestTipAddress The latest block location covered by the digest.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a GetRevisionResponse.
 */
function getRevision(ledgerName, documentId, blockAddress, digestTipAddress, qldbClient) {
    return __awaiter(this, void 0, void 0, function () {
        var request, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    request = {
                        Name: ledgerName,
                        BlockAddress: blockAddress,
                        DocumentId: documentId,
                        DigestTipAddress: digestTipAddress
                    };
                    return [4 /*yield*/, qldbClient.getRevision(request)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result];
            }
        });
    });
}
/**
 * Query the table metadata for a particular vehicle for verification.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param vin VIN to query the table metadata of a specific registration with.
 * @returns Promise which fulfills with a list of Ion values that contains the results of the query.
 */
function lookupRegistrationForVin(txn, vin) {
    return __awaiter(this, void 0, void 0, function () {
        var resultList, query;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LogUtil_1.log("Querying the 'VehicleRegistration' table for VIN: " + vin + "...");
                    query = "SELECT blockAddress, metadata.id FROM _ql_committed_VehicleRegistration WHERE data.VIN = ?";
                    return [4 /*yield*/, txn.execute(query, vin).then(function (result) {
                            resultList = result.getResultList();
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, resultList];
            }
        });
    });
}
exports.lookupRegistrationForVin = lookupRegistrationForVin;
/**
 * Verify each version of the registration for the given VIN.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param ledgerName The ledger to get the digest from.
 * @param vin VIN to query the revision history of a specific registration with.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with void.
 * @throws Error: When verification fails.
 */
function verifyRegistration(txn, ledgerName, vin, qldbClient) {
    return __awaiter(this, void 0, void 0, function () {
        var digest, digestBytes, digestTipAddress, resultList, _i, resultList_1, result, blockAddress, documentId, revisionResponse, revision, documentHash, proof, verified, alteredDocumentHash;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LogUtil_1.log("Let's verify the registration with VIN = " + vin + ", in ledger = " + ledgerName + ".");
                    return [4 /*yield*/, GetDigest_1.getDigestResult(ledgerName, qldbClient)];
                case 1:
                    digest = _a.sent();
                    digestBytes = digest.Digest;
                    digestTipAddress = digest.DigestTipAddress;
                    LogUtil_1.log("Got a ledger digest: digest tip address = \n" + Util_1.valueHolderToString(digestTipAddress) + ",\n        digest = \n" + ion_js_1.toBase64(digestBytes) + ".");
                    LogUtil_1.log("Querying the registration with VIN = " + vin + " to verify each version of the registration...");
                    return [4 /*yield*/, lookupRegistrationForVin(txn, vin)];
                case 2:
                    resultList = _a.sent();
                    LogUtil_1.log("Getting a proof for the document.");
                    _i = 0, resultList_1 = resultList;
                    _a.label = 3;
                case 3:
                    if (!(_i < resultList_1.length)) return [3 /*break*/, 6];
                    result = resultList_1[_i];
                    blockAddress = BlockAddress_1.blockAddressToValueHolder(result);
                    documentId = BlockAddress_1.getMetadataId(result);
                    return [4 /*yield*/, getRevision(ledgerName, documentId, blockAddress, digestTipAddress, qldbClient)];
                case 4:
                    revisionResponse = _a.sent();
                    revision = ion_js_1.dom.load(revisionResponse.Revision.IonText);
                    documentHash = Util_1.getBlobValue(revision, "hash");
                    proof = revisionResponse.Proof;
                    LogUtil_1.log("Got back a proof: " + Util_1.valueHolderToString(proof) + ".");
                    verified = Verifier_1.verifyDocument(documentHash, digestBytes, proof);
                    if (!verified) {
                        throw new Error("Document revision is not verified.");
                    }
                    else {
                        LogUtil_1.log("Success! The document is verified.");
                    }
                    alteredDocumentHash = Verifier_1.flipRandomBit(documentHash);
                    LogUtil_1.log("Flipping one bit in the document's hash and assert that the document is NOT verified.\n            The altered document hash is: " + ion_js_1.toBase64(alteredDocumentHash));
                    verified = Verifier_1.verifyDocument(alteredDocumentHash, digestBytes, proof);
                    if (verified) {
                        throw new Error("Expected altered document hash to not be verified against digest.");
                    }
                    else {
                        LogUtil_1.log("Success! As expected flipping a bit in the document hash causes verification to fail.");
                    }
                    LogUtil_1.log("Finished verifying the registration with VIN = " + vin + " in ledger = " + ledgerName + ".");
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.verifyRegistration = verifyRegistration;
/**
 * Verify the integrity of a document revision in a QLDB ledger.
 * @returns Promise which fulfills with void.
 */
exports.main = function () {
    return __awaiter(this, void 0, void 0, function () {
        var qldbClient_1, qldbDriver, registration, vin_1, e_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    qldbClient_1 = new client_qldb_1.QLDB({});
                    qldbDriver = ConnectToLedger_1.getQldbDriver();
                    registration = SampleData_1.VEHICLE_REGISTRATION[0];
                    vin_1 = registration.VIN;
                    return [4 /*yield*/, qldbDriver.executeLambda(function (txn) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, verifyRegistration(txn, Constants_1.LEDGER_NAME, vin_1, qldbClient_1)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    LogUtil_1.error("Unable to verify revision: " + e_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
};
if (require.main === module) {
    exports.main();
}
