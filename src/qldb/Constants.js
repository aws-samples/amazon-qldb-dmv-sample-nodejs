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
var _a;
exports.__esModule = true;
/**
 * Constant values used throughout this tutorial.
 */
var ciIdentifier = (_a = process.env["CI_ID"], (_a !== null && _a !== void 0 ? _a : ""));
exports.LEDGER_NAME = "vehicle-registration" + ciIdentifier;
exports.LEDGER_NAME_WITH_TAGS = "tags" + ciIdentifier;
exports.LEDGER_NAME_FOR_DELETIONS = "deletions" + ciIdentifier;
exports.DRIVERS_LICENSE_TABLE_NAME = "DriversLicense";
exports.PERSON_TABLE_NAME = "Person";
exports.VEHICLE_REGISTRATION_TABLE_NAME = "VehicleRegistration";
exports.VEHICLE_TABLE_NAME = "Vehicle";
exports.GOV_ID_INDEX_NAME = "GovId";
exports.LICENSE_NUMBER_INDEX_NAME = "LicenseNumber";
exports.LICENSE_PLATE_NUMBER_INDEX_NAME = "LicensePlateNumber";
exports.PERSON_ID_INDEX_NAME = "PersonId";
exports.VIN_INDEX_NAME = "VIN";
exports.RETRY_LIMIT = 4;
exports.JOURNAL_EXPORT_S3_BUCKET_NAME_PREFIX = "qldb-tutorial-journal-export";
exports.USER_TABLES = "information_schema.user_tables";
