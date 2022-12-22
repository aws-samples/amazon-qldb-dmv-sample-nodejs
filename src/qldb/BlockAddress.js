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
var ion_js_1 = require("ion-js");
var BlockAddress = /** @class */ (function () {
    function BlockAddress(strandId, sequenceNo) {
        this._strandId = strandId;
        this._sequenceNo = sequenceNo;
    }
    return BlockAddress;
}());
exports.BlockAddress = BlockAddress;
/**
 * Convert a block address from an Ion value into a ValueHolder.
 * Shape of the ValueHolder must be: {'IonText': "{strandId: <"strandId">, sequenceNo: <sequenceNo>}"}
 * @param value The Ion value that contains the block address values to convert.
 * @returns The ValueHolder that contains the strandId and sequenceNo.
 */
function blockAddressToValueHolder(value) {
    var blockAddressValue = getBlockAddressValue(value);
    var strandId = getStrandId(blockAddressValue);
    var sequenceNo = getSequenceNo(blockAddressValue);
    var valueHolder = "{strandId: \"" + strandId + "\", sequenceNo: " + sequenceNo + "}";
    var blockAddress = { IonText: valueHolder };
    return blockAddress;
}
exports.blockAddressToValueHolder = blockAddressToValueHolder;
/**
 * Helper method that to get the Metadata ID.
 * @param value The Ion value.
 * @returns The Metadata ID.
 */
function getMetadataId(value) {
    var metaDataId = value.get("id");
    if (metaDataId === null) {
        throw new Error("Expected field name id, but not found.");
    }
    return metaDataId.stringValue();
}
exports.getMetadataId = getMetadataId;
/**
 * Helper method to get the Sequence No.
 * @param value The Ion value.
 * @returns The Sequence No.
 */
function getSequenceNo(value) {
    var sequenceNo = value.get("sequenceNo");
    if (sequenceNo === null) {
        throw new Error("Expected field name sequenceNo, but not found.");
    }
    return sequenceNo.numberValue();
}
exports.getSequenceNo = getSequenceNo;
/**
 * Helper method to get the Strand ID.
 * @param value The Ion value.
 * @returns The Strand ID.
 */
function getStrandId(value) {
    var strandId = value.get("strandId");
    if (strandId === null) {
        throw new Error("Expected field name strandId, but not found.");
    }
    return strandId.stringValue();
}
exports.getStrandId = getStrandId;
function getBlockAddressValue(value) {
    var type = value.getType();
    if (type !== ion_js_1.IonTypes.STRUCT) {
        throw new Error("Unexpected format: expected struct, but got IonType: " + type.name);
    }
    var blockAddress = value.get("blockAddress");
    if (blockAddress == null) {
        throw new Error("Expected field name blockAddress, but not found.");
    }
    return blockAddress;
}
exports.getBlockAddressValue = getBlockAddressValue;
