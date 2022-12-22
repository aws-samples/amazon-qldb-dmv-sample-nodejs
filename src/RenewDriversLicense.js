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
var ConnectToLedger_1 = require("./ConnectToLedger");
var SampleData_1 = require("./model/SampleData");
var LogUtil_1 = require("./qldb/LogUtil");
var ScanTable_1 = require("./ScanTable");
/**
 * Get the PersonId of a driver's license using the given license number.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param licenseNumber License number of the driver's license to query.
 * @returns Promise which fulfills with a PersonId as a string.
 */
function getPersonIdFromLicenseNumber(txn, licenseNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var query, personId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    query = "SELECT PersonId FROM DriversLicense WHERE LicenseNumber = ?";
                    return [4 /*yield*/, txn.execute(query, licenseNumber).then(function (result) {
                            var resultList = result.getResultList();
                            if (resultList.length === 0) {
                                throw new Error("Unable to find person with ID: " + licenseNumber + ".");
                            }
                            var PersonIdValue = resultList[0].get("PersonId");
                            if (PersonIdValue === null) {
                                throw new Error("Expected field name PersonId not found.");
                            }
                            personId = PersonIdValue.stringValue();
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, personId];
            }
        });
    });
}
/**
 * Renew the ValidToDate and ValidFromDate of a driver's license.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param validFromDate The new ValidFromDate.
 * @param validToDate The new ValidToDate.
 * @param licenseNumber License number of the driver's license to update.
 * @returns Promise which fulfills with {@linkcode Result} object.
 */
function renewDriversLicense(txn, validFromDate, validToDate, licenseNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var statement;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    statement = "UPDATE DriversLicense AS d SET d.ValidFromDate = ?, d.ValidToDate = ? WHERE d.LicenseNumber = ?";
                    return [4 /*yield*/, txn.execute(statement, validFromDate, validToDate, licenseNumber).then(function (result) {
                            LogUtil_1.log("DriversLicense Document IDs which had licenses renewed: ");
                            ScanTable_1.prettyPrintResultList(result.getResultList());
                            return result;
                        })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.renewDriversLicense = renewDriversLicense;
/**
 *  Verify whether a driver exists in the system using the given license number.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param personId The unique personId of a driver.
 * @returns Promise which fulfills with a boolean.
 */
function verifyDriverFromLicenseNumber(txn, personId) {
    return __awaiter(this, void 0, void 0, function () {
        var query;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LogUtil_1.log("Finding person with person ID: " + personId);
                    query = "SELECT p.* FROM Person AS p BY pid WHERE pid = ?";
                    return [4 /*yield*/, txn.execute(query, personId).then(function (result) {
                            var resultList = result.getResultList();
                            if (resultList.length === 0) {
                                LogUtil_1.log("Unable to find person with ID: " + personId);
                                return false;
                            }
                            return true;
                        })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * Find the person associated with a license number.
 * Renew a driver's license.
 * @returns Promise which fulfills with void.
 */
exports.main = function () {
    return __awaiter(this, void 0, void 0, function () {
        var qldbDriver, fromDate_1, toDate_1, licenseNumber_1, e_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    qldbDriver = ConnectToLedger_1.getQldbDriver();
                    fromDate_1 = new Date("2019-04-19");
                    toDate_1 = new Date("2023-04-19");
                    licenseNumber_1 = SampleData_1.DRIVERS_LICENSE[0].LicenseNumber;
                    return [4 /*yield*/, qldbDriver.executeLambda(function (txn) { return __awaiter(_this, void 0, void 0, function () {
                            var personId, license;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, getPersonIdFromLicenseNumber(txn, licenseNumber_1)];
                                    case 1:
                                        personId = _a.sent();
                                        return [4 /*yield*/, verifyDriverFromLicenseNumber(txn, personId)];
                                    case 2:
                                        if (!_a.sent()) return [3 /*break*/, 4];
                                        return [4 /*yield*/, renewDriversLicense(txn, fromDate_1, toDate_1, licenseNumber_1)];
                                    case 3:
                                        license = _a.sent();
                                        return [2 /*return*/, license.getResultList()];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    e_1 = _a.sent();
                    LogUtil_1.error("Unable to renew drivers license: " + e_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
};
if (require.main === module) {
    exports.main();
}
