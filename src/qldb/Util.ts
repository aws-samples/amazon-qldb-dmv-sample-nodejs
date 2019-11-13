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

import { createQldbWriter, QldbWriter, Result, TransactionExecutor } from "amazon-qldb-driver-nodejs";
import { GetBlockResponse, GetDigestResponse, ValueHolder } from "aws-sdk/clients/qldb";
import { 
    Decimal, 
    decodeUtf8, 
    IonTypes, 
    makePrettyWriter, 
    makeReader, 
    Reader, 
    Timestamp, 
    toBase64, 
    Writer 
} from "ion-js";

import { error } from "./LogUtil";


/**
 * Returns the string representation of a given BlockResponse.
 * @param blockResponse The BlockResponse to convert to string.
 * @returns The string representation of the supplied BlockResponse.
 */
export function blockResponseToString(blockResponse: GetBlockResponse): string {
    let stringBuilder: string = "";
    if (blockResponse.Block.IonText) {
        stringBuilder = stringBuilder + "Block: " + blockResponse.Block.IonText + ", ";
    }
    if (blockResponse.Proof.IonText) {
        stringBuilder = stringBuilder + "Proof: " + blockResponse.Proof.IonText;
    }
    stringBuilder = "{" + stringBuilder + "}";
    const writer: Writer = makePrettyWriter();
    const reader: Reader = makeReader(stringBuilder);
    writer.writeValues(reader);
    return decodeUtf8(writer.getBytes());
}

/**
 * Returns the string representation of a given GetDigestResponse.
 * @param digestResponse The GetDigestResponse to convert to string.
 * @returns The string representation of the supplied GetDigestResponse.
 */
export function digestResponseToString(digestResponse: GetDigestResponse): string {
    let stringBuilder: string = "";
    if (digestResponse.Digest) {
        stringBuilder += "Digest: " + JSON.stringify(toBase64(<Uint8Array> digestResponse.Digest)) + ", ";
    }
    if (digestResponse.DigestTipAddress.IonText) {
        stringBuilder += "DigestTipAddress: " + digestResponse.DigestTipAddress.IonText;
    }
    stringBuilder = "{" + stringBuilder + "}";
    const writer: Writer = makePrettyWriter();
    const reader: Reader = makeReader(stringBuilder);
    writer.writeValues(reader);
    return decodeUtf8(writer.getBytes());
}

/**
 * Get the document IDs from the given table.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param tableName The table name to query.
 * @param field A field to query.
 * @param value The key of the given field.
 * @returns Promise which fulfills with the document ID as a string.
 */
export async function getDocumentId(
    txn: TransactionExecutor,
    tableName: string,
    field: string,
    value: string
): Promise<string> {
    const query: string = `SELECT id FROM ${tableName} AS t BY id WHERE t.${field} = ?`;
    const parameter: QldbWriter = createQldbWriter();
    parameter.writeString(value);
    let documentId: string;
    await txn.executeInline(query, [parameter]).then((result: Result) => {
        const resultList: Reader[] = result.getResultList();
        if (resultList.length === 0) {
            throw new Error(`Unable to retrieve document ID using ${value}.`);
        }
        documentId = getFieldValue(resultList[0], ["id"]);
    }).catch((err) => {
        error(`Error getting documentId: ${err}`);
    });
    return documentId;
}

/**
 * Function which, given a reader and a path, traverses through the reader using the path to find the value.
 * @param ionReader The reader to operate on.
 * @param path The path to find the value.
 * @returns The value obtained after traversing the path.
 */
export function getFieldValue(ionReader: any, path: string[]): any {
    ionReader.next();
    ionReader.stepIn();
    return recursivePathLookup(ionReader, path);
}

/**
 * Helper method that traverses through the reader using the path to find the value.
 * @param ionReader The reader to operate on.
 * @param path The path to find the value.
 * @returns The value, or undefined if the provided path does not exist.
 */
export function recursivePathLookup(ionReader: Reader, path: string[]): any | undefined {
    if (path.length === 0) {
        // If the path's length is 0, the current ionReader node is the value which should be returned.
        if (ionReader.type() === IonTypes.LIST) {
            const list: any[] = [];
            ionReader.stepIn(); // Step into the list.
            while (ionReader.next() != null) {
                const itemInList: any = recursivePathLookup(ionReader, []);
                list.push(itemInList);
            }

            return list;
        } else if (ionReader.type() === IonTypes.STRUCT) {
            const structToReturn: any = {};

            let type: any;
            const currentDepth: any = ionReader.depth();
            ionReader.stepIn();
            while (ionReader.depth() > currentDepth) {
                // In order to get all values within the struct, we need to visit every node.
                type = ionReader.next();
                if (type === null) {
                    // End of the container indicates that we need to step out.
                    ionReader.stepOut();
                } else {
                    structToReturn[ionReader.fieldName()] = recursivePathLookup(ionReader, []);
                }
            }
            return structToReturn;
        }
        return ionReader.value();
    } else if (path.length === 1) {
        // If the path's length is 1, the single value in the path list is the field should to be returned.

        while (ionReader.next() != null) {
            if (ionReader.fieldName() === path[0]) {
                path.shift(); // Remove the path node which we just entered.
                return recursivePathLookup(ionReader, path);
            }
        }
    } else {
        // If the path's length >= 2, the Ion tree needs to be traversed more to find the value we're looking for.

        while (ionReader.next() != null) {

            if (ionReader.fieldName() === path[0]) {
                ionReader.stepIn(); // Step into the IonStruct.
                path.shift(); // Remove the path node which we just entered.
                return recursivePathLookup(ionReader, path);
            }
        }
    }
    // If the path doesn't exist, return undefined.
    return undefined;
}

/**
 * Sleep for the specified amount of time.
 * @param ms The amount of time to sleep in milliseconds.
 * @returns Promise which fulfills with void.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Returns the string representation of a given ValueHolder.
 * @param valueHolder The ValueHolder to convert to string.
 * @returns The string representation of the supplied ValueHolder.
 */
export function valueHolderToString(valueHolder: ValueHolder): string {
    const stringBuilder: string = `{ IonText: ${valueHolder.IonText}}`;
    const writer: Writer = makePrettyWriter();
    const reader: Reader = makeReader(stringBuilder);
    writer.writeValues(reader);
    return decodeUtf8(writer.getBytes());
}

/**
 * Converts a given value to Ion using the provided writer.
 * @param value The value to covert to Ion.
 * @param ionWriter The Writer to pass the value into.
 * @throws Error: If the given value cannot be converted to Ion.
 */
export function writeValueAsIon(value: any, ionWriter: Writer): void {
    switch (typeof value) {
        case "string":
            ionWriter.writeString(value);
            break;
        case "boolean":
            ionWriter.writeBoolean(value);
            break;
        case "number":
                ionWriter.writeInt(value);
                break;
        case "object":
            if (Array.isArray(value)) {
                // Object is an array.
                ionWriter.stepIn(IonTypes.LIST);

                for (const element of value) {
                    writeValueAsIon(element, ionWriter);
                }

                ionWriter.stepOut();
            } else if (value instanceof Date) {
                // Object is a Date.
                ionWriter.writeTimestamp(Timestamp.parse(value.toISOString()));
            } else if (value instanceof Decimal) {
                // Object is a Decimal.
                ionWriter.writeDecimal(value);
            } else if (value === null) {
                ionWriter.writeNull(IonTypes.NULL);
            } else {
                // Object is a struct.
                ionWriter.stepIn(IonTypes.STRUCT);

                for (const key of Object.keys(value)) {
                    ionWriter.writeFieldName(key);
                    writeValueAsIon(value[key], ionWriter);
                }
                ionWriter.stepOut();
            }
            break;
        default:
            throw new Error(`Cannot convert to Ion for type: ${(typeof value)}.`);
    }
}
