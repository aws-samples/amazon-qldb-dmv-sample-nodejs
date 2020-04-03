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

import { QLDB, S3, STS } from "aws-sdk";
import { JournalS3ExportDescription } from "aws-sdk/clients/qldb";
import { GetCallerIdentityRequest, GetCallerIdentityResponse } from "aws-sdk/clients/sts";
import { toBase64 } from "ion-js";
import { format } from "util";

import { describeJournalExport } from './DescribeJournalExport';
import {
    createExportAndWaitForCompletion,
    createS3BucketIfNotExists,
    setUpS3EncryptionConfiguration
} from "./ExportJournal";
import { JOURNAL_EXPORT_S3_BUCKET_NAME_PREFIX, LEDGER_NAME } from './qldb/Constants';
import { JournalBlock } from "./qldb/JournalBlock";
import { readExport } from "./qldb/JournalS3ExportReader";
import { error, log } from "./qldb/LogUtil";
import { joinHashesPairwise } from "./qldb/Verifier";

const s3Client: S3 = new S3();

/**
 * Compare the hash values on the given journal blocks.
 * @param previousJournalBlock Previous journal block in the chain.
 * @param journalBlock Current journal block in the chain.
 * @returns The current journal block in the chain.
 */
function compareJournalBlocks(previousJournalBlock: JournalBlock, journalBlock: JournalBlock): JournalBlock {
    if (previousJournalBlock === undefined) {
        return journalBlock;
    }
    if (toBase64(previousJournalBlock._blockHash) !== toBase64(journalBlock._previousBlockHash)) {
        throw new Error("Previous block hash does not match!");
    }
    const blockHash: Uint8Array = joinHashesPairwise(journalBlock._entriesHash, previousJournalBlock._blockHash);
    if (toBase64(blockHash) !== toBase64(journalBlock._blockHash)) {
        throw new Error("Block hash doesn't match expected block hash. Verification failed.");
    }
    return journalBlock;
}

/**
 * Export journal contents to a S3 bucket.
 * @param qldbClient The QLDB control plane client to use.
 * @returns The ExportId for the journal export.
 */
async function createJournalExport(qldbClient: QLDB): Promise<string> {
    const sts: STS = new STS();
    const request: GetCallerIdentityRequest = {};
    const identity: GetCallerIdentityResponse = await sts.getCallerIdentity(request).promise();

    const bucketName: string = format('%s-%s', JOURNAL_EXPORT_S3_BUCKET_NAME_PREFIX, identity.Account);
    const prefix: string = format('%s-%s', LEDGER_NAME, Date.now().toString());

    await createS3BucketIfNotExists(bucketName, s3Client);

    const exportJournalToS3Result = await createExportAndWaitForCompletion(
        LEDGER_NAME,
        bucketName,
        prefix,
        setUpS3EncryptionConfiguration(null),
        null,
        qldbClient
    );
    return exportJournalToS3Result.ExportId;
}

/**
 * Validate that the chain hash on the journal block is valid.
 * @param journalBlocks A list of journal blocks.
 * @returns None if the given list of journal blocks is empty.
 */
function verify(journalBlocks: JournalBlock[]): void {
    if (journalBlocks.length === 0) {
        return;
    }
    journalBlocks.reduce(compareJournalBlocks);
}

/**
 * Validate the hash chain of a QLDB ledger by stepping through its S3 export.
 * This code accepts an exportID as an argument, if exportID is passed the code
 * will use that or request QLDB to generate a new export to perform QLDB hash
 * chain validation.
 * @returns Promise which fulfills with void.
 */
var main = async function(): Promise<void> {
    try {
        const qldbClient = new QLDB();
        let exportId: string;
        if (process.argv.length === 3) {
            exportId = process.argv[2].toString();
            log(`Validating QLDB hash chain for ExportId: ${exportId}.`);
        } else {
            log("Requesting QLDB to create an export.");
            exportId = await createJournalExport(qldbClient);
        }
        const journalExport: JournalS3ExportDescription =
            (await describeJournalExport(LEDGER_NAME, exportId, qldbClient)).ExportDescription;
        const journalBlocks: JournalBlock[] = await readExport(journalExport, s3Client);
        verify(journalBlocks);
        log(`QLDB hash chain validation for ExportId: ${exportId} is successful`);
    } catch (e) {
        error(`Unable to perform hash chain verification: ${e}`);
    }
}

if (require.main === module) {
    main();
}
