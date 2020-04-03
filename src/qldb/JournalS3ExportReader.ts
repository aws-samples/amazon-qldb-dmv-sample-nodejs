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

import { S3 } from "aws-sdk";
import { JournalS3ExportDescription, S3ExportConfiguration } from "aws-sdk/clients/qldb";
import {
    GetObjectRequest,
    ListObjectsV2Output,
    ListObjectsV2Request,
    Object,
    ObjectList
} from "aws-sdk/clients/s3";
import { dom } from "ion-js";

import { fromIon, JournalBlock } from "./JournalBlock";
import { log } from "./LogUtil";

/**
 * Compare the expected block range, derived from File Key, with the actual object content.
 * @param fileKey The key of data file containing the chunk of journal block.
 *                The fileKey pattern is {[strandId].[firstSequenceNo]-[lastSequenceNo].ion}.
 * @param firstBlock The first block in the block chain for a particular journal strand.
 * @param lastBlock The last block in the block chain for a particular journal strand.
 * @throws Error: If the SequenceNo on the blockAddress does not match the expected SequenceNo.
 */
function compareKeyWithContentRange(fileKey: string, firstBlock: JournalBlock, lastBlock: JournalBlock): void {
    const sequenceNoRange: string = fileKey.split(".")[1];
    const keyTokens: string[] = sequenceNoRange.split("-");
    const startSequenceNo: string = keyTokens[0];
    const lastsequenceNo: string = keyTokens[1];

    if (firstBlock._blockAddress._sequenceNo.toString() !== startSequenceNo) {
        throw new Error(`Expected first block SequenceNo to be ${startSequenceNo}`);
    }
    if (lastBlock._blockAddress._sequenceNo.toString() !== lastsequenceNo) {
        throw new Error(`Expected last block SequenceNo to be ${lastsequenceNo}`);
    }
}

/**
 * Find the final manifest objects created after the completion of an export job.
 * @param objects List of objects in a particular bucket.
 * @returns The identifier for the final manifest object.
 * @throws Error: If the final manifest is not found.
 */
function filterForCompletedManifest(objects: ObjectList): string {
    const object: Object = objects.find(({ Key }) => Key.endsWith("completed.manifest"));
    if (object) {
        return object.Key;
    }
    throw new Error("Completed manifest not found.");
}

/**
 * Find the initial manifest created at the beginning of an export request.
 * @param objects List of objects in a particular bucket.
 * @param manifest The expected identifier for the initial manifest.
 * @returns The identifier for the initial manifest object.
 * @throws Error: If the initial manifest is not found.
 */
function filterForInitialManifest(objects: ObjectList, manifest: string): string {
    const object: Object = objects.find(({ Key }) => Key === manifest);
    if (object) {
        return object.Key;
    }
    throw new Error("Initial manifest not found.");
}

/**
 * Retrieve the ordered list of data object keys within the given final manifest.
 * @param manifestObject The content of the final manifest.
 *               For this to work, the value is expected to have the structure:
 *               {
 *                  keys:[
 *                     "2019/04/15/22/JdxjkR9bSYB5jMHWcI464T.1-4.ion",
 *                     "2019/04/15/22/JdxjkR9bSYB5jMHWcI464T.5-10.ion",
 *                     "2019/04/15/22/JdxjkR9bSYB5jMHWcI464T.11-12.ion"
 *                  ]
 *               }
 *
 * @returns List of data object keys.
 */
function getDataFileKeysFromManifest(manifestObject: string): string[] {
    const listOfKeys: string[] = [];
    const manifestValue: dom.Value = dom.load(manifestObject);
    const keys: dom.Value[] = manifestValue.get("keys").elements();
    keys.forEach((key: dom.Value) => {
        listOfKeys.push(key.stringValue());
    });
    return listOfKeys;
}

/**
 * Parse a S3 object's content for the journal data objects in Ion format.
 * @param s3Object The content within a S3 object.
 * @returns List of journal blocks.
 * @throws Error: If there is an error loading the journal.
 */
function getJournalBlocks(s3Object: string): JournalBlock[] {
    const journals: dom.Value[] = dom.loadAll(s3Object);
    const journalBlocks: JournalBlock[] = journals.map(journal => fromIon(journal));
    return journalBlocks;
}

/**
 * Read the S3 export within a journal block.
 * @param describeJournalExportResult The result from the QLDB database describing a journal export.
 * @param s3Client The low-level S3 client.
 * @returns Promise which fulfills with a list of journal blocks.
 */
export async function readExport(
    describeJournalExportResult: JournalS3ExportDescription,
    s3Client: S3
): Promise<JournalBlock[]> {
    const exportConfiguration: S3ExportConfiguration = describeJournalExportResult.S3ExportConfiguration;
    const prefix: string = exportConfiguration.Prefix;
    const bucketName: string = exportConfiguration.Bucket;
    const request: ListObjectsV2Request = {
        Bucket: bucketName,
        Prefix: prefix
    };
    const response: ListObjectsV2Output = await s3Client.listObjectsV2(request).promise();
    const objects: ObjectList = response.Contents;
    log("Found the following objects for list from S3:");
    objects.forEach(function(object) {
        log(object.Key);
    });

    // Validate initial manifest file was written.
    const expectedManifestKey: string = (`${prefix}${describeJournalExportResult.ExportId}.started.manifest`);
    const initialManifest: string = filterForInitialManifest(objects, expectedManifestKey);
    log(`Found the initial manifest with key: ${initialManifest}.`);

    // Find the final manifest file, it should contain the exportId in it.
    const completedManifestFileKey: string = filterForCompletedManifest(objects);
    let getObjectRequest: GetObjectRequest = {
        Bucket: bucketName,
        Key: completedManifestFileKey
    };
    const completedManifestObject: string = (await s3Client.getObject(getObjectRequest).promise()).Body.toString();
    const dataFileKeys: string[] = getDataFileKeysFromManifest(completedManifestObject);

    log(`Found the following keys in the manifest files: ${JSON.stringify(dataFileKeys)}`);
    const journalBlocks: JournalBlock[] = [];
    
    for (const dataFileKey of dataFileKeys) {
        log(`Reading file with S3 key ${dataFileKey} from bucket: ${bucketName}`);
        getObjectRequest = {
            Bucket: bucketName,
            Key: dataFileKey
        };
        const s3Object: string = (await s3Client.getObject(getObjectRequest).promise()).Body.toString();
        const blocks: JournalBlock[] = getJournalBlocks(s3Object);

        compareKeyWithContentRange(dataFileKey, blocks[0], blocks[blocks.length-1]);
        blocks.forEach(function(block) {
            journalBlocks.push(block);
        });
    }
    return journalBlocks;
}
