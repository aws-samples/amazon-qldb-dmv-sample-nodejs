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

import { isResourcePreconditionNotMetException } from "amazon-qldb-driver-nodejs";
import { QLDB, 
    CreateLedgerRequest,
    CreateLedgerResponse,
    UpdateLedgerRequest,
    UpdateLedgerResponse,
 } from "@aws-sdk/client-qldb";
import { ServiceException } from "@aws-sdk/smithy-client";

import { waitForActive } from "./CreateLedger"
import { deleteLedger } from "./DeleteLedger"
import { error, log } from "./qldb/LogUtil";

const LEDGER_NAME = "deletion-protection-demo";

/**
 * Create a new ledger with the specified name and with deletion protection enabled.
 * @param ledgerName  Name of the ledger to be created.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a CreateLedgerResponse.
 */
async function createWithDeletionProtection(ledgerName: string, qldbClient: QLDB): Promise<CreateLedgerResponse> {
    log(`Creating a ledger named: ${ledgerName}...`);
    const request: CreateLedgerRequest = {
        Name: ledgerName,
        PermissionsMode: "ALLOW_ALL"
    };
    const result: CreateLedgerResponse = await qldbClient.createLedger(request);
    log(`Success. Ledger state: ${result.State}.`);
    return result;
}

/**
 * Update an existing ledger's deletion protection.
 * @param ledgerName Name of the ledger to update.
 * @param qldbClient The QLDB control plane client to use.
 * @param deletionProtection Enables or disables the deletion protection.
 * @returns Promise which fulfills with void.
 */
export async function setDeletionProtection(
    ledgerName: string, 
    qldbClient: QLDB, 
    deletionProtection: boolean
): Promise<UpdateLedgerResponse> {
    log(`Let's set deletion protection to ${deletionProtection} for the ledger with name ${ledgerName}.`);
    const request: UpdateLedgerRequest = {
        Name: ledgerName,
        DeletionProtection: deletionProtection
    };
    const result: UpdateLedgerResponse = await qldbClient.updateLedger(request);
    log(`Success. Ledger updated: ${JSON.stringify(result)}."`);
    return result;
}

/**
 * Demonstrate the protection of QLDB ledgers against deletion.
 * @returns Promise which fulfills with void.
 */
export const main = async function(ledgerName: string = LEDGER_NAME): Promise<UpdateLedgerResponse> {
    try {
        const qldbClient: QLDB = new QLDB({ });
        await createWithDeletionProtection(ledgerName, qldbClient);
        await waitForActive(ledgerName, qldbClient);
        await deleteLedger(ledgerName, qldbClient).catch((error: ServiceException) => {
            if (isResourcePreconditionNotMetException(error)) {
                log("Ledger protected against deletions!");
            }
        });
        const updateDeletionProtectionResult = await setDeletionProtection(ledgerName, qldbClient, false);
        await deleteLedger(ledgerName, qldbClient);
        return updateDeletionProtectionResult;
    } catch (e) {
        error(`Unable to update or delete the ledger: ${e}`);
    }
}

if (require.main === module) {
    main();
}
