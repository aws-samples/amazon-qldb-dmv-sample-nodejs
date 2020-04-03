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

import { isOccConflictException, QldbSession, Transaction } from "amazon-qldb-driver-nodejs";

import { closeQldbSession, createQldbSession } from "./ConnectToLedger";
import { VEHICLE_REGISTRATION } from "./model/SampleData";
import { RETRY_LIMIT } from "./qldb/Constants";
import { error, log } from "./qldb/LogUtil";

/**
 * Commit the transaction and retry up to a constant number of times.
 * @param session A QLDB session.
 * @param transaction An open transaction.
 * @param statement The query to execute.
 * @param parameter The paramater to use for the query.
 * @returns Promise which fulfills with void.
 */
async function commitTransaction(
    session: QldbSession,
    transaction: Transaction,
    statement: string,
    parameter: string
): Promise<void> {
    for (let i = 0; i < RETRY_LIMIT; i++) {
        try {
            await transaction.commit();
            log(`Commit successful after ${i} retries.`);
            break;
        }
        catch (e) {
            if (isOccConflictException(e)) {
                log("Commit on transaction failed due to an OCC conflict. Restarting transaction...");
                transaction = await session.startTransaction();
                await executeTransaction(session, transaction, statement, parameter);
            }
        }
    }
}

/**
 * Execute statement. If it was unsuccessful, retry with a new transaction.
 * @param session A QLDB session.
 * @param transaction An open transaction.
 * @param statement The query to execute.
 * @param parameter The paramater to use for the query.
 * @returns Promise which fulfills with void.
 */
async function executeTransaction(
    session: QldbSession,
    transaction: Transaction,
    statement: string,
    parameter: string
): Promise<void> {
    for (let i = 0; i < RETRY_LIMIT; i++) {
        try {
            await transaction.execute(statement, parameter);
            log(`Execute successful after ${i} retries.`);
            break;
        }
        catch (e) {
            if (isOccConflictException(e)) {
                log("Transaction execution failed due to an OCC conflict. Restart transaction.");
                transaction = await session.startTransaction();
            }
        }
    }
}

/**
 * Demonstrates how to handle OCC conflicts, where two users try to execute and commit changes to the same document.
 * When OCC conflict occurs on execute or commit, implicitly handled by restarting the transaction.
 * In this example, two sessions on the same ledger try to access the registration city for the same Vehicle Id.
 * @returns Promise which fulfills with void.
 */
var main = async function(): Promise<void> {
    let session1: QldbSession;
    let session2: QldbSession;
    try {
        session1 = await createQldbSession();
        session2 = await createQldbSession();

        const t1: Transaction = await session1.startTransaction();
        const t2: Transaction = await session2.startTransaction();
        const vehicleVin: string = VEHICLE_REGISTRATION[0].VIN;
        const statement1: string = "UPDATE VehicleRegistration AS r SET r.City = 'Tukwila' WHERE r.VIN = ?";
        const statement2: string = "SELECT * FROM VehicleRegistration AS r WHERE r.VIN = ?";

        log("Updating the registration city on transaction 1...");
        log("Selecting the registrations on transaction 2...");
        log("Executing transaction 1");
        log("Executing transaction 2");
        await Promise.all([
            executeTransaction(session1, t1, statement1, vehicleVin),
            executeTransaction(session2, t2, statement2, vehicleVin)
        ]).then(async (values) => {
            log("Committing transaction 1...");
            log("Committing transaction 2...");
            await Promise.all([
                commitTransaction(session1, t1, statement1, vehicleVin),
                // The first attempt to commit on t2 will fail due to an OCC conflict.
                commitTransaction(session2, t2, statement2, vehicleVin)
            ]);
        });
    } catch (e) {
        error(`Unable to execute or commit transactions: ${e}`);
    } finally {
        closeQldbSession(session1);
        closeQldbSession(session2);
    }
}

if (require.main === module) {
    main();
}
