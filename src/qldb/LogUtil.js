"use strict";
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
exports.__esModule = true;
var aws_sdk_1 = require("aws-sdk");
aws_sdk_1.config.logger = console;
/**
 * Logs an error level message.
 * @param line The message to be logged.
 */
function error(line) {
    if (isLoggerSet()) {
        _prepend(line, "ERROR");
    }
}
exports.error = error;
/**
 * Logs a message.
 * @param line The message to be logged.
 */
function log(line) {
    if (isLoggerSet()) {
        _prepend(line, "LOG");
    }
}
exports.log = log;
/**
 * @returns A boolean indicating whether a logger has been set within the AWS SDK.
 */
function isLoggerSet() {
    return aws_sdk_1.config.logger !== null;
}
exports.isLoggerSet = isLoggerSet;
/**
 * Prepends a string identifier indicating the log level to the given log message, & writes or logs the given message
 * using the logger set in the AWS SDK.
 * @param line The message to be logged.
 * @param level The log level.
 */
function _prepend(line, level) {
    if (aws_sdk_1.config.logger) {
        if (typeof aws_sdk_1.config.logger.log === "function") {
            aws_sdk_1.config.logger.log("[" + level + "][Node.js QLDB Sample Code] " + line);
        }
        else if (typeof aws_sdk_1.config.logger.write === "function") {
            aws_sdk_1.config.logger.write("[" + level + "][Node.js QLDB Sample Code] " + line + "\n");
        }
    }
}
