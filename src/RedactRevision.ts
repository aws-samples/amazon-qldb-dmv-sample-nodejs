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
import { PERSON, VEHICLE } from "./model/SampleData";
import { PERSON_TABLE_NAME, VEHICLE_REGISTRATION_TABLE_NAME } from "./qldb/Constants";
import { error, log } from "./qldb/LogUtil";
import { getDocumentId, sleep } from "./qldb/Util";
import { validateAndUpdateRegistration } from "./TransferVehicleOwnership";
import { prettyPrintResultList } from "./ScanTable";

/**
 * Query the information schema to get the tableId for a table with the provided table name.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param tableName The table name to find a tableId for.
 * @return Promise which fulfills with the tableId string.
 */
export async function getTableId(txn: TransactionExecutor, tableName: string): Promise<string> {
    log(`Getting the tableId for table with name: ${tableName}`);
    const query: string = "SELECT VALUE tableId FROM information_schema.user_tables WHERE name = ?";

    let tableId: string;
    await txn.execute(query, tableName).then((result: Result) => {
        const resultList: dom.Value[] = result.getResultList();
        if (resultList.length == 0) {
            throw new Error(`Unable to find table with name: ${tableName}.`);
        }
        tableId = resultList[0].stringValue();
    });
    return tableId;
}

/**
 * Find the previous vehicle registration with the provided Primary Owner.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param registrationDocumentId The unique ID of the vehicle registration document in the VehicleRegistration table.
 * @param ownerDocumentId The unique ID of the primary owner for this vehicle registration.
 * @return Promise which fulfills with an Ion value containing the historic registration.
 */
export async function getHistoricRegistrationByOwner(
    txn: TransactionExecutor,
    registrationDocumentId: string,
    ownerDocumentId: string
): Promise<dom.Value> {
    log(`Querying the 'VehicleRegistration' table's history for a registration with documentId: ${registrationDocumentId} and owner: ${ownerDocumentId}`);
    const query: string =
        `SELECT * FROM history(${VEHICLE_REGISTRATION_TABLE_NAME}) AS h ` +
        `WHERE h.metadata.id = '${registrationDocumentId}' ` +
        `AND h.data.Owners.PrimaryOwner.PersonId = '${ownerDocumentId}'`;

    let revision: dom.Value;
    await txn.execute(query).then((result: Result) => {
        const resultList: dom.Value[] = result.getResultList();
        if (resultList.length == 0) {
            throw new Error(`Unable to find a historic registration with documentId: ${registrationDocumentId} and owner: ${ownerDocumentId}.`);
        } else if (resultList.length > 1) {
            throw new Error(`Found more than 1 historic registrations with documentId: ${registrationDocumentId} and owner: ${ownerDocumentId}.`)
        }
        prettyPrintResultList(resultList);
        revision = resultList[0];
    });
    return revision;
}

/**
 * Find the previous vehicle registration with the provided document version.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param registrationDocumentId The unique ID of the vehicle registration document in the VehicleRegistration table.
 * @param version The document version of the vehicle registration document.
 * @return Promise which fulfills with an Ion value containing the historic registration.
 */
export async function getHistoricRegistrationByVersion(
    txn: TransactionExecutor,
    registrationDocumentId: string,
    version: number
): Promise<dom.Value> {
    log(`Querying the 'VehicleRegistration' table's history for a registration with documentId: ${registrationDocumentId} and version: ${version}`);
    const query: string =
        `SELECT * FROM history(${VEHICLE_REGISTRATION_TABLE_NAME}) AS h ` +
        `WHERE h.metadata.id = '${registrationDocumentId}' ` +
        `AND h.metadata.version = ${version}`;

    let revision: dom.Value;
    await txn.execute(query).then((result: Result) => {
        const resultList: dom.Value[] = result.getResultList();
        if (resultList.length == 0) {
            throw new Error(`Unable to find a historic registration with documentId: ${registrationDocumentId} and version: ${version}.`);
        }
        prettyPrintResultList(resultList);
        revision = resultList[0];
    });
    return revision;
}

/**
 * Redact the historic version of a vehicle registration with the provided VIN and Owner.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param vin The VIN for which a historic revision will be redacted.
 * @param previousOwnerGovId The previous owner of the vehicle registration.
 * @return Promise which fulfills with an Ion value containing details about the redaction.
 */
export async function redactPreviousRegistration(
    txn: TransactionExecutor,
    vin: string,
    previousOwnerGovId: string
): Promise<dom.Value> {
    let redactRequest: dom.Value;

    const tableId: string = await getTableId(txn, VEHICLE_REGISTRATION_TABLE_NAME);
    const registrationDocumentId: string = await getDocumentId(txn, VEHICLE_REGISTRATION_TABLE_NAME, 'VIN', vin);
    const previousOwnerDocumentId: string = await getDocumentId(txn, PERSON_TABLE_NAME, 'GovId', previousOwnerGovId);
    const historicRegistration = await getHistoricRegistrationByOwner(txn, registrationDocumentId, previousOwnerDocumentId);
    const blockAddress = historicRegistration.get("blockAddress");

    log(`Redacting the revision at blockAddress: ${blockAddress} with tableId: ${tableId} and documentId: ${registrationDocumentId}`);
    const query: string = `EXEC redact_revision ?, '${tableId}', '${registrationDocumentId}'`;
    await txn.execute(query, blockAddress).then((result: Result) => {
        const resultList: dom.Value[] = result.getResultList();
        if (resultList.length == 0) {
            throw new Error(`Unable to redact the historic registration.`);
        }
        prettyPrintResultList(resultList);
        redactRequest = resultList[0];
    });

    return redactRequest;
}

/**
 * Wait until the redaction is complete by querying history.
 * @param driver The driver for creating sessions.
 * @param redactRequest The Ion value containing details about the redaction.
 * @return Promise which fulfills with void.
 */
export async function waitUntilRevisionRedacted(driver: QldbDriver, redactRequest: dom.Value): Promise<void> {
    let isRedacted: boolean = false;

    while (!isRedacted) {
        await driver.executeLambda(async (txn: TransactionExecutor) => {
            const revision = await getHistoricRegistrationByVersion(
                txn,
                redactRequest.get("documentId").stringValue(),
                redactRequest.get("version").numberValue()
            );

            if (revision.get("dataHash") != null && revision.get("data") == null) {
                log(`Revision was successfully redacted!`);
                isRedacted = true;
            }
        });
        if (!isRedacted) {
            log(`Revision is not yet redacted. Waiting for some time.`);
            await sleep(10000);
        }
    }
}

/**
 * Transfer a vehicle registration to another owner and then redact
 * the previous revision of the vehicle registration.
 * @returns Promise which fulfills with void.
 */
const main = async function(): Promise<void> {
    try {
        const qldbDriver: QldbDriver = getQldbDriver();

        const vin: string = VEHICLE[1].VIN;
        const previousOwnerGovId: string = PERSON[1].GovId;
        const newPrimaryOwnerGovId: string = PERSON[2].GovId;

        await qldbDriver.executeLambda(async (txn: TransactionExecutor) => {
            await validateAndUpdateRegistration(txn, vin, previousOwnerGovId,  newPrimaryOwnerGovId);
        });

        const redactRequest: dom.Value = await qldbDriver.executeLambda<dom.Value>(async (txn: TransactionExecutor) => {
            return await redactPreviousRegistration(txn, vin, previousOwnerGovId);
        });

        await waitUntilRevisionRedacted(qldbDriver, redactRequest);
    } catch (e) {
        error(`Unable to connect and run queries: ${e}`);
    }
}

if (require.main === module) {
    main();
}
