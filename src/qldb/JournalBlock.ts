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

import { dom } from "ion-js";

import { BlockAddress, getBlockAddressValue, getSequenceNo, getStrandId } from "./BlockAddress";
import { getBlobValue } from "./Util";

/**
 * Represents a JournalBlock that was recorded after executing a transaction in the ledger.
 */
export class JournalBlock {
    _blockAddress: BlockAddress;
    _blockHash: Uint8Array;
    _entriesHash: Uint8Array;
    _previousBlockHash: Uint8Array;

    constructor(
        blockAddress: BlockAddress,
        blockHash: Uint8Array,
        entriesHash: Uint8Array,
        previousBlockHash: Uint8Array)
    {
        this._blockAddress = blockAddress;
        this._blockHash = blockHash;
        this._entriesHash = entriesHash;
        this._previousBlockHash = previousBlockHash;
    }
}

/**
 * Construct a new JournalBlock object from an IonStruct.
 * @param value The Ion value that contains the journal block attributes.
 *               For this to work, the value is expected to have the structure
 *               {
 *                  blockAddress:{
 *                      strandId:"string",
 *                      sequenceNo:number
 *                  },
 *                  transactionId:"string",
 *                  blockTimestamp:Date,
 *                  blockHash:{
 *                      {
 *                          blob
 *                      }
 *                  },
 *                  entriesHash:{
 *                      {
 *                          blob
 *                      }
 *                 },
 *                  previousBlockHash:{
 *                      {
 *                          blob
 *                      }
 *                  }
 *                  .........
 *               }
 * @returns The constructed JournalBlock object.
 */
export function fromIon(journalValue: dom.Value): JournalBlock {
    const blockAddressValue = getBlockAddressValue(journalValue);
    const strandId: string = getStrandId(blockAddressValue);
    const sequenceNo: number = getSequenceNo(blockAddressValue);
    const blockAddress: BlockAddress = new BlockAddress(strandId, sequenceNo);

    const blockHash: Uint8Array = getBlobValue(journalValue, "blockHash");
    const entriesHash: Uint8Array = getBlobValue(journalValue, "entriesHash");
    const previousBlockHash: Uint8Array = getBlobValue(journalValue, "previousBlockHash");

    if (!blockAddress || !blockHash || !entriesHash || !previousBlockHash) {
        throw new Error(
            "BlockAddress, blockHash, entriesHash, or previousHash field(s) not found. Please check the data in the journal value."
        );
    }
    const journalBlock: JournalBlock = new JournalBlock(blockAddress, blockHash, entriesHash, previousBlockHash);
    return journalBlock;
}
