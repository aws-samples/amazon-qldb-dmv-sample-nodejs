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

import { ValueHolder } from "aws-sdk/clients/qldb";
import { Reader } from "ion-js";

export class BlockAddress {
    _strandId: string;
    _sequenceNo: number;

    constructor(strandId: string, sequenceNo: number) {
        this._strandId = strandId;
        this._sequenceNo = sequenceNo;
    }
}

/**
 * Convert a block address from Reader into a ValueHolder.
 * Shape of the ValueHolder must be: {'IonText': "{strandId: <"strandId">, sequenceNo: <sequenceNo>}"}
 * @param reader The Reader that contains the block address values to convert.
 * @returns The ValueHolder that contains the strandId and sequenceNo.
 */
export function blockAddressToValueHolder(reader: Reader): ValueHolder {
    const strandId: string = getStrandId(reader);
    const sequenceNo: number = getSequenceNo(reader);
    const valueHolder: string = `{strandId: "${strandId}", sequenceNo: ${sequenceNo}}`;
    const blockAddress: ValueHolder = {IonText: valueHolder};
    return blockAddress;
}

/**
 * Helper method that steps into the provided Reader to get the Metadata ID.
 * @param reader The Reader to step into.
 * @returns The Metadata ID.
 */
export function getMetadataId(reader: Reader): string {
    reader.stepOut();
    reader.next();
    return reader.stringValue();
}

/**
 * Helper method that steps into the provided Reader to get the Sequence No.
 * @param reader The Reader to step into.
 * @returns The Sequence No.
 */
export function getSequenceNo(reader: Reader): number {
    reader.next();
    const fieldName: string = reader.fieldName();
    if (fieldName !== "sequenceNo") {
        throw new Error(`Expected field name sequenceNo, found ${fieldName}.`);
    }
    return reader.numberValue();
}

/**
 * Helper method that steps into the provided Reader to get the Strand ID.
 * @param reader The Reader to step into.
 * @returns The Strand ID.
 */
export function getStrandId(reader: Reader): string {
    reader.next();
    reader.stepIn();
    const type = reader.next();
    if (type.name !== "struct") {
        throw new Error(`Unexpected format: expected struct, but got IonType: ${type.name}`);
    }
    reader.stepIn();
    reader.next();
    const fieldName: string = reader.fieldName();
    if (fieldName !== "strandId") {
        throw new Error(`Expected field name strandId, found ${fieldName}.`);
    }
    return reader.stringValue();
}
