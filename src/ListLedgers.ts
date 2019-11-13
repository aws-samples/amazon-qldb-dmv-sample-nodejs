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
import { LedgerSummary, ListLedgersRequest, ListLedgersResponse } from "aws-sdk/clients/qldb";

import { error, log } from "./qldb/LogUtil";

/**
 * List all ledgers.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a LedgerSummary array.
 */
export async function listLedgers(qldbClient: QLDB): Promise<LedgerSummary[]> {
    const ledgerSummaries: LedgerSummary[] = [];
    let nextToken: string = null;
    do {
        const request: ListLedgersRequest = {
            NextToken: nextToken
        };
        const result: ListLedgersResponse = await qldbClient.listLedgers(request).promise();
        ledgerSummaries.push.apply(ledgerSummaries, result.Ledgers);
        nextToken = result.NextToken;
    } while (nextToken != null);
    return ledgerSummaries;
}

/**
 * List all QLDB ledgers in a given account.
 * @returns Promise which fulfills with void.
 */
var main = async function(): Promise<void> {
    try {
        const qldbClient: QLDB = new QLDB();
        log("Retrieving all the ledgers...");
        const result: LedgerSummary[] = await listLedgers(qldbClient);
        log(`Success. List of ledgers: ${JSON.stringify(result)}`);
    } catch (e) {
        error(`Unable to list ledgers: ${e}`);
    }
}

if (require.main === module) {
    main();
}
