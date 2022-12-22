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
var client_sts_1 = require("@aws-sdk/client-sts");
var client_s3_1 = require("@aws-sdk/client-s3");
var client_iam_1 = require("@aws-sdk/client-iam");
var client_qldb_1 = require("@aws-sdk/client-qldb");
var DescribeJournalExport_1 = require("./DescribeJournalExport");
var Constants_1 = require("./qldb/Constants");
var LogUtil_1 = require("./qldb/LogUtil");
var Util_1 = require("./qldb/Util");
var EXPORT_ROLE_NAME = "QLDBTutorialJournalExportRole";
var ROLE_POLICY_NAME = "QLDBTutorialJournalExportRolePolicy";
var MAX_RETRY_COUNT = 40;
var EXPORT_COMPLETION_POLL_PERIOD_MS = 10000;
var EMPTY_ARRAY = [];
var POLICY_TEMPLATE = {
    Version: "2012-10-17",
    Statement: EMPTY_ARRAY
};
var ASSUME_ROLE_POLICY_TEMPLATE = {
    Effect: "Allow",
    Principal: {
        Service: ["qldb.amazonaws.com"]
    },
    Action: ["sts:AssumeRole"]
};
var EXPORT_ROLE_S3_STATEMENT_TEMPLATE = {
    Sid: "QLDBJournalExportPermission",
    Effect: "Allow",
    Action: ["s3:PutObjectAcl", "s3:PutObject"],
    Resource: "arn:aws:s3:::{bucket_name}/*"
};
var EXPORT_ROLE_KMS_STATEMENT_TEMPLATE = {
    Sid: "QLDBJournalExportPermission",
    Effect: "Allow",
    Action: ["kms:GenerateDataKey"],
    Resource: "{kms_arn}"
};
/**
 * Request QLDB to export the contents of the journal for the given time period and S3 configuration. Before calling
 * this function the S3 bucket should be created.
 * @param ledgerName Name of the ledger.
 * @param startTime Time from when the journal contents should be exported.
 * @param endTime Time until which the journal contents should be exported.
 * @param s3BucketName S3 bucket to write the data to.
 * @param s3Prefix S3 prefix to be prefixed to the files written.
 * @param encryptionConfig Encryption configuration for S3.
 * @param roleArn The IAM role ARN to be used when exporting the journal.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a ExportJournalToS3Response.
 */
function createExport(ledgerName, startTime, endTime, s3BucketName, s3Prefix, encryptionConfig, roleArn, qldbClient) {
    return __awaiter(this, void 0, void 0, function () {
        var request, ExportJournalRequeset, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LogUtil_1.log("Let's create a journal export for ledger with name: " + ledgerName);
                    request = {
                        Name: ledgerName,
                        InclusiveStartTime: startTime,
                        ExclusiveEndTime: endTime,
                        S3ExportConfiguration: {
                            Bucket: s3BucketName,
                            Prefix: s3Prefix,
                            EncryptionConfiguration: encryptionConfig
                        },
                        RoleArn: roleArn
                    };
                    ExportJournalRequeset = new client_qldb_1.ExportJournalToS3Command(request);
                    return [4 /*yield*/, qldbClient.send(ExportJournalRequeset)["catch"](function (err) {
                            if (amazon_qldb_driver_nodejs_1.isInvalidParameterException(err)) {
                                LogUtil_1.error("The eventually consistent behavior of the IAM service may cause this export to fail its first " +
                                    "attempts, please retry.");
                            }
                            throw err;
                        })];
                case 1:
                    result = _a.sent();
                    LogUtil_1.log("Requested QLDB to export contents of the journal.");
                    return [2 /*return*/, result];
            }
        });
    });
}
/**
 * Send a request to the QLDB database to export a journal to the specified S3 bucket.
 * @param ledgerName Name of the ledger to create a journal export for.
 * @param bucketName S3 bucket to write the data to.
 * @param prefix S3 prefix to be suffixed to the files being written.
 * @param encryptionConfig Encryption for S3 files.
 * @param roleArn The IAM role ARN to be used when exporting the journal.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a ExportJournalToS3Response.
 */
function createExportAndWaitForCompletion(ledgerName, bucketName, prefix, encryptionConfig, roleArn, qldbClient) {
    return __awaiter(this, void 0, void 0, function () {
        var exclusiveEndTime, inclusiveStartTime, result, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(roleArn === null)) return [3 /*break*/, 2];
                    return [4 /*yield*/, createExportRole(EXPORT_ROLE_NAME, encryptionConfig.KmsKeyArn, ROLE_POLICY_NAME, bucketName)];
                case 1:
                    roleArn = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    exclusiveEndTime = new Date();
                    inclusiveStartTime = new Date(exclusiveEndTime);
                    inclusiveStartTime.setMinutes(exclusiveEndTime.getMinutes() - 10);
                    return [4 /*yield*/, createExport(ledgerName, inclusiveStartTime, exclusiveEndTime, bucketName, prefix, encryptionConfig, roleArn, qldbClient)];
                case 3:
                    result = _a.sent();
                    return [4 /*yield*/, waitForExportToComplete(ledgerName, result.ExportId, qldbClient)];
                case 4:
                    _a.sent();
                    LogUtil_1.log("JournalS3Export for exportId " + result.ExportId + " is completed.");
                    return [2 /*return*/, result];
                case 5:
                    e_1 = _a.sent();
                    LogUtil_1.error("Unable to create an export!");
                    LogUtil_1.error(JSON.stringify(e_1));
                    throw e_1;
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.createExportAndWaitForCompletion = createExportAndWaitForCompletion;
/**
 * Create a new export rule and a new managed policy for the current AWS account.
 * @param roleName The name of the role to be created.
 * @param bucketName If key_arn is None, create a new ARN using the given bucket name.
 * @param keyArn The optional KMS Key ARN used to configure the role policy statement.
 * @param region The current AWS region, should be the same as the current ledger's region.
 * @param rolePolicyName Name of the role policy to be created.
 * @returns Promise which fulfills with the newly created role ARN as a string.
 */
function createExportRole(roleName, keyArn, rolePolicyName, s3BucketName) {
    return __awaiter(this, void 0, void 0, function () {
        var iAmClient, newRoleArn, getRoleRequest, _a, createRoleRequest, role, rolePolicy, createPolicyRequest, createPolicyResult, attachRolePolicyRequest;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    iAmClient = new client_iam_1.IAM({});
                    LogUtil_1.log("Trying to retrieve role with name: " + roleName);
                    newRoleArn = "";
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 7]);
                    getRoleRequest = {
                        RoleName: roleName
                    };
                    return [4 /*yield*/, iAmClient.getRole(getRoleRequest)];
                case 2:
                    newRoleArn = (_b.sent()).Role.Arn;
                    LogUtil_1.log("The role called " + roleName + " already exists.");
                    return [3 /*break*/, 7];
                case 3:
                    _a = _b.sent();
                    LogUtil_1.log("The role called " + roleName + " does not exist. Creating it now.");
                    POLICY_TEMPLATE.Statement[0] = ASSUME_ROLE_POLICY_TEMPLATE;
                    createRoleRequest = {
                        RoleName: roleName,
                        AssumeRolePolicyDocument: JSON.stringify(POLICY_TEMPLATE)
                    };
                    return [4 /*yield*/, iAmClient.createRole(createRoleRequest)];
                case 4:
                    role = _b.sent();
                    LogUtil_1.log("Created a role called " + roleName + ".");
                    newRoleArn = role.Role.Arn;
                    POLICY_TEMPLATE.Statement[0] = EXPORT_ROLE_S3_STATEMENT_TEMPLATE;
                    if (keyArn) {
                        POLICY_TEMPLATE.Statement[1] = EXPORT_ROLE_KMS_STATEMENT_TEMPLATE;
                    }
                    rolePolicy = JSON.stringify(POLICY_TEMPLATE).replace("{kms_arn}", keyArn);
                    rolePolicy = rolePolicy.replace("{bucket_name}", s3BucketName);
                    createPolicyRequest = {
                        PolicyName: rolePolicyName,
                        PolicyDocument: rolePolicy
                    };
                    return [4 /*yield*/, iAmClient.createPolicy(createPolicyRequest)];
                case 5:
                    createPolicyResult = _b.sent();
                    attachRolePolicyRequest = {
                        RoleName: roleName,
                        PolicyArn: createPolicyResult.Policy.Arn
                    };
                    return [4 /*yield*/, iAmClient.attachRolePolicy(attachRolePolicyRequest)];
                case 6:
                    _b.sent();
                    LogUtil_1.log("Role " + roleName + " created with ARN: " + newRoleArn + " and policy: " + rolePolicy + ".");
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/, newRoleArn];
            }
        });
    });
}
/**
 * Create a S3 bucket if one with the given bucket_name does not exists.
 * @param bucketName The name of the bucket to check.
 * @param s3Client The low-level S3 client.
 * @returns Promise which fulfills with void.
 */
function createS3BucketIfNotExists(bucketName, s3Client) {
    return __awaiter(this, void 0, void 0, function () {
        var bucketExists, request, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LogUtil_1.log("Creating bucket: " + bucketName + " if it doesnt exist");
                    return [4 /*yield*/, doesBucketExist(bucketName, s3Client)];
                case 1:
                    bucketExists = _a.sent();
                    if (!!(bucketExists)) return [3 /*break*/, 5];
                    LogUtil_1.log("Bucket " + bucketName + " does not exist. Creating it now.");
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    request = {
                        Bucket: bucketName
                    };
                    return [4 /*yield*/, s3Client.send(new client_s3_1.CreateBucketCommand(request))];
                case 3:
                    _a.sent();
                    LogUtil_1.log("Bucket with name " + bucketName + " created.");
                    return [3 /*break*/, 5];
                case 4:
                    e_2 = _a.sent();
                    LogUtil_1.log("Unable to create S3 bucket named " + bucketName + ": " + e_2);
                    throw e_2;
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.createS3BucketIfNotExists = createS3BucketIfNotExists;
/**
 * Check whether a bucket exists in S3.
 * @param bucketName The name of the bucket to check.
 * @param s3Client The low-level S3 client.
 * @returns Promise which fulfills with whether the bucket exists or not.
 */
function doesBucketExist(bucketName, s3Client) {
    return __awaiter(this, void 0, void 0, function () {
        var request, doesBucketExist, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    request = {
                        Bucket: bucketName
                    };
                    doesBucketExist = true;
                    LogUtil_1.log("Probing if " + bucketName + " head exists");
                    return [4 /*yield*/, s3Client.send(new client_s3_1.HeadBucketCommand(request))
                            .then(function (response) {
                            LogUtil_1.log('S3 bucket head probe success');
                            LogUtil_1.log(JSON.stringify(response));
                        }, function (response) {
                            LogUtil_1.log('S3 bucket head probe partially failed');
                            LogUtil_1.log(JSON.stringify(response));
                            doesBucketExist = false;
                        })["catch"](function (err) {
                            LogUtil_1.log('S3 bucket head probe failed');
                            if (err.message === 'NotFound') {
                                doesBucketExist = false;
                            }
                        })];
                case 1:
                    response = _a.sent();
                    LogUtil_1.log('returning doesBucketExist');
                    // doesBucketExist = response !== undefined ? false : true;
                    return [2 /*return*/, doesBucketExist];
            }
        });
    });
}
/**
 * Use the default SSE S3 configuration for the journal export if a KMS Key ARN was not given.
 * @param kmsArn The Amazon Resource Name to encrypt.
 * @returns The encryption configuration for JournalS3Export.
 */
function setUpS3EncryptionConfiguration(kmsArn) {
    if (kmsArn === null) {
        return { ObjectEncryptionType: 'SSE_S3' };
    }
    else {
        return { ObjectEncryptionType: 'SSE_KMS', KmsKeyArn: kmsArn };
    }
}
exports.setUpS3EncryptionConfiguration = setUpS3EncryptionConfiguration;
/**
 * Wait for the journal export to complete.
 * @param ledgerName Name of the ledger to wait on.
 * @param exportId The unique export ID of the journal export.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a JournalS3ExportDescription.
 * @throws Error: When the export fails to complete within a constant number of retries.
 */
function waitForExportToComplete(ledgerName, exportId, qldbClient) {
    return __awaiter(this, void 0, void 0, function () {
        var count, exportDescription;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    LogUtil_1.log("Waiting for JournalS3Export for " + exportId + " to complete...");
                    count = 0;
                    _a.label = 1;
                case 1:
                    if (!(count < MAX_RETRY_COUNT)) return [3 /*break*/, 4];
                    return [4 /*yield*/, DescribeJournalExport_1.describeJournalExport(ledgerName, exportId, qldbClient)];
                case 2:
                    exportDescription = (_a.sent()).ExportDescription;
                    if (exportDescription.Status === 'COMPLETED') {
                        LogUtil_1.log("JournalS3Export completed.");
                        return [2 /*return*/, exportDescription];
                    }
                    LogUtil_1.log("JournalS3Export is still in progress. Please wait.");
                    return [4 /*yield*/, Util_1.sleep(EXPORT_COMPLETION_POLL_PERIOD_MS)];
                case 3:
                    _a.sent();
                    count += 1;
                    return [3 /*break*/, 1];
                case 4: throw new Error("Journal Export did not complete for " + exportId + ".");
            }
        });
    });
}
/**
 * Export a journal to S3.
 *
 * This code requires an S3 bucket. You can provide the name of an S3 bucket that
 * you wish to use via the arguments (args[0]). The code will check if the bucket
 * exists and create it if not. If you don't provide a bucket name, the code will
 * create a unique bucket for the purposes of this tutorial.
 *
 * Optionally, you can provide an IAM role ARN to use for the journal export via
 * the arguments (args[1]). Otherwise, the code will create and use a role named
 * "QLDBTutorialJournalExportRole".
 *
 * S3 Export Encryption:
 * Optionally, you can provide a KMS key ARN to use for S3-KMS encryption, via
 * the arguments (args[2]). The tutorial code will fail if you provide a KMS key
 * ARN that doesn't exist.
 *
 * If KMS Key ARN is not provided, the Tutorial Code will use
 * SSE-S3 for the S3 Export.
 *
 * If provided, the target KMS Key is expected to have at least the following
 * KeyPolicy:
 * -------------
 * CustomCmkForQLDBExportEncryption:
 *     Type: AWS::KMS::Key
 *     Properties:
 *       KeyUsage: ENCRYPT_DECRYPT
 *       KeyPolicy:
 *         Version: "2012-10-17"
 *         Id: key-default-1
 *         Statement:
 *         - Sid: Grant Permissions for QLDB to use the key
 *           Effect: Allow
 *           Principal:
 *             Service: qldb.qldb.amazonaws.com
 *           Action:
 *             - kms:Encrypt
 *             - kms:GenerateDataKey
 *           # In a key policy, you use "*" for the resource, which means "this CMK."
 *           # A key policy applies only to the CMK it is attached to.
 *           Resource: '*'
 * -------------
 * Please see the KMS key policy developer guide here:
 * https://docs.aws.amazon.com/kms/latest/developerguide/key-policies.html
 * @returns Promise which fulfills with void.
 */
exports.main = function (bypassArgv) {
    if (bypassArgv === void 0) { bypassArgv = false; }
    return __awaiter(this, void 0, void 0, function () {
        var s3Client, sts, qldbClient, s3BucketName, kmsArn, roleArn, request, identity, s3EncryptionConfig, exportResult, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    s3Client = new client_s3_1.S3({});
                    sts = new client_sts_1.STS({});
                    qldbClient = new client_qldb_1.QLDB({});
                    s3BucketName = null;
                    kmsArn = null;
                    roleArn = null;
                    if (!(!bypassArgv && process.argv.length >= 3)) return [3 /*break*/, 1];
                    s3BucketName = process.argv[2].toString();
                    if (process.argv.length >= 4) {
                        roleArn = process.argv[3].toString();
                    }
                    if (process.argv.length === 5) {
                        kmsArn = process.argv[4].toString();
                    }
                    return [3 /*break*/, 3];
                case 1:
                    request = {};
                    return [4 /*yield*/, sts.getCallerIdentity(request)];
                case 2:
                    identity = _a.sent();
                    s3BucketName = Constants_1.JOURNAL_EXPORT_S3_BUCKET_NAME_PREFIX + "-" + identity.Account;
                    _a.label = 3;
                case 3: return [4 /*yield*/, createS3BucketIfNotExists(s3BucketName, s3Client)];
                case 4:
                    _a.sent();
                    s3EncryptionConfig = setUpS3EncryptionConfiguration(kmsArn);
                    return [4 /*yield*/, createExportAndWaitForCompletion(Constants_1.LEDGER_NAME, s3BucketName, Constants_1.LEDGER_NAME + "/", s3EncryptionConfig, roleArn, qldbClient)];
                case 5:
                    exportResult = _a.sent();
                    return [2 /*return*/, exportResult];
                case 6:
                    e_3 = _a.sent();
                    LogUtil_1.error("Unable to create an export: " + e_3);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
};
if (require.main === module) {
    exports.main();
}
