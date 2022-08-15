import * as ListLedgers from "../ListLedgers";
import * as CreateLedger from "../CreateLedger";
import * as DescribeLedger from "../DescribeLedger";
import * as CreateTable from "../CreateTable";
import * as ConnectToLedger from "../ConnectToLedger";
import * as CreateIndex from "../CreateIndex";
import * as InsertDocument from "../InsertDocument";
import * as ScanTable from "../ScanTable";
import * as FindVehicles from "../FindVehicles";
import * as RegisterDriversLicense from "../RegisterDriversLicense";
import * as RenewDriversLicense from "../RenewDriversLicense";
import * as DeregisterDriversLicense from "../DeregisterDriversLicense";
import * as TransferVehicleOwnership from "../TransferVehicleOwnership";
import * as AddSecondaryOwner from "../AddSecondaryOwner";
import * as QueryHistory from "../QueryHistory";
import * as TagResources from "../TagResources";
import * as DeletionProtection from "../DeletionProtection";
import * as InsertIonTypes from "../InsertIonTypes";
import * as ExportJournal from "../ExportJournal";
import * as DescribeJournalExport from "../DescribeJournalExport";
import * as ListJournalExports from "../ListJournalExports";
import * as ValidateQldbHashchain from "../ValidateQldbHashchain";
import * as GetDigest from "../GetDigest";
import * as GetRevision from "../GetRevision";
import * as GetBlock from "../GetBlock";
import * as DeleteLedger from "../DeleteLedger";

import { LEDGER_NAME, LEDGER_NAME_FOR_DELETIONS } from "../qldb/Constants";

import * as chai from "chai";

describe("Run Sample App", function () {

    this.timeout(0);
    
    it("Can list ledgers", async () => {
        await ListLedgers.main();
    })
    
    it("Can create ledger", async () => {
        await CreateLedger.main();
    })
    
    it("Can describe ledger", async () => {
        const actual = await DescribeLedger.main();
        chai.assert.equal(actual.Name, LEDGER_NAME);
        chai.assert.equal(actual.State, "ACTIVE");
    })

    it("Can tag resources", async () => {
        const actual = await TagResources.main();
        const expected = [
            {
              "Domain": "Test",
              "IsTest": "true"
            },
            {
              "Domain": "Prod",
              "IsTest": "true"
            },
            {
              "Domain": "Prod"
            }
        ];
        chai.assert.equal(actual.length, 3);
        chai.assert.deepEqual(actual[0], expected[0]);
        chai.assert.deepEqual(actual[1], expected[1]);
        chai.assert.deepEqual(actual[2], expected[2]);
    })
    
    it("Can set deletion protection and delete ledger", async () => {
        const updateDeletionProtectionResult = await DeletionProtection.main(LEDGER_NAME_FOR_DELETIONS);
        chai.assert.equal(updateDeletionProtectionResult.Name, LEDGER_NAME_FOR_DELETIONS);
        chai.assert.isFalse(updateDeletionProtectionResult.DeletionProtection);
    })

    it("Can create tables", async () => {
        await CreateTable.main();
    })
    
    it("Can connect to ledger", async () => {
        await ConnectToLedger.main();
    })

    it("Can create indexes", async () => {
        await CreateIndex.main();
    })

    it("Can insert documents", async () => {
        await InsertDocument.main();
    })

    it("Can scan tables", async () => {
        await ScanTable.main();
    })

    it("Can find vehicles", async () => {
        const actual = await FindVehicles.main();
        const expected = {
            "Vehicle": {
                "VIN": "1N4AL11D75C109151",
                "Type": "Sedan",
                "Year": 2011,
                "Make": "Audi",
                "Model": "A5",
                "Color": "Silver"
            }
        };
        chai.assert.equal(actual.length, 1);
        chai.assert.isTrue(actual[0].equals(expected));
    })

    it("Can register drivers license", async () => {
        const actual = await RegisterDriversLicense.main();
        chai.assert.equal(actual.length, 1);
        chai.assert.equal(actual[0].allFields().length, 1);
        chai.assert.equal(actual[0].allFields()[0][0], "documentId");
    })

    it("Can renew drivers license", async () => {
        const actual = await RenewDriversLicense.main();
        chai.assert.equal(actual.length, 2);
        chai.assert.isTrue(actual[0].ionEquals(actual[1]));
        chai.assert.equal(actual[0].allFields().length, 1);
        chai.assert.equal(actual[0].allFields()[0][0], "documentId");
    })

    it("Can deregister drivers license", async () => {
        const actual = await DeregisterDriversLicense.main();
        chai.assert.equal(actual.length, 1);
        chai.assert.equal(actual[0].allFields().length, 1);
        chai.assert.equal(actual[0].allFields()[0][0], "documentId");
    })

    it("Can transfer vehicle ownership", async () => {
        const actual = await TransferVehicleOwnership.main();
        chai.assert.equal(actual.length, 1);
        chai.assert.equal(actual[0].allFields().length, 1);
        chai.assert.equal(actual[0].allFields()[0][0], "documentId");
    })

    it("Can add secondary owner", async () => {
        const actual = await AddSecondaryOwner.main();
        chai.assert.equal(actual.length, 1);
        chai.assert.equal(actual[0].allFields().length, 1);
        chai.assert.equal(actual[0].allFields()[0][0], "documentId");
    })

    it("Can query history", async () => {
        const actual = await QueryHistory.main();
        chai.assert.equal(actual.length, 0);
    })

    it("Can insert ion types", async () => {
        await InsertIonTypes.main();
    })

    it("Can perform journal export functionalities", async () => {
        const exportResult = await ExportJournal.main(true);
        chai.assert.isNotNull(exportResult.ExportId)

        const describeExportResult = await DescribeJournalExport.main(exportResult.ExportId);
        chai.assert.equal(describeExportResult.ExportDescription.LedgerName, LEDGER_NAME);
        chai.assert.equal(describeExportResult.ExportDescription.Status, "COMPLETED");

        const listExportResults = await ListJournalExports.main();
        chai.assert.equal(listExportResults.length, 1);
        chai.assert.equal(listExportResults[0].LedgerName, LEDGER_NAME);
        chai.assert.equal(listExportResults[0].Status, "COMPLETED");

        await ValidateQldbHashchain.main(exportResult.ExportId);
    })

    it("Can perform journal verification functionalities", async () => {
        const digest = await GetDigest.main();
        chai.assert.isNotNull(digest);
        await GetRevision.main();
        await GetBlock.main();
    })

    it("Can delete ledger", async () => {
        await DeleteLedger.main();
    })
})