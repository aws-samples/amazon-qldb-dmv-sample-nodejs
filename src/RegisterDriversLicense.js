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
var InsertDocument_1 = require("./InsertDocument");
var Constants_1 = require("./qldb/Constants");
var LogUtil_1 = require("./qldb/LogUtil");
var Util_1 = require("./qldb/Util");
/**
 * Verify whether a driver already exists in the database.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param govId The government ID of the new owner.
 * @returns Promise which fulfills with a boolean.
 */
function personAlreadyExists(txn, govId) {
    return __awaiter(this, void 0, void 0, function () {
        var query, personAlreadyExists;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    query = "SELECT * FROM Person AS p WHERE p.GovId = ?";
                    personAlreadyExists = true;
                    return [4 /*yield*/, txn.execute(query, govId).then(function (result) {
                            var resultList = result.getResultList();
                            if (resultList.length === 0) {
                                personAlreadyExists = false;
                            }
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, personAlreadyExists];
            }
        });
    });
}
/**
 * Query drivers license table by person ID.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param personId The person ID to check.
 * @returns Promise which fulfills with a {@linkcode Result} object.
 */
function lookUpDriversLicenseForPerson(txn, personId) {
    return __awaiter(this, void 0, void 0, function () {
        var query, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    query = "SELECT * FROM DriversLicense AS d WHERE d.PersonId = ?";
                    return [4 /*yield*/, txn.execute(query, personId)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result];
            }
        });
    });
}
exports.lookUpDriversLicenseForPerson = lookUpDriversLicenseForPerson;
/**
 * Verify whether a driver has a driver's license in the database.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param personId The unique personId of the new owner.
 * @returns Promise which fulfills with a boolean.
 */
function personHasDriversLicense(txn, personId) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, lookUpDriversLicenseForPerson(txn, personId)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.getResultList().length !== 0];
            }
        });
    });
}
/**
 * Register a new driver in the QLDB database.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param driver The new driver to register.
 * @returns Promise which fulfills with a {@linkcode Result} object.
 */
function registerNewDriver(txn, driver) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, InsertDocument_1.insertDocument(txn, Constants_1.PERSON_TABLE_NAME, driver)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result];
            }
        });
    });
}
/**
 * Register a new driver and a new driver's license in a single transaction.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param license The driver's license to register.
 * @param personId The unique personId of the new owner.
 * @returns Promise which fulfills with void.
 */
function registerNewDriversLicense(txn, license, personId) {
    return __awaiter(this, void 0, void 0, function () {
        var statement;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, personHasDriversLicense(txn, personId)];
                case 1:
                    if (_a.sent()) {
                        LogUtil_1.log("Person already has a license! No new license added.");
                        return [2 /*return*/];
                    }
                    statement = "INSERT INTO DriversLicense ?";
                    return [4 /*yield*/, txn.execute(statement, license).then(function (result) {
                            LogUtil_1.log("Successfully registered new license.");
                            return result.getResultList();
                        })];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * Register a new driver's license.
 * @returns Promise which fulfills with void.
 */
exports.main = function () {
    return __awaiter(this, void 0, void 0, function () {
        var qldbDriver, documentId_1, newPerson_1, newLicense_1, e_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    qldbDriver = ConnectToLedger_1.getQldbDriver();
                    newPerson_1 = {
                        FirstName: "Kate",
                        LastName: "Mulberry",
                        Address: "22 Commercial Drive, Blaine, WA, 97722",
                        DOB: new Date("1995-02-09"),
                        GovId: "AQQ17B2342",
                        GovIdType: "Passport"
                    };
                    newLicense_1 = {
                        PersonId: "",
                        LicenseNumber: "112 360 PXJ",
                        LicenseType: "Full",
                        ValidFromDate: new Date("2018-06-30"),
                        ValidToDate: new Date("2022-10-30")
                    };
                    return [4 /*yield*/, qldbDriver.executeLambda(function (txn) { return __awaiter(_this, void 0, void 0, function () {
                            var documentIdResult;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, personAlreadyExists(txn, newPerson_1.GovId)];
                                    case 1:
                                        if (!_a.sent()) return [3 /*break*/, 3];
                                        LogUtil_1.log("Person with this GovId already exists.");
                                        return [4 /*yield*/, Util_1.getDocumentId(txn, Constants_1.PERSON_TABLE_NAME, "GovId", newPerson_1.GovId)];
                                    case 2:
                                        documentId_1 = _a.sent();
                                        return [3 /*break*/, 5];
                                    case 3: return [4 /*yield*/, registerNewDriver(txn, newPerson_1)];
                                    case 4:
                                        documentIdResult = _a.sent();
                                        documentId_1 = documentIdResult.getResultList()[0].get("documentId").stringValue();
                                        _a.label = 5;
                                    case 5:
                                        newLicense_1.PersonId = documentId_1;
                                        return [4 /*yield*/, registerNewDriversLicense(txn, newLicense_1, documentId_1)];
                                    case 6: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    e_1 = _a.sent();
                    LogUtil_1.error("Unable to register drivers license: " + e_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
};
if (require.main === module) {
    exports.main();
}
