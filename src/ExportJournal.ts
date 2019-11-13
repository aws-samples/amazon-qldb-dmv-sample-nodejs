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

import { isInvalidParameterException } from "amazon-qldb-driver-nodejs";
import { IAM, QLDB, S3, STS } from "aws-sdk";
import {
    AttachRolePolicyRequest,
    CreatePolicyRequest,
    CreatePolicyResponse,
    CreateRoleRequest,
    CreateRoleResponse,
    GetRoleRequest,
} from "aws-sdk/clients/iam";
import {
    ExportJournalToS3Request,
    ExportJournalToS3Response,
    JournalS3ExportDescription,
    S3EncryptionConfiguration
} from "aws-sdk/clients/qldb";
import { CreateBucketRequest, HeadBucketRequest } from "aws-sdk/clients/s3";
import { GetCallerIdentityRequest, GetCallerIdentityResponse } from "aws-sdk/clients/sts";

import { describeJournalExport } from './DescribeJournalExport';
import { JOURNAL_EXPORT_S3_BUCKET_NAME_PREFIX, LEDGER_NAME } from './qldb/Constants';
import { error, log } from "./qldb/LogUtil";
import { sleep } from "./qldb/Util";

const EXPORT_ROLE_NAME = "QLDBTutorialJournalExportRole";
const ROLE_POLICY_NAME = "QLDBTutorialJournalExportRolePolicy";
const MAX_RETRY_COUNT = 40;
const EXPORT_COMPLETION_POLL_PERIOD_MS = 10000;
const EMPTY_ARRAY: any[] = []
const POLICY_TEMPLATE = {
    Version: "2012-10-17",
    Statement: EMPTY_ARRAY
};
const ASSUME_ROLE_POLICY_TEMPLATE = {
    Effect: "Allow",
    Principal: {
        Service: ["qldb.amazonaws.com"]
    },
    Action: ["sts:AssumeRole"]
};
const EXPORT_ROLE_S3_STATEMENT_TEMPLATE = {
    Sid: "QLDBJournalExportPermission",
    Effect: "Allow",
    Action: ["s3:PutObjectAcl", "s3:PutObject"],
    Resource: "arn:aws:s3:::{bucket_name}/*"
};
const EXPORT_ROLE_KMS_STATEMENT_TEMPLATE = {
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
async function createExport(
    ledgerName: string,
    startTime: Date,
    endTime: Date,
    s3BucketName: string,
    s3Prefix: string,
    encryptionConfig: S3EncryptionConfiguration,
    roleArn: string,
    qldbClient: QLDB
): Promise<ExportJournalToS3Response> {
    log(`Let's create a journal export for ledger with name: ${ledgerName}`);
    try {
        const request: ExportJournalToS3Request = {
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
        const result: ExportJournalToS3Response = await qldbClient.exportJournalToS3(request).promise();
        log("Requested QLDB to export contents of the journal.");
        return result;
    } catch (e) {
        if (isInvalidParameterException(e)) {
            error(
                "The eventually consistent behavior of the IAM service may cause this export to fail its first " +
                "attempts, please retry."
            );
        }
        throw e;
    }
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
export async function createExportAndWaitForCompletion(
    ledgerName: string,
    bucketName: string,
    prefix: string,
    encryptionConfig: S3EncryptionConfiguration,
    roleArn: string,
    qldbClient: QLDB
): Promise<ExportJournalToS3Response> {
    if (roleArn === null) {
        roleArn = await createExportRole(EXPORT_ROLE_NAME, encryptionConfig.KmsKeyArn, ROLE_POLICY_NAME, bucketName);
    }
    try {
        const exclusiveEndTime: Date = new Date();
        const inclusiveStartTime: Date = new Date(exclusiveEndTime);
        inclusiveStartTime.setMinutes(exclusiveEndTime.getMinutes() - 10);

        const result: ExportJournalToS3Response = await createExport(
            ledgerName,
            inclusiveStartTime,
            exclusiveEndTime,
            bucketName,
            prefix,
            encryptionConfig,
            roleArn,
            qldbClient
        );
        await waitForExportToComplete(ledgerName, result.ExportId, qldbClient);
        log(`JournalS3Export for exportId ${result.ExportId} is completed.`);
        return result;
    } catch (e) {
        error("Unable to create an export!");
        throw e;
    }
}

/**
 * Create a new export rule and a new managed policy for the current AWS account.
 * @param roleName The name of the role to be created.
 * @param bucketName If key_arn is None, create a new ARN using the given bucket name.
 * @param keyArn The optional KMS Key ARN used to configure the role policy statement.
 * @param region The current AWS region, should be the same as the current ledger's region.
 * @param rolePolicyName Name of the role policy to be created.
 * @returns Promise which fulfills with the newly created role ARN as a string.
 */
async function createExportRole(
    roleName: string,
    keyArn: string,
    rolePolicyName: string,
    s3BucketName: string
): Promise<string> {
    const iAmClient: IAM = new IAM();
    log(`Trying to retrieve role with name: ${roleName}`);
    let newRoleArn: string = "";
    try {
        const getRoleRequest: GetRoleRequest = {
            RoleName: roleName
        };
        newRoleArn = (await iAmClient.getRole(getRoleRequest).promise()).Role.Arn;
        log(`The role called ${roleName} already exists.`);
    }
    catch {
        log(`The role called ${roleName} does not exist. Creating it now.`);
        POLICY_TEMPLATE.Statement[0] = ASSUME_ROLE_POLICY_TEMPLATE;
        const createRoleRequest: CreateRoleRequest = {
            RoleName: roleName,
            AssumeRolePolicyDocument: JSON.stringify(POLICY_TEMPLATE)
        };
        const role: CreateRoleResponse = await iAmClient.createRole(createRoleRequest).promise();
        log(`Created a role called ${roleName}.`);

        newRoleArn = role.Role.Arn;
        POLICY_TEMPLATE.Statement[0] = EXPORT_ROLE_S3_STATEMENT_TEMPLATE;
        if (keyArn) {
            POLICY_TEMPLATE.Statement[1] = EXPORT_ROLE_KMS_STATEMENT_TEMPLATE;
        }
        let rolePolicy: string = JSON.stringify(POLICY_TEMPLATE).replace("{kms_arn}", keyArn);
        rolePolicy = rolePolicy.replace("{bucket_name}", s3BucketName);
        const createPolicyRequest: CreatePolicyRequest = {
            PolicyName: rolePolicyName,
            PolicyDocument: rolePolicy
        };
        const createPolicyResult: CreatePolicyResponse = await iAmClient.createPolicy(createPolicyRequest).promise();
        const attachRolePolicyRequest: AttachRolePolicyRequest = {
            RoleName: roleName,
            PolicyArn: createPolicyResult.Policy.Arn
        };
        await iAmClient.attachRolePolicy(attachRolePolicyRequest).promise();
        log(`Role ${roleName} created with ARN: ${newRoleArn} and policy: ${rolePolicy}.`);
    }
    return newRoleArn;
}

/**
 * Create a S3 bucket if one with the given bucket_name does not exists.
 * @param bucketName The name of the bucket to check.
 * @param s3Client The low-level S3 client.
 * @returns Promise which fulfills with void.
 */
export async function createS3BucketIfNotExists(bucketName: string, s3Client: S3): Promise<void> {
    if (!(await doesBucketExist(bucketName, s3Client))) {
        log(`Bucket ${bucketName} does not exist. Creating it now.`);
        try {
            const request: CreateBucketRequest = {
                Bucket: bucketName
            };
            await s3Client.createBucket(request).promise();
            log(`Bucket with name ${bucketName} created.`);
        } catch (e) {
            log(`Unable to create S3 bucket named ${bucketName}: ${e}`);
            throw e;
        }
    }
}

/**
 * Check whether a bucket exists in S3.
 * @param bucketName The name of the bucket to check.
 * @param s3Client The low-level S3 client.
 * @returns Promise which fulfills with whether the bucket exists or not.
 */
async function doesBucketExist(bucketName: string, s3Client: S3): Promise<boolean> {
    try {
        const request: HeadBucketRequest = {
            Bucket: bucketName
        };
        await s3Client.headBucket(request).promise();
    } catch (e) {
        if (e.code === 'NotFound') {
            return false;
        }
    }
    return true;
}

/**
 * Use the default SSE S3 configuration for the journal export if a KMS Key ARN was not given.
 * @param kmsArn The Amazon Resource Name to encrypt.
 * @returns The encryption configuration for JournalS3Export.
 */
export function setUpS3EncryptionConfiguration(kmsArn: string): S3EncryptionConfiguration {
    if (kmsArn === null) {
        return { ObjectEncryptionType: 'SSE_S3' };
    } else {
        return { ObjectEncryptionType: 'SSE_KMS', KmsKeyArn: kmsArn };
    }
}

/**
 * Wait for the journal export to complete.
 * @param ledgerName Name of the ledger to wait on.
 * @param exportId The unique export ID of the journal export.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a JournalS3ExportDescription.
 * @throws Error: When the export fails to complete within a constant number of retries.
 */
async function waitForExportToComplete(
    ledgerName: string, 
    exportId: string,
    qldbClient: QLDB
): Promise<JournalS3ExportDescription> {
    log(`Waiting for JournalS3Export for ${exportId} to complete...`);
    let count: number = 0;
    while (count < MAX_RETRY_COUNT) {
        const exportDescription: JournalS3ExportDescription =
            (await describeJournalExport(ledgerName, exportId, qldbClient)).ExportDescription;
        if (exportDescription.Status === 'COMPLETED') {
            log("JournalS3Export completed.");
            return exportDescription;
        }
        log("JournalS3Export is still in progress. Please wait.");
        await sleep(EXPORT_COMPLETION_POLL_PERIOD_MS);
        count += 1;
    }
    throw new Error(`Journal Export did not complete for ${exportId}.`);
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
var main = async function(): Promise<void> {
    try {
        const s3Client: S3 = new S3();
        const sts: STS = new STS();
        const qldbClient: QLDB = new QLDB();

        let s3BucketName: string = null;
        let kmsArn: string = null;
        let roleArn: string = null;

        if (process.argv.length >= 3) {
            s3BucketName = process.argv[2].toString();
            if (process.argv.length >= 4) {
                roleArn = process.argv[3].toString();
            }
            if (process.argv.length === 5) {
                kmsArn = process.argv[4].toString();
            }
        } else {
            const request: GetCallerIdentityRequest = {};
            const identity: GetCallerIdentityResponse = await sts.getCallerIdentity(request).promise();
            s3BucketName = `${JOURNAL_EXPORT_S3_BUCKET_NAME_PREFIX}-${identity.Account}`;
        }
        await createS3BucketIfNotExists(s3BucketName, s3Client);
        const s3EncryptionConfig: S3EncryptionConfiguration = setUpS3EncryptionConfiguration(kmsArn);
        const exportResult: ExportJournalToS3Response = await createExportAndWaitForCompletion(
            LEDGER_NAME,
            s3BucketName,
            LEDGER_NAME + "/",
            s3EncryptionConfig,
            roleArn,
            qldbClient
        );
    } catch (e) {
        error(`Unable to create an export: ${e}`);
    }
}

if (require.main === module) {
    main();
}
