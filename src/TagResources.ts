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

import { QLDB } from "aws-sdk";
import {
    CreateLedgerRequest,
    CreateLedgerResponse,
    ListTagsForResourceRequest,
    ListTagsForResourceResponse,
    TagResourceRequest,
    Tags,
    UntagResourceRequest
} from "aws-sdk/clients/qldb";

import { LEDGER_NAME_WITH_TAGS } from "./qldb/Constants";
import { error, log } from "./qldb/LogUtil";

const ADD_TAGS = {
    Domain: 'Prod'
};
const CREATE_TAGS = {
    IsTest: 'true',
    Domain: 'Test'
};
const REMOVE_TAGS = ['IsTest'];

/**
 * Create a ledger with the specified name and the given tags.
 * @param ledgerName Name of the ledger to be created.
 * @param tags The map of key-value pairs to create the ledger with.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a CreateLedgerResponse.
 */
async function createWithTags(ledgerName: string, tags: Tags, qldbClient: QLDB): Promise<CreateLedgerResponse> {
    log(`Creating ledger with name: ${ledgerName}.`);
    const request: CreateLedgerRequest = {
        Name: ledgerName,
        Tags: tags,
        PermissionsMode: "ALLOW_ALL"
    };
    const result: CreateLedgerResponse = await qldbClient.createLedger(request).promise();
    log(`Success. Ledger state: ${result.State}.`);
    return result;
}

/**
 * Return all tags for a specified Amazon QLDB resource.
 * @param resourceArn The Amazon Resource Name (ARN) for which to list tags off.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a ListTagsForResourceResponse.
 */
export async function listTags(resourceArn: string, qldbClient: QLDB): Promise<ListTagsForResourceResponse> {
    log(`Listing the tags for resource with arn: ${resourceArn}.`);
    const request: ListTagsForResourceRequest = {
        ResourceArn: resourceArn
    };
    const result: ListTagsForResourceResponse = await qldbClient.listTagsForResource(request).promise();
    log(`Success. Tags: ${JSON.stringify(result.Tags)}`);
    return result;
}

/**
 * Add one or more tags to the specified QLDB resource.
 * @param resourceArn The Amazon Resource Name (ARN) of the ledger to which to add tags.
 * @param tags The map of key-value pairs to add to a ledger.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with void.
 */
export async function tagResource(resourceArn: string, tags: Tags, qldbClient: QLDB): Promise<void> {
    log(`Adding tags ${JSON.stringify(tags)} for resource with arn: ${resourceArn}.`);
    const request: TagResourceRequest = {
        ResourceArn: resourceArn,
        Tags: tags
    };
    await qldbClient.tagResource(request).promise();
    log("Successfully added tags.");
}

/**
 * Remove one or more tags from the specified QLDB resource.
 * @param resourceArn The Amazon Resource Name (ARN) from which to remove tags.
 * @param tagsKeys The list of tag keys to remove.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with void.
 */
export async function untagResource(resourceArn: string, tagsKeys: string[], qldbClient: QLDB): Promise<void> {
    log(`Removing tags ${JSON.stringify(tagsKeys)} for resource with arn: ${resourceArn}.`);
    const request: UntagResourceRequest = {
        ResourceArn: resourceArn,
        TagKeys: tagsKeys
    };
    await qldbClient.untagResource(request).promise();
    log("Successfully removed tags.");
}

/**
 * Tagging and un-tagging resources, including tag on create.
 * @returns Promise which fulfills with void.
 */
var main = async function(): Promise<void> {
    try {
        const qldbClient: QLDB = new QLDB();
        const result: CreateLedgerResponse = await createWithTags(LEDGER_NAME_WITH_TAGS, CREATE_TAGS, qldbClient);
        const arn: string = result.Arn;
        await listTags(arn, qldbClient);
        await tagResource(arn, ADD_TAGS, qldbClient);
        await listTags(arn, qldbClient);
        await untagResource(arn, REMOVE_TAGS, qldbClient);
        await listTags(arn, qldbClient);
    } catch (e) {
        error(`Unable to tag resources: ${e}`);
    }
}

if (require.main === module) {
    main();
}
