"use strict";
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
exports.__esModule = true;
var BlockAddress_1 = require("./BlockAddress");
var Util_1 = require("./Util");
/**
 * Represents a JournalBlock that was recorded after executing a transaction in the ledger.
 */
var JournalBlock = /** @class */ (function () {
    function JournalBlock(blockAddress, blockHash, entriesHash, previousBlockHash) {
        this._blockAddress = blockAddress;
        this._blockHash = blockHash;
        this._entriesHash = entriesHash;
        this._previousBlockHash = previousBlockHash;
    }
    return JournalBlock;
}());
exports.JournalBlock = JournalBlock;
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
function fromIon(journalValue) {
    var blockAddressValue = BlockAddress_1.getBlockAddressValue(journalValue);
    var strandId = BlockAddress_1.getStrandId(blockAddressValue);
    var sequenceNo = BlockAddress_1.getSequenceNo(blockAddressValue);
    var blockAddress = new BlockAddress_1.BlockAddress(strandId, sequenceNo);
    var blockHash = Util_1.getBlobValue(journalValue, "blockHash");
    var entriesHash = Util_1.getBlobValue(journalValue, "entriesHash");
    var previousBlockHash = Util_1.getBlobValue(journalValue, "previousBlockHash");
    if (!blockAddress || !blockHash || !entriesHash || !previousBlockHash) {
        throw new Error("BlockAddress, blockHash, entriesHash, or previousHash field(s) not found. Please check the data in the journal value.");
    }
    var journalBlock = new JournalBlock(blockAddress, blockHash, entriesHash, previousBlockHash);
    return journalBlock;
}
exports.fromIon = fromIon;
