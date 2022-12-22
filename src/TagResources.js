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
var CreateLedger_1 = require("./CreateLedger");
var DeleteLedger_1 = require("./DeleteLedger");
var DeletionProtection_1 = require("./DeletionProtection");
var Constants_1 = require("./qldb/Constants");
var LogUtil_1 = require("./qldb/LogUtil");
var ADD_TAGS = {
    Domain: 'Prod'
};
var CREATE_TAGS = {
    IsTest: 'true',
    Domain: 'Test'
};
var REMOVE_TAGS = ['IsTest'];
/**
 * Create a ledger with the specified name and the given tags.
 * @param ledgerName Name of the ledger to be created.
 * @param tags The map of key-value pairs to create the ledger with.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a CreateLedgerResponse.
 */
function createWithTags(ledgerName, tags, qldbClient) {
    return __awaiter(this, void 0, void 0, function () {
        var request, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LogUtil_1.log("Creating ledger with name: " + ledgerName + ".");
                    request = {
                        Name: ledgerName,
                        Tags: tags,
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
 * Return all tags for a specified Amazon QLDB resource.
 * @param resourceArn The Amazon Resource Name (ARN) for which to list tags off.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a ListTagsForResourceResponse.
 */
function listTags(resourceArn, qldbClient) {
    return __awaiter(this, void 0, void 0, function () {
        var request, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LogUtil_1.log("Listing the tags for resource with arn: " + resourceArn + ".");
                    request = {
                        ResourceArn: resourceArn
                    };
                    return [4 /*yield*/, qldbClient.listTagsForResource(request)];
                case 1:
                    result = _a.sent();
                    LogUtil_1.log("Success. Tags: " + JSON.stringify(result.Tags));
                    return [2 /*return*/, result];
            }
        });
    });
}
exports.listTags = listTags;
/**
 * Add one or more tags to the specified QLDB resource.
 * @param resourceArn The Amazon Resource Name (ARN) of the ledger to which to add tags.
 * @param tags The map of key-value pairs to add to a ledger.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with void.
 */
function tagResource(resourceArn, tags, qldbClient) {
    return __awaiter(this, void 0, void 0, function () {
        var request;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LogUtil_1.log("Adding tags " + JSON.stringify(tags) + " for resource with arn: " + resourceArn + ".");
                    request = {
                        ResourceArn: resourceArn,
                        Tags: tags
                    };
                    return [4 /*yield*/, qldbClient.tagResource(request)];
                case 1:
                    _a.sent();
                    LogUtil_1.log("Successfully added tags.");
                    return [2 /*return*/];
            }
        });
    });
}
exports.tagResource = tagResource;
/**
 * Remove one or more tags from the specified QLDB resource.
 * @param resourceArn The Amazon Resource Name (ARN) from which to remove tags.
 * @param tagsKeys The list of tag keys to remove.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with void.
 */
function untagResource(resourceArn, tagsKeys, qldbClient) {
    return __awaiter(this, void 0, void 0, function () {
        var request;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LogUtil_1.log("Removing tags " + JSON.stringify(tagsKeys) + " for resource with arn: " + resourceArn + ".");
                    request = {
                        ResourceArn: resourceArn,
                        TagKeys: tagsKeys
                    };
                    return [4 /*yield*/, qldbClient.untagResource(request)];
                case 1:
                    _a.sent();
                    LogUtil_1.log("Successfully removed tags.");
                    return [2 /*return*/];
            }
        });
    });
}
exports.untagResource = untagResource;
/**
 * Tagging and un-tagging resources, including tag on create.
 * @returns Promise which fulfills with void.
 */
exports.main = function () {
    return __awaiter(this, void 0, void 0, function () {
        var qldbClient, tags, result, arn, _a, _b, _c, _d, _e, _f, e_1;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    qldbClient = new client_qldb_1.QLDB({});
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 8, 9, 14]);
                    tags = [];
                    return [4 /*yield*/, createWithTags(Constants_1.LEDGER_NAME_WITH_TAGS, CREATE_TAGS, qldbClient)];
                case 2:
                    result = _g.sent();
                    arn = result.Arn;
                    _b = (_a = tags).push;
                    return [4 /*yield*/, listTags(arn, qldbClient)];
                case 3:
                    _b.apply(_a, [(_g.sent()).Tags]);
                    return [4 /*yield*/, tagResource(arn, ADD_TAGS, qldbClient)];
                case 4:
                    _g.sent();
                    _d = (_c = tags).push;
                    return [4 /*yield*/, listTags(arn, qldbClient)];
                case 5:
                    _d.apply(_c, [(_g.sent()).Tags]);
                    return [4 /*yield*/, untagResource(arn, REMOVE_TAGS, qldbClient)];
                case 6:
                    _g.sent();
                    _f = (_e = tags).push;
                    return [4 /*yield*/, listTags(arn, qldbClient)];
                case 7:
                    _f.apply(_e, [(_g.sent()).Tags]);
                    return [2 /*return*/, tags];
                case 8:
                    e_1 = _g.sent();
                    LogUtil_1.error("Unable to tag resources: " + e_1);
                    return [3 /*break*/, 14];
                case 9: return [4 /*yield*/, CreateLedger_1.waitForActive(Constants_1.LEDGER_NAME_WITH_TAGS, qldbClient)];
                case 10:
                    _g.sent();
                    return [4 /*yield*/, DeletionProtection_1.setDeletionProtection(Constants_1.LEDGER_NAME_WITH_TAGS, qldbClient, false)];
                case 11:
                    _g.sent();
                    return [4 /*yield*/, DeleteLedger_1.deleteLedger(Constants_1.LEDGER_NAME_WITH_TAGS, qldbClient)];
                case 12:
                    _g.sent();
                    return [4 /*yield*/, DeleteLedger_1.waitForDeleted(Constants_1.LEDGER_NAME_WITH_TAGS, qldbClient)];
                case 13:
                    _g.sent();
                    return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    });
};
if (require.main === module) {
    exports.main();
}
