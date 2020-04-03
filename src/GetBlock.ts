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

import { QldbSession } from "amazon-qldb-driver-nodejs";
import { QLDB } from "aws-sdk";
import { Digest, GetBlockRequest, GetBlockResponse, GetDigestResponse, ValueHolder } from "aws-sdk/clients/qldb";
import { dom, toBase64 } from "ion-js";

import { closeQldbSession, createQldbSession } from "./ConnectToLedger";
import { getDigestResult } from './GetDigest';
import { lookupRegistrationForVin } from "./GetRevision";
import { VEHICLE_REGISTRATION } from "./model/SampleData";
import { blockAddressToValueHolder } from './qldb/BlockAddress';
import { LEDGER_NAME } from './qldb/Constants';
import { error, log } from "./qldb/LogUtil";
import { blockResponseToString, valueHolderToString } from "./qldb/Util";
import { flipRandomBit, parseBlock, verifyDocument } from "./qldb/Verifier";

/**
 * Get the block of a ledger's journal.
 * @param ledgerName Name of the ledger to operate on.
 * @param blockAddress The location of the block to request.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a GetBlockResponse.
 */
async function getBlock(ledgerName: string, blockAddress: ValueHolder, qldbClient: QLDB): Promise<GetBlockResponse> {
    log(
        `Let's get the block for block address \n${valueHolderToString(blockAddress)} \nof the ledger ` +
        `named ${ledgerName}.`
    );
    const request: GetBlockRequest = {
        Name: ledgerName,
        BlockAddress: blockAddress
    };
    const result: GetBlockResponse = await qldbClient.getBlock(request).promise();
    log(`Success. GetBlock: \n${blockResponseToString(result)}.`);
    return result;
}

/**
 * Get the block of a ledger's journal. Also returns a proof of the block for verification.
 * @param ledgerName Name of the ledger to operate on.
 * @param blockAddress The location of the block to request.
 * @param digestTipAddress The location of the digest tip.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a GetBlockResponse.
 */
async function getBlockWithProof(
    ledgerName: string,
    blockAddress: ValueHolder,
    digestTipAddress: ValueHolder,
    qldbClient: QLDB
): Promise<GetBlockResponse> {
    log(
        `Let's get the block for block address \n${valueHolderToString(blockAddress)}, \ndigest tip address:
        ${valueHolderToString(digestTipAddress)} \nof the ledger named ${ledgerName}.`
    );
    const request: GetBlockRequest = {
        Name: ledgerName,
        BlockAddress: blockAddress,
        DigestTipAddress: digestTipAddress
    };
    const result: GetBlockResponse = await qldbClient.getBlock(request).promise();
    log(`Success. GetBlock: \n${blockResponseToString(result)}.`);
    return result;
}

/**
 * Verify block by validating the proof returned in the getBlock response.
 * @param ledgerName The ledger to get the digest from.
 * @param blockAddress The address of the block to verify.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with void.
 * @throws Error: When verification fails.
 */
export async function verifyBlock(ledgerName: string, blockAddress: ValueHolder, qldbClient: QLDB): Promise<void> {
    log(`Let's verify blocks for ledger with name = ${ledgerName}.`);
    try {
        log("First, let's get a digest.");
        const digestResult: GetDigestResponse = await getDigestResult(ledgerName, qldbClient);
        const digestBytes: Digest = digestResult.Digest;
        const digestTipAddress: ValueHolder = digestResult.DigestTipAddress;
        log(
            `Got a ledger digest. Digest end address = \n${valueHolderToString(digestTipAddress)}, ` +
            `\ndigest = ${toBase64(<Uint8Array> digestBytes)}.`
        );

        const getBlockResult: GetBlockResponse = await getBlockWithProof(
            ledgerName, 
            blockAddress, 
            digestTipAddress,
            qldbClient
        );
        const block: ValueHolder = getBlockResult.Block;
        const blockHash: Uint8Array = parseBlock(block);

        let verified: boolean = verifyDocument(blockHash, digestBytes, getBlockResult.Proof);
        if (!verified) {
            throw new Error("Block is not verified!");
        } else {
            log("Success! The block is verified!");
        }

        const alteredDigest: Uint8Array = flipRandomBit(digestBytes);
        log(
            `Let's try flipping one bit in the digest and assert that the block is NOT verified.
            The altered digest is: ${toBase64(alteredDigest)}.`
        );
        verified = verifyDocument(blockHash, alteredDigest, getBlockResult.Proof);
        if (verified) {
            throw new Error("Expected block to not be verified against altered digest.");
        } else {
            log("Success! As expected flipping a bit in the digest causes verification to fail.");
        }

        const alteredBlockHash: Uint8Array = flipRandomBit(blockHash);
        log(
            `Let's try flipping one bit in the block's hash and assert that the block is NOT verified.
            The altered block hash is: ${toBase64(alteredBlockHash)}.`
        );
        verified = verifyDocument(alteredBlockHash, digestBytes, getBlockResult.Proof);
        if (verified) {
            throw new Error("Expected altered block hash to not be verified against digest.");
        } else {
            log("Success! As expected flipping a bit in the block hash causes verification to fail.");
        }
    } catch (e) {
        log(`Failed to verify blocks in the ledger with name = ${ledgerName}.`);
        throw e;
    }
}

/**
 * Get a journal block from a QLDB ledger.
 * After getting the block, we get the digest of the ledger and validate the proof returned in the getBlock response.
 * @returns Promise which fulfills with void.
 */
var main = async function(): Promise<void> {
    let session: QldbSession;
    try {
        const qldbClient: QLDB = new QLDB();
        session = await createQldbSession();

        const registration = VEHICLE_REGISTRATION[1];
        const vin: string = registration.VIN;

        await session.executeLambda(async (txn) => {
            const registrations : dom.Value[] = await lookupRegistrationForVin(txn, vin);
            for (const registration of registrations) {
                const blockAddress: ValueHolder = blockAddressToValueHolder(registration);
                await verifyBlock(LEDGER_NAME, blockAddress, qldbClient);
            }
        }, () => log("Retrying due to OCC conflict..."));
    } catch (e) {
        error(`Unable to query vehicle registration by Vin: ${e}`);
    } finally {
        closeQldbSession(session);
    }
}

if (require.main === module) {
    main();
}
