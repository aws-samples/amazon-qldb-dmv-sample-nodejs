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
var GetRevision_1 = require("./GetRevision");
var SampleData_1 = require("./model/SampleData");
var BlockAddress_1 = require("./qldb/BlockAddress");
var Constants_1 = require("./qldb/Constants");
var LogUtil_1 = require("./qldb/LogUtil");
var Util_1 = require("./qldb/Util");
var Verifier_1 = require("./qldb/Verifier");
/**
 * Get the block of a ledger's journal.
 * @param ledgerName Name of the ledger to operate on.
 * @param blockAddress The location of the block to request.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a GetBlockResponse.
 */
function getBlock(ledgerName, blockAddress, qldbClient) {
    return __awaiter(this, void 0, void 0, function () {
        var request, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LogUtil_1.log("Let's get the block for block address \n" + Util_1.valueHolderToString(blockAddress) + " \nof the ledger " +
                        ("named " + ledgerName + "."));
                    request = {
                        Name: ledgerName,
                        BlockAddress: blockAddress
                    };
                    return [4 /*yield*/, qldbClient.getBlock(request)];
                case 1:
                    result = _a.sent();
                    LogUtil_1.log("Success. GetBlock: \n" + Util_1.blockResponseToString(result) + ".");
                    return [2 /*return*/, result];
            }
        });
    });
}
/**
 * Get the block of a ledger's journal. Also returns a proof of the block for verification.
 * @param ledgerName Name of the ledger to operate on.
 * @param blockAddress The location of the block to request.
 * @param digestTipAddress The location of the digest tip.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a GetBlockResponse.
 */
function getBlockWithProof(ledgerName, blockAddress, digestTipAddress, qldbClient) {
    return __awaiter(this, void 0, void 0, function () {
        var request, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LogUtil_1.log("Let's get the block for block address \n" + Util_1.valueHolderToString(blockAddress) + ", \ndigest tip address:\n        " + Util_1.valueHolderToString(digestTipAddress) + " \nof the ledger named " + ledgerName + ".");
                    request = {
                        Name: ledgerName,
                        BlockAddress: blockAddress,
                        DigestTipAddress: digestTipAddress
                    };
                    return [4 /*yield*/, qldbClient.getBlock(request)];
                case 1:
                    result = _a.sent();
                    LogUtil_1.log("Success. GetBlock: \n" + Util_1.blockResponseToString(result) + ".");
                    return [2 /*return*/, result];
            }
        });
    });
}
/**
 * Verify block by validating the proof returned in the getBlock response.
 * @param ledgerName The ledger to get the digest from.
 * @param blockAddress The address of the block to verify.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with void.
 * @throws Error: When verification fails.
 */
function verifyBlock(ledgerName, blockAddress, qldbClient) {
    return __awaiter(this, void 0, void 0, function () {
        var digestCommandInput, digestResult, digestBytes, digestTipAddress, getBlockResult, block, blockHash, verified, alteredDigest, alteredBlockHash, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LogUtil_1.log("Let's verify blocks for ledger with name = " + ledgerName + ".");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    LogUtil_1.log("First, let's get a digest.");
                    digestCommandInput = { Name: ledgerName };
                    return [4 /*yield*/, qldbClient.send(new client_qldb_1.GetDigestCommand(digestCommandInput))];
                case 2:
                    digestResult = _a.sent();
                    digestBytes = digestResult.Digest;
                    digestTipAddress = digestResult.DigestTipAddress;
                    LogUtil_1.log("Got a ledger digest. Digest end address = \n" + Util_1.valueHolderToString(digestTipAddress) + ", " +
                        ("\ndigest = " + ion_js_1.toBase64(digestBytes) + "."));
                    return [4 /*yield*/, getBlockWithProof(ledgerName, blockAddress, digestTipAddress, qldbClient)];
                case 3:
                    getBlockResult = _a.sent();
                    block = getBlockResult.Block;
                    blockHash = Verifier_1.parseBlock(block);
                    verified = Verifier_1.verifyDocument(blockHash, digestBytes, getBlockResult.Proof);
                    if (!verified) {
                        throw new Error("Block is not verified!");
                    }
                    else {
                        LogUtil_1.log("Success! The block is verified!");
                    }
                    alteredDigest = Verifier_1.flipRandomBit(digestBytes);
                    LogUtil_1.log("Let's try flipping one bit in the digest and assert that the block is NOT verified.\n            The altered digest is: " + ion_js_1.toBase64(alteredDigest) + ".");
                    verified = Verifier_1.verifyDocument(blockHash, alteredDigest, getBlockResult.Proof);
                    if (verified) {
                        throw new Error("Expected block to not be verified against altered digest.");
                    }
                    else {
                        LogUtil_1.log("Success! As expected flipping a bit in the digest causes verification to fail.");
                    }
                    alteredBlockHash = Verifier_1.flipRandomBit(blockHash);
                    LogUtil_1.log("Let's try flipping one bit in the block's hash and assert that the block is NOT verified.\n            The altered block hash is: " + ion_js_1.toBase64(alteredBlockHash) + ".");
                    verified = Verifier_1.verifyDocument(alteredBlockHash, digestBytes, getBlockResult.Proof);
                    if (verified) {
                        throw new Error("Expected altered block hash to not be verified against digest.");
                    }
                    else {
                        LogUtil_1.log("Success! As expected flipping a bit in the block hash causes verification to fail.");
                    }
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _a.sent();
                    LogUtil_1.log("Failed to verify blocks in the ledger with name = " + ledgerName + ".");
                    throw e_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.verifyBlock = verifyBlock;
/**
 * Get a journal block from a QLDB ledger.
 * After getting the block, we get the digest of the ledger and validate the proof returned in the getBlock response.
 * @returns Promise which fulfills with void.
 */
exports.main = function () {
    return __awaiter(this, void 0, void 0, function () {
        var qldbClient_1, qldbDriver, registration, vin_1, e_2;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    qldbClient_1 = new client_qldb_1.QLDB({});
                    qldbDriver = ConnectToLedger_1.getQldbDriver();
                    registration = SampleData_1.VEHICLE_REGISTRATION[1];
                    vin_1 = registration.VIN;
                    return [4 /*yield*/, qldbDriver.executeLambda(function (txn) { return __awaiter(_this, void 0, void 0, function () {
                            var registrations, _i, registrations_1, registration_1, blockAddress;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, GetRevision_1.lookupRegistrationForVin(txn, vin_1)];
                                    case 1:
                                        registrations = _a.sent();
                                        _i = 0, registrations_1 = registrations;
                                        _a.label = 2;
                                    case 2:
                                        if (!(_i < registrations_1.length)) return [3 /*break*/, 5];
                                        registration_1 = registrations_1[_i];
                                        blockAddress = BlockAddress_1.blockAddressToValueHolder(registration_1);
                                        return [4 /*yield*/, verifyBlock(Constants_1.LEDGER_NAME, blockAddress, qldbClient_1)];
                                    case 3:
                                        _a.sent();
                                        _a.label = 4;
                                    case 4:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_2 = _a.sent();
                    LogUtil_1.error("Unable to query vehicle registration by Vin: " + e_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
};
if (require.main === module) {
    exports.main();
}
