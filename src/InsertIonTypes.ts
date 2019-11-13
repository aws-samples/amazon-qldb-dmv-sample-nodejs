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

import { createQldbWriter, QldbSession, QldbWriter, Result, TransactionExecutor } from "amazon-qldb-driver-nodejs";
import { AssertionError } from "assert";
import { Decimal, IonType, IonTypes, Reader, Timestamp } from "ion-js";

import { insertDocument } from "./InsertDocument";
import { closeQldbSession, createQldbSession } from "./ConnectToLedger";
import { createTable } from "./CreateTable";
import { error, log } from "./qldb/LogUtil";

const TABLE_NAME: string = "IonTypes";

/**
 * Delete a table.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param tableName Name of the table to delete.
 * @returns Promise which fulfills with void.
 */
export async function deleteTable(txn: TransactionExecutor, tableName: string): Promise<void> {
    log(`Deleting ${tableName} table...`);
    const statement: string = `DROP TABLE ${tableName}`;
    await txn.executeInline(statement);
    log(`${tableName} table successfully deleted.`);
}

/**
 * Update a document's Name value in QLDB. Then, query the value of the Name key and verify the expected Ion type was
 * saved.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param parameters The IonValue to set the document's Name value to.
 * @param ionType The Ion type that the Name value should be.
 * @returns Promise which fulfills with void.
 */
async function updateRecordAndVerifyType(
    txn: TransactionExecutor,
    parameters: QldbWriter[],
    ionType: IonType
): Promise<void> {
    const updateStatement: string = `UPDATE ${TABLE_NAME} SET Name = ?`;
    await txn.executeInline(updateStatement, parameters);
    log("Updated record.");

    const searchStatement: string = `SELECT VALUE Name FROM ${TABLE_NAME}`;
    const result: Result = await txn.executeInline(searchStatement);

    const resultReaders: Reader[] = result.getResultList();

    if (0 === resultReaders.length) {
        throw new AssertionError({
            message: "Did not find any values for the Name key."
        });
    }

    resultReaders.forEach((reader: Reader) => {
        if (reader.next().binaryTypeId !== ionType.binaryTypeId) {
            throw new AssertionError({
                message: `The queried value type, ${reader.type().name}, does not match expected type, ${ionType.name}.`
            });
        }
    });

    log(`Successfully verified value is of type ${ionType.name}.`);
}

/**
 * Insert all the supported Ion types into a table and verify that they are stored and can be retrieved properly,
 * retaining their original properties.
 * @returns Promise which fulfills with void.
 */
var main = async function(): Promise<void> {
    const ionNull: QldbWriter = createQldbWriter();
    ionNull.writeNull(IonTypes.NULL);

    const ionBool: QldbWriter = createQldbWriter();
    ionBool.writeBoolean(true);

    const ionInt: QldbWriter = createQldbWriter();
    ionInt.writeInt(1);

    const ionFloat32: QldbWriter = createQldbWriter();
    ionFloat32.writeFloat32(3.2);
    
    const ionFloat64: QldbWriter = createQldbWriter();
    ionFloat64.writeFloat32(6.4);

    const ionDecimal: QldbWriter = createQldbWriter();
    ionDecimal.writeDecimal(new Decimal(1, -1));

    const ionTimestamp: QldbWriter = createQldbWriter();
    ionTimestamp.writeTimestamp(new Timestamp(0, 2000));

    const ionSymbol: QldbWriter = createQldbWriter();
    ionSymbol.writeSymbol("abc123");

    const ionString: QldbWriter = createQldbWriter();
    ionString.writeString("string");

    const ionClob: QldbWriter = createQldbWriter();
    ionClob.writeClob(new Uint8Array());

    const ionBlob: QldbWriter = createQldbWriter();
    ionBlob.writeBlob(new Uint8Array());

    const ionList: QldbWriter = createQldbWriter();
    ionList.stepIn(IonTypes.LIST);
    ionList.writeInt(1);
    ionList.stepOut();

    const ionSexp: QldbWriter = createQldbWriter();
    ionSexp.stepIn(IonTypes.SEXP);
    ionSexp.writeInt(1);
    ionSexp.stepOut();
    
    const ionStruct: QldbWriter = createQldbWriter();
    ionStruct.stepIn(IonTypes.STRUCT);
    ionStruct.writeFieldName("brand");
    ionStruct.writeString("Ford");
    ionStruct.stepOut();

    let session: QldbSession;
    try {
        session = await createQldbSession();
        session.executeLambda(async (txn: TransactionExecutor) => {
            await createTable(txn, TABLE_NAME);
            await insertDocument(txn, TABLE_NAME, [{ "Name": "val" }]);
            await updateRecordAndVerifyType(txn, [ionNull], IonTypes.NULL);
            await updateRecordAndVerifyType(txn, [ionBool], IonTypes.BOOL);
            await updateRecordAndVerifyType(txn, [ionInt], IonTypes.INT);
            await updateRecordAndVerifyType(txn, [ionFloat32], IonTypes.FLOAT);
            await updateRecordAndVerifyType(txn, [ionFloat64], IonTypes.FLOAT);
            await updateRecordAndVerifyType(txn, [ionDecimal], IonTypes.DECIMAL);
            await updateRecordAndVerifyType(txn, [ionTimestamp], IonTypes.TIMESTAMP);
            await updateRecordAndVerifyType(txn, [ionSymbol], IonTypes.SYMBOL);
            await updateRecordAndVerifyType(txn, [ionString], IonTypes.STRING);
            await updateRecordAndVerifyType(txn, [ionClob], IonTypes.CLOB);
            await updateRecordAndVerifyType(txn, [ionBlob], IonTypes.BLOB);
            await updateRecordAndVerifyType(txn, [ionList], IonTypes.LIST);
            await updateRecordAndVerifyType(txn, [ionSexp], IonTypes.SEXP);
            await updateRecordAndVerifyType(txn, [ionStruct], IonTypes.STRUCT);
            await deleteTable(txn, TABLE_NAME);
        });
    } catch (e) {
        error(`Error updating and validating Ion types: ${e}`);
    } finally {
        closeQldbSession(session);
    }
}

if (require.main === module) {
    main();
}
