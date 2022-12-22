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
var client_s3_1 = require("@aws-sdk/client-s3");
var ion_js_1 = require("ion-js");
var JournalBlock_1 = require("./JournalBlock");
var LogUtil_1 = require("./LogUtil");
/**
 * Compare the expected block range, derived from File Key, with the actual object content.
 * @param fileKey The key of data file containing the chunk of journal block.
 *                The fileKey pattern is {[strandId].[firstSequenceNo]-[lastSequenceNo].ion}.
 * @param firstBlock The first block in the block chain for a particular journal strand.
 * @param lastBlock The last block in the block chain for a particular journal strand.
 * @throws Error: If the SequenceNo on the blockAddress does not match the expected SequenceNo.
 */
function compareKeyWithContentRange(fileKey, firstBlock, lastBlock) {
    var sequenceNoRange = fileKey.split(".")[1];
    var keyTokens = sequenceNoRange.split("-");
    var startSequenceNo = keyTokens[0];
    var lastsequenceNo = keyTokens[1];
    if (firstBlock._blockAddress._sequenceNo.toString() !== startSequenceNo) {
        throw new Error("Expected first block SequenceNo to be " + startSequenceNo);
    }
    if (lastBlock._blockAddress._sequenceNo.toString() !== lastsequenceNo) {
        throw new Error("Expected last block SequenceNo to be " + lastsequenceNo);
    }
}
/**
 * Find the final manifest objects created after the completion of an export job.
 * @param objects List of objects in a particular bucket.
 * @returns The identifier for the final manifest object.
 * @throws Error: If the final manifest is not found.
 */
function filterForCompletedManifest(objects) {
    var object = objects.find(function (_a) {
        var Key = _a.Key;
        return Key.endsWith("completed.manifest");
    });
    if (object) {
        return object.Key;
    }
    throw new Error("Completed manifest not found.");
}
/**
 * Find the initial manifest created at the beginning of an export request.
 * @param objects List of objects in a particular bucket.
 * @param manifest The expected identifier for the initial manifest.
 * @returns The identifier for the initial manifest object.
 * @throws Error: If the initial manifest is not found.
 */
function filterForInitialManifest(objects, manifest) {
    var object = objects.find(function (_a) {
        var Key = _a.Key;
        return Key === manifest;
    });
    if (object) {
        return object.Key;
    }
    throw new Error("Initial manifest not found.");
}
/**
 * Retrieve the ordered list of data object keys within the given final manifest.
 * @param manifestObject The content of the final manifest.
 *               For this to work, the value is expected to have the structure:
 *               {
 *                  keys:[
 *                     "2019/04/15/22/JdxjkR9bSYB5jMHWcI464T.1-4.ion",
 *                     "2019/04/15/22/JdxjkR9bSYB5jMHWcI464T.5-10.ion",
 *                     "2019/04/15/22/JdxjkR9bSYB5jMHWcI464T.11-12.ion"
 *                  ]
 *               }
 *
 * @returns List of data object keys.
 */
function getDataFileKeysFromManifest(manifestObject) {
    var listOfKeys = [];
    var manifestValue = ion_js_1.dom.load(manifestObject);
    var keys = manifestValue.get("keys").elements();
    keys.forEach(function (key) {
        listOfKeys.push(key.stringValue());
    });
    return listOfKeys;
}
/**
 * Parse a S3 object's content for the journal data objects in Ion format.
 * @param s3Object The content within a S3 object.
 * @returns List of journal blocks.
 * @throws Error: If there is an error loading the journal.
 */
function getJournalBlocks(s3Object) {
    var journals = ion_js_1.dom.loadAll(s3Object);
    var journalBlocks = journals.map(function (journal) { return JournalBlock_1.fromIon(journal); });
    return journalBlocks;
}
/**
 * Read the S3 export within a journal block.
 * @param describeJournalExportResult The result from the QLDB database describing a journal export.
 * @param s3Client The low-level S3 client.
 * @returns Promise which fulfills with a list of journal blocks.
 */
function readExport(describeJournalExportResult, s3Client) {
    return __awaiter(this, void 0, void 0, function () {
        var exportConfiguration, prefix, bucketName, request, response, objects, expectedManifestKey, initialManifest, completedManifestFileKey, getObjectRequest, completedManifestObject, dataFileKeys, journalBlocks, _i, dataFileKeys_1, dataFileKey, s3Object, blocks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    exportConfiguration = describeJournalExportResult.S3ExportConfiguration;
                    prefix = exportConfiguration.Prefix;
                    bucketName = exportConfiguration.Bucket;
                    request = {
                        Bucket: bucketName,
                        Prefix: prefix
                    };
                    return [4 /*yield*/, s3Client.send(new client_s3_1.ListObjectsV2Command(request))];
                case 1:
                    response = _a.sent();
                    objects = response.Contents;
                    LogUtil_1.log("Found the following objects for list from S3:");
                    objects.forEach(function (object) {
                        LogUtil_1.log(object.Key);
                    });
                    expectedManifestKey = ("" + prefix + describeJournalExportResult.ExportId + ".started.manifest");
                    initialManifest = filterForInitialManifest(objects, expectedManifestKey);
                    LogUtil_1.log("Found the initial manifest with key: " + initialManifest + ".");
                    completedManifestFileKey = filterForCompletedManifest(objects);
                    getObjectRequest = {
                        Bucket: bucketName,
                        Key: completedManifestFileKey
                    };
                    return [4 /*yield*/, s3Client.send(new client_s3_1.GetObjectCommand(getObjectRequest))];
                case 2:
                    completedManifestObject = (_a.sent()).Body.toString();
                    dataFileKeys = getDataFileKeysFromManifest(completedManifestObject);
                    LogUtil_1.log("Found the following keys in the manifest files: " + JSON.stringify(dataFileKeys));
                    journalBlocks = [];
                    _i = 0, dataFileKeys_1 = dataFileKeys;
                    _a.label = 3;
                case 3:
                    if (!(_i < dataFileKeys_1.length)) return [3 /*break*/, 6];
                    dataFileKey = dataFileKeys_1[_i];
                    LogUtil_1.log("Reading file with S3 key " + dataFileKey + " from bucket: " + bucketName);
                    getObjectRequest = {
                        Bucket: bucketName,
                        Key: dataFileKey
                    };
                    return [4 /*yield*/, s3Client.send(new client_s3_1.GetObjectCommand(getObjectRequest))];
                case 4:
                    s3Object = (_a.sent()).Body.toString();
                    blocks = getJournalBlocks(s3Object);
                    compareKeyWithContentRange(dataFileKey, blocks[0], blocks[blocks.length - 1]);
                    blocks.forEach(function (block) {
                        journalBlocks.push(block);
                    });
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/, journalBlocks];
            }
        });
    });
}
exports.readExport = readExport;
