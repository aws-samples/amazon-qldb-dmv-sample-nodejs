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

import { QldbSession, Result, TransactionExecutor } from "amazon-qldb-driver-nodejs";
import { dom } from "ion-js";

import { closeQldbSession, createQldbSession } from "./ConnectToLedger";
import { insertDocument } from "./InsertDocument";
import { PERSON_TABLE_NAME } from "./qldb/Constants";
import { error, log } from "./qldb/LogUtil";
import { getDocumentId } from "./qldb/Util";

/**
 * Verify whether a driver already exists in the database.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param govId The government ID of the new owner.
 * @returns Promise which fulfills with a boolean.
 */
async function personAlreadyExists(txn: TransactionExecutor, govId: string): Promise<boolean> {
    const query: string = "SELECT * FROM Person AS p WHERE p.GovId = ?";

    let personAlreadyExists: boolean = true;
    await txn.execute(query, govId).then((result: Result) => {
        const resultList: dom.Value[] = result.getResultList();
        if (resultList.length === 0) {
            personAlreadyExists = false;
        }
    });
    return personAlreadyExists;
}

/**
 * Query drivers license table by person ID.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param personId The person ID to check.
 * @returns Promise which fulfills with a {@linkcode Result} object.
 */
export async function lookUpDriversLicenseForPerson(txn: TransactionExecutor, personId: string): Promise<Result> {
    const query: string = "SELECT * FROM DriversLicense AS d WHERE d.PersonId = ?";
    const result: Result = await txn.execute(query, personId);
    return result;
}

/**
 * Verify whether a driver has a driver's license in the database.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param personId The unique personId of the new owner.
 * @returns Promise which fulfills with a boolean.
 */
async function personHasDriversLicense(txn: TransactionExecutor, personId: string): Promise<boolean> {
    const result: Result = await lookUpDriversLicenseForPerson(txn, personId);
    return result.getResultList().length !== 0;
}

/**
 * Register a new driver in the QLDB database.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param driver The new driver to register.
 * @returns Promise which fulfills with a {@linkcode Result} object.
 */
async function registerNewDriver(txn: TransactionExecutor, driver: any): Promise<Result> {
    const result: Result = await insertDocument(txn, PERSON_TABLE_NAME, driver);
    return result;
}

/**
 * Register a new driver and a new driver's license in a single transaction.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param license The driver's license to register.
 * @param personId The unique personId of the new owner.
 * @returns Promise which fulfills with void.
 */
async function registerNewDriversLicense(txn: TransactionExecutor, license: any, personId: string): Promise<void> {
    if (await personHasDriversLicense(txn, personId)) {
        log("Person already has a license! No new license added.");
        return;
    }
    const statement: string = "INSERT INTO DriversLicense ?";
    await txn.execute(statement, license).then((result: Result) => {
        log("Successfully registered new license.");
    });
}

/**
 * Register a new driver's license.
 * @returns Promise which fulfills with void.
 */
var main = async function(): Promise<void> {
    let session: QldbSession;
    try {
        session = await createQldbSession();
        let documentId: string;

        const newPerson = {
            FirstName: "Kate",
            LastName: "Mulberry",
            Address: "22 Commercial Drive, Blaine, WA, 97722",
            DOB: new Date("1995-02-09"),
            GovId: "AQQ17B2342",
            GovIdType: "Passport"
        };
        const newLicense = {
            PersonId: "",
            LicenseNumber: "112 360 PXJ",
            LicenseType: "Full",
            ValidFromDate: new Date("2018-06-30"),
            ValidToDate: new Date("2022-10-30")
        };
        await session.executeLambda(async (txn) => {
            if (await personAlreadyExists(txn, newPerson.GovId)) {
                log("Person with this GovId already exists.");
                documentId = await getDocumentId(txn, PERSON_TABLE_NAME, "GovId", newPerson.GovId);
            } else {
                const documentIdResult: Result = await registerNewDriver(txn, newPerson);
                documentId = documentIdResult.getResultList()[0].get("documentId").stringValue();
            }
            newLicense.PersonId = documentId;
            await registerNewDriversLicense(txn, newLicense, documentId);
        }, () => log("Retrying due to OCC conflict..."));
    } catch (e) {
        error(`Unable to register drivers license: ${e}`);
    } finally {
        closeQldbSession(session);
    }
}

if (require.main === module) {
    main();
}
