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
import { DRIVERS_LICENSE } from "./model/SampleData";
import { error, log } from "./qldb/LogUtil";

/**
 * Delete a driver's license given a license number.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param licenseNumber The license number of the driver's license to de-register.
 * @returns Promise which fulfills with void.
 */
export async function deregisterDriversLicense(txn: TransactionExecutor, licenseNumber: string): Promise<dom.Value[]> {
    const statement: string = "DELETE FROM DriversLicense AS d WHERE d.LicenseNumber = ?";

    return await txn.execute(statement, licenseNumber).then((result: Result) => {
        const resultList: dom.Value[] = result.getResultList();
        if (resultList.length !== 0) {
            log(`Successfully de-registered license: ${licenseNumber}.`);
        } else {
            log(`Error de-registering license, license ${licenseNumber} not found.`);
        }
        return resultList;
    });
}

/**
 * De-register a driver's license.
 * @returns Promise which fulfills with void.
 */
export const main = async function(): Promise<dom.Value[]> {
    try {
        const qldbDriver: QldbDriver = getQldbDriver();
        return await qldbDriver.executeLambda(async (txn: TransactionExecutor) => {
            return await deregisterDriversLicense(txn, DRIVERS_LICENSE[1].LicenseNumber);
        });
    } catch (e) {
        error(`Error de-registering driver's license: ${e}`);
    }
}

if (require.main === module) {
    main();
}
