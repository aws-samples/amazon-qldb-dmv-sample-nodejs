/*
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

import { config } from "aws-sdk";

config.logger = console;

/**
 * Logs an error level message.
 * @param line The message to be logged.
 */
export function error(line: string): void {
    if (isLoggerSet()) {
        _prepend(line, "ERROR");
    }
}

/**
 * Logs a message.
 * @param line The message to be logged.
 */
export function log(line: string): void {
    if (isLoggerSet()) {
        _prepend(line, "LOG");
    }
}

/**
 * @returns A boolean indicating whether a logger has been set within the AWS SDK.
 */
export function isLoggerSet(): boolean {
    return config.logger !== null;
}

/**
 * Prepends a string identifier indicating the log level to the given log message, & writes or logs the given message
 * using the logger set in the AWS SDK.
 * @param line The message to be logged.
 * @param level The log level.
 */
function _prepend(line: string, level: string): void {
    if (config.logger) {
        if (typeof config.logger.log === "function") {
            config.logger.log(`[${level}][Node.js QLDB Sample Code] ${line}`);
        } else if (typeof config.logger.write === "function") {
            config.logger.write(`[${level}][Node.js QLDB Sample Code] ${line}\n`);
        }
    }
}
