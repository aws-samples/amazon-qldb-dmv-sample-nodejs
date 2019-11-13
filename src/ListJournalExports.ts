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

import { QLDB } from "aws-sdk";
import {
    JournalS3ExportDescription,
    ListJournalS3ExportsForLedgerRequest,
    ListJournalS3ExportsForLedgerResponse,
    ListJournalS3ExportsRequest,
    ListJournalS3ExportsResponse
} from "aws-sdk/clients/qldb";

import { LEDGER_NAME } from './qldb/Constants';
import { error, log } from "./qldb/LogUtil";

const MAX_RESULTS = 2;

/**
 * List all journal exports.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a JournalS3ExportDescription array.
 */
async function listAllJournalExports(qldbClient: QLDB): Promise<JournalS3ExportDescription[]> {
    const exportList: JournalS3ExportDescription[] = [];
    let nextToken: string = null;
    do {
        const request: ListJournalS3ExportsRequest = {
            MaxResults: MAX_RESULTS,
            NextToken: nextToken
        };
        const result: ListJournalS3ExportsResponse = await qldbClient.listJournalS3Exports(request).promise();
        exportList.push.apply(exportList, result.JournalS3Exports);
        nextToken = result.NextToken;
    } while (nextToken != null);
    return exportList;
}

/**
 * List all journal exports for the given ledger.
 * @param ledgerName List all journal exports for the given ledger.
 * @returns Promise which fulfills with a JournalS3ExportDescription array.
 */
async function listJournalExports(ledgerName: string): Promise<JournalS3ExportDescription[]> {
    const qldbClient: QLDB = new QLDB();
    const exportDescriptions: JournalS3ExportDescription[] = [];
    let nextToken: string = null;
    do {
        const request: ListJournalS3ExportsForLedgerRequest = {
            Name: ledgerName,
            MaxResults: MAX_RESULTS,
            NextToken: nextToken
        };
        const result: ListJournalS3ExportsForLedgerResponse =
            await qldbClient.listJournalS3ExportsForLedger(request).promise();
        exportDescriptions.push.apply(exportDescriptions, result.JournalS3Exports);
        nextToken = result.NextToken;
    } while (nextToken != null);
    return exportDescriptions;
}

/**
 * List the journal exports of a given QLDB ledger.
 * @returns Promise which fulfills with void.
 */
var main = async function(): Promise<void> {
    try {
        log(`Listing journal exports for ledger: ${LEDGER_NAME}.`);
        const digest: JournalS3ExportDescription[] = await listJournalExports(LEDGER_NAME);
        log(`Success. List of journal exports: ${JSON.stringify(digest)}`);
    } catch (e) {
        error(`Unable to list exports: ${e}`);
    }
}

if (require.main === module) {
    main();
}
