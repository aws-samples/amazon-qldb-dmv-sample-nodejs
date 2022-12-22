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
var amazon_qldb_driver_nodejs_1 = require("amazon-qldb-driver-nodejs");
var client_qldb_1 = require("@aws-sdk/client-qldb");
var CreateLedger_1 = require("./CreateLedger");
var DeleteLedger_1 = require("./DeleteLedger");
var LogUtil_1 = require("./qldb/LogUtil");
var LEDGER_NAME = "deletion-protection-demo";
/**
 * Create a new ledger with the specified name and with deletion protection enabled.
 * @param ledgerName  Name of the ledger to be created.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a CreateLedgerResponse.
 */
function createWithDeletionProtection(ledgerName, qldbClient) {
    return __awaiter(this, void 0, void 0, function () {
        var request, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LogUtil_1.log("Creating a ledger named: " + ledgerName + "...");
                    request = {
                        Name: ledgerName,
                        PermissionsMode: "ALLOW_ALL"
                    };
                    return [4 /*yield*/, qldbClient.createLedger(request)];
                case 1:
                    result = _a.sent();
                    LogUtil_1.log("Success. Ledger state: " + result.State + ".");
                    return [2 /*return*/, result];
            }
        });
    });
}
/**
 * Update an existing ledger's deletion protection.
 * @param ledgerName Name of the ledger to update.
 * @param qldbClient The QLDB control plane client to use.
 * @param deletionProtection Enables or disables the deletion protection.
 * @returns Promise which fulfills with void.
 */
function setDeletionProtection(ledgerName, qldbClient, deletionProtection) {
    return __awaiter(this, void 0, void 0, function () {
        var request, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LogUtil_1.log("Let's set deletion protection to " + deletionProtection + " for the ledger with name " + ledgerName + ".");
                    request = {
                        Name: ledgerName,
                        DeletionProtection: deletionProtection
                    };
                    return [4 /*yield*/, qldbClient.updateLedger(request)];
                case 1:
                    result = _a.sent();
                    LogUtil_1.log("Success. Ledger updated: " + JSON.stringify(result) + ".\"");
                    return [2 /*return*/, result];
            }
        });
    });
}
exports.setDeletionProtection = setDeletionProtection;
/**
 * Demonstrate the protection of QLDB ledgers against deletion.
 * @returns Promise which fulfills with void.
 */
exports.main = function (ledgerName) {
    if (ledgerName === void 0) { ledgerName = LEDGER_NAME; }
    return __awaiter(this, void 0, void 0, function () {
        var qldbClient, updateDeletionProtectionResult, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    qldbClient = new client_qldb_1.QLDB({});
                    return [4 /*yield*/, createWithDeletionProtection(ledgerName, qldbClient)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, CreateLedger_1.waitForActive(ledgerName, qldbClient)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, DeleteLedger_1.deleteLedger(ledgerName, qldbClient)["catch"](function (error) {
                            if (amazon_qldb_driver_nodejs_1.isResourcePreconditionNotMetException(error)) {
                                LogUtil_1.log("Ledger protected against deletions!");
                            }
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, setDeletionProtection(ledgerName, qldbClient, false)];
                case 4:
                    updateDeletionProtectionResult = _a.sent();
                    return [4 /*yield*/, DeleteLedger_1.deleteLedger(ledgerName, qldbClient)];
                case 5:
                    _a.sent();
                    return [2 /*return*/, updateDeletionProtectionResult];
                case 6:
                    e_1 = _a.sent();
                    LogUtil_1.error("Unable to update or delete the ledger: " + e_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
};
if (require.main === module) {
    exports.main();
}
