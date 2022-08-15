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

import { QldbDriver, Result, TransactionExecutor } from "amazon-qldb-driver-nodejs";
import { dom } from "ion-js";

import { getQldbDriver } from "./ConnectToLedger";
import { log } from "./qldb/LogUtil";

/**
 * Pretty print Ion values in the provided result list.
 * @param resultList The result list containing Ion values to pretty print.
 */
export function prettyPrintResultList(resultList: dom.Value[]): void {
    log(JSON.stringify(resultList, null, 2));
}

/**
 * Scan for all the documents in a table.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param tableName The name of the table to operate on.
 * @returns Promise which fulfills with a {@linkcode Result} object.
 */
export async function scanTableForDocuments(txn: TransactionExecutor, tableName: string): Promise<Result> {
    log(`Scanning ${tableName}...`);
    const query: string = `SELECT * FROM ${tableName}`;
    return await txn.execute(query).then((result: Result) => {
        return result;
    });
}

/**
 * Scan for all the documents in a table.
 * @returns Promise which fulfills with void.
 */
export const main = async function(): Promise<void> {
    try {
        const qldbDriver: QldbDriver = getQldbDriver();
        await qldbDriver.getTableNames().then(async (listOfTables: string[]) => {
            for (const tableName of listOfTables) {
                await qldbDriver.executeLambda(async (txn: TransactionExecutor) => {
                    const result: Result = await scanTableForDocuments(txn, tableName);
                    prettyPrintResultList(result.getResultList());
                });
            }
        });
    } catch (e) {
        log(`Error displaying documents: ${e}`);
    }
}

if (require.main === module) {
    main();
}
