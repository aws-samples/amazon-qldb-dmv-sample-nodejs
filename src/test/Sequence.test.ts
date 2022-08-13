import * as CreateLedger from "../CreateLedger";
import * as CreateTable from "../CreateTable";
import * as InsertIonTypes from "../InsertIonTypes";
import * as DeleteLedger from "../DeleteLedger";

describe("Run Sample App", function () {

    this.timeout(0);
    
    it("Can create ledger", async () => {
        await CreateLedger.main();
    })

    it("Can create tables", async () => {
        await CreateTable.main();
    })

    it("Can insert ion types", async () => {
        await InsertIonTypes.main();
    })

    it("Can delete ledger", async () => {
        await DeleteLedger.main();
    })
})