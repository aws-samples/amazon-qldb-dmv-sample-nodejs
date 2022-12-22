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
var Constants_1 = require("./qldb/Constants");
var LogUtil_1 = require("./qldb/LogUtil");
var Util_1 = require("./qldb/Util");
/**
 * Query a driver's information using the given ID.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param documentId The unique ID of a document in the Person table.
 * @returns Promise which fulfills with an Ion value containing the person.
 */
function findPersonFromDocumentId(txn, documentId) {
    return __awaiter(this, void 0, void 0, function () {
        var query, personId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    query = "SELECT p.* FROM Person AS p BY pid WHERE pid = ?";
                    return [4 /*yield*/, txn.execute(query, documentId).then(function (result) {
                            var resultList = result.getResultList();
                            if (resultList.length === 0) {
                                throw new Error("Unable to find person with ID: " + documentId + ".");
                            }
                            personId = resultList[0];
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, personId];
            }
        });
    });
}
exports.findPersonFromDocumentId = findPersonFromDocumentId;
/**
 * Find the primary owner for the given VIN.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param vin The VIN to find primary owner for.
 * @returns Promise which fulfills with an Ion value containing the primary owner.
 */
function findPrimaryOwnerForVehicle(txn, vin) {
    return __awaiter(this, void 0, void 0, function () {
        var query, documentId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LogUtil_1.log("Finding primary owner for vehicle with VIN: " + vin);
                    query = "SELECT Owners.PrimaryOwner.PersonId FROM VehicleRegistration AS v WHERE v.VIN = ?";
                    documentId = undefined;
                    return [4 /*yield*/, txn.execute(query, vin).then(function (result) {
                            var resultList = result.getResultList();
                            if (resultList.length === 0) {
                                throw new Error("Unable to retrieve document ID using " + vin + ".");
                            }
                            var PersonIdValue = resultList[0].get("PersonId");
                            if (PersonIdValue === null) {
                                throw new Error("Expected field name PersonId not found.");
                            }
                            documentId = PersonIdValue.stringValue();
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, findPersonFromDocumentId(txn, documentId)];
            }
        });
    });
}
exports.findPrimaryOwnerForVehicle = findPrimaryOwnerForVehicle;
/**
 * Update the primary owner for a vehicle using the given VIN.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param vin The VIN for the vehicle to operate on.
 * @param documentId New PersonId for the primary owner.
 * @returns Promise which fulfills with void.
 */
function updateVehicleRegistration(txn, vin, documentId) {
    return __awaiter(this, void 0, void 0, function () {
        var statement;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    statement = "UPDATE VehicleRegistration AS r SET r.Owners.PrimaryOwner.PersonId = ? WHERE r.VIN = ?";
                    LogUtil_1.log("Updating the primary owner for vehicle with VIN: " + vin + "...");
                    return [4 /*yield*/, txn.execute(statement, documentId, vin).then(function (result) {
                            var resultList = result.getResultList();
                            if (resultList.length === 0) {
                                throw new Error("Unable to transfer vehicle, could not find registration.");
                            }
                            LogUtil_1.log("Successfully transferred vehicle with VIN " + vin + " to new owner.");
                            return resultList;
                        })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * Validate the current owner of the given vehicle and transfer its ownership to a new owner in a single transaction.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param vin The VIN of the vehicle to transfer ownership of.
 * @param currentOwner The GovId of the current owner of the vehicle.
 * @param newOwner The GovId of the new owner of the vehicle.
 */
function validateAndUpdateRegistration(txn, vin, currentOwner, newOwner) {
    return __awaiter(this, void 0, void 0, function () {
        var primaryOwner, govIdValue, documentId, registration;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, findPrimaryOwnerForVehicle(txn, vin)];
                case 1:
                    primaryOwner = _a.sent();
                    govIdValue = primaryOwner.get("GovId");
                    if (!(govIdValue !== null && govIdValue.stringValue() !== currentOwner)) return [3 /*break*/, 2];
                    LogUtil_1.log("Incorrect primary owner identified for vehicle, unable to transfer.");
                    return [3 /*break*/, 5];
                case 2: return [4 /*yield*/, Util_1.getDocumentId(txn, Constants_1.PERSON_TABLE_NAME, "GovId", newOwner)];
                case 3:
                    documentId = _a.sent();
                    return [4 /*yield*/, updateVehicleRegistration(txn, vin, documentId)];
                case 4:
                    registration = _a.sent();
                    LogUtil_1.log("Successfully transferred vehicle ownership!");
                    return [2 /*return*/, registration];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.validateAndUpdateRegistration = validateAndUpdateRegistration;
/**
 * Find primary owner for a particular vehicle's VIN.
 * Transfer to another primary owner for a particular vehicle's VIN.
 * @returns Promise which fulfills with void.
 */
exports.main = function () {
    return __awaiter(this, void 0, void 0, function () {
        var qldbDriver, vin_1, previousOwnerGovId_1, newPrimaryOwnerGovId_1, e_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    qldbDriver = ConnectToLedger_1.getQldbDriver();
                    vin_1 = SampleData_1.VEHICLE[0].VIN;
                    previousOwnerGovId_1 = SampleData_1.PERSON[0].GovId;
                    newPrimaryOwnerGovId_1 = SampleData_1.PERSON[1].GovId;
                    return [4 /*yield*/, qldbDriver.executeLambda(function (txn) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, validateAndUpdateRegistration(txn, vin_1, previousOwnerGovId_1, newPrimaryOwnerGovId_1)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    e_1 = _a.sent();
                    LogUtil_1.error("Unable to connect and run queries: " + e_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
};
if (require.main === module) {
    exports.main();
}
