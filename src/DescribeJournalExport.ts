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
    DescribeJournalS3ExportRequest,
    DescribeJournalS3ExportResponse,
} from "aws-sdk/clients/qldb";

import { LEDGER_NAME } from './qldb/Constants';
import { error, log } from "./qldb/LogUtil";

/**
 * Describe a journal export.
 * @param ledgerName The ledger from which the journal is being exported.
 * @param exportId The ExportId of the journal.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a DescribeJournalS3ExportResponse.
 */
export async function describeJournalExport(
    ledgerName: string, 
    exportId: string,
    qldbClient: QLDB
): Promise<DescribeJournalS3ExportResponse> {
    log(`Describing a journal export for ledger with name: ${ledgerName}, ExportId: ${exportId}.`);
    const request: DescribeJournalS3ExportRequest = {
        Name: LEDGER_NAME,
        ExportId: exportId
    };
    const exportResult: DescribeJournalS3ExportResponse = await qldbClient.describeJournalS3Export(request).promise();
    log(`Export described. Result = ${JSON.stringify(exportResult)}`);
    return exportResult;
}

/**
 * Describe a specific journal export with the given ExportId.
 * @returns Promise which fulfills with void.
 */
var main = async function(): Promise<void> {
    const qldbClient: QLDB = new QLDB();
    try {
        if (process.argv.length !== 3) {
            throw new ReferenceError("Missing ExportId argument in DescribeJournalExport.");
        }
        const exportId: string = process.argv[2].toString();
        log(`Running describe export journal tutorial with ExportId: ${exportId}.`);
        await describeJournalExport(LEDGER_NAME, exportId, qldbClient);
    } catch (e) {
        error(`Unable to describe an export: ${e}`);
    }
}

if (require.main === module) {
    main();
}
