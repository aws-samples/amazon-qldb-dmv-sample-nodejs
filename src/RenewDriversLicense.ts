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
import { DRIVERS_LICENSE } from "./model/SampleData";
import { error, log } from "./qldb/LogUtil";
import { prettyPrintResultList } from "./ScanTable";

/**
 * Get the PersonId of a driver's license using the given license number.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param licenseNumber License number of the driver's license to query.
 * @returns Promise which fulfills with a PersonId as a string.
 */
async function getPersonIdFromLicenseNumber(txn: TransactionExecutor, licenseNumber: string): Promise<string> {
    const query: string = "SELECT PersonId FROM DriversLicense WHERE LicenseNumber = ?";
    let personId: string;

    await txn.execute(query, licenseNumber).then((result: Result) => {
        const resultList: dom.Value[] = result.getResultList();
        if (resultList.length === 0) {
            throw new Error(`Unable to find person with ID: ${licenseNumber}.`);
        }

        const PersonIdValue: dom.Value = resultList[0].get("PersonId");
        if (PersonIdValue === null) {
            throw new Error(`Expected field name PersonId not found.`);
        }
        personId = PersonIdValue.stringValue();
    });
    return personId;
}

/**
 * Renew the ValidToDate and ValidFromDate of a driver's license.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param validFromDate The new ValidFromDate.
 * @param validToDate The new ValidToDate.
 * @param licenseNumber License number of the driver's license to update.
 * @returns Promise which fulfills with {@linkcode Result} object.
 */
export async function renewDriversLicense(
    txn: TransactionExecutor,
    validFromDate: Date,
    validToDate: Date,
    licenseNumber: string
): Promise<Result> {
    const statement: string =
        "UPDATE DriversLicense AS d SET d.ValidFromDate = ?, d.ValidToDate = ? WHERE d.LicenseNumber = ?";

    return await txn.execute(statement, validFromDate, validToDate, licenseNumber).then((result: Result) => {
        log("DriversLicense Document IDs which had licenses renewed: ");
        prettyPrintResultList(result.getResultList());
        return result;
    });
}

/**
 *  Verify whether a driver exists in the system using the given license number.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param personId The unique personId of a driver.
 * @returns Promise which fulfills with a boolean.
 */
async function verifyDriverFromLicenseNumber(txn: TransactionExecutor, personId: string): Promise<boolean> {
    log(`Finding person with person ID: ${personId}`);
    const query: string = "SELECT p.* FROM Person AS p BY pid WHERE pid = ?";

    return await txn.execute(query, personId).then((result: Result) => {
        const resultList: dom.Value[] = result.getResultList();
        if (resultList.length === 0) {
            log(`Unable to find person with ID: ${personId}`);
            return false;
        }
        return true;
    });
}

/**
 * Find the person associated with a license number.
 * Renew a driver's license.
 * @returns Promise which fulfills with void.
 */
var main = async function(): Promise<void> {
    let session: QldbSession;
    try {
        session = await createQldbSession();
        const fromDate: Date = new Date("2019-04-19");
        const toDate: Date = new Date("2023-04-19");
        const licenseNumber: string = DRIVERS_LICENSE[0].LicenseNumber;

        await session.executeLambda(async (txn) => {
            const personId: string = await getPersonIdFromLicenseNumber(txn, licenseNumber);
            if (await verifyDriverFromLicenseNumber(txn, personId)) {
                await renewDriversLicense(txn, fromDate, toDate, licenseNumber);
            }
        }, () => log("Retrying due to OCC conflict..."));
    } catch (e) {
        error(`Unable to renew drivers license: ${e}`);
    } finally {
        closeQldbSession(session);
    }
}

if (require.main === module) {
    main();
}
