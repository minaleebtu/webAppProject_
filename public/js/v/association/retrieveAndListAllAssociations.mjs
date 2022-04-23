/**
 * @fileOverview  Contains various view functions for the use case listFootballAssociations
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import { showProgressBar } from "../../../lib/util.mjs";
import { db } from "../../c/initialize.mjs";
import FootballClub from "../../m/FootballClub.mjs";
import FootballAssociation  from "../../m/FootballAssociation.mjs";
import President from "../../m/President.mjs";
import Member from "../../m/Member.mjs";

/**********************************************************************
 Declare variables for accessing UI elements
 **********************************************************************/
const selectOrderEl = document.querySelector("main > div > div > label > select");
const tableBodyEl = document.querySelector("table#associations > tbody");

/***************************************************************
 Create table view
 ***************************************************************/
// invoke list ordered by assoId (default)
await renderList( "assoId");

/***************************************************************
 Handle order selector
 ***************************************************************/
selectOrderEl.addEventListener("change", async function (e) {
    // invoke list with order selected
    await renderList( e.target.value);
});

/***************************************************************
 Render list of all football association records
 ***************************************************************/
async function renderList( order) {
    tableBodyEl.innerHTML = "";
    showProgressBar("show");
    // load a list of all football association records
    const assoRecords = await FootballAssociation.retrieveAll(order),
        presidentsCollRef = db.collection("presidents"),
        membersCollRef = db.collection("members"),
        clubsCollRef = db.collection("clubs");

    // for each football association, create a table row with a cell for each attribute
    for (let asso of assoRecords) {
        const presidentQrySn = presidentsCollRef.where("assoAssociation_id", "==", parseInt(asso.assoId)),
            memberQrySn = membersCollRef.where("assoAssociationIdRefs", "array-contains", parseInt(asso.assoId)),
            clubQrySn = clubsCollRef.where("association_id", "==", parseInt(asso.assoId)),
            associatedPresidentDocSns = (await presidentQrySn.get()).docs,
            associatedMemberDocSns = (await memberQrySn.get()).docs,
            associatedClubDocSns = (await clubQrySn.get()).docs;

        let row = tableBodyEl.insertRow();
        row.insertCell().textContent = asso.assoId;
        row.insertCell().textContent = asso.name;

        const supAssociations = [];
        if (asso.supAssociations.length > 0) {
            for (const sa of asso.supAssociations) {
                supAssociations.push(await FootballAssociation.retrieve(String(sa)).then(value => value.name));
            }
            row.insertCell().innerHTML = '<ul><li>' + supAssociations.join("</li><li>"); + '</li></ul>';

        } else {
            row.insertCell().textContent = "";
        }

        if (associatedPresidentDocSns.length > 0) {
            for (const ap of associatedPresidentDocSns) {
                if (ap) {
                    row.insertCell().textContent = await President.retrieve(String(ap.id)).then(value => value.name)
                }
            }
        } else {
            row.insertCell().textContent = "";
        }

        const assoMembers = [];
        for (const am of associatedMemberDocSns) {
            assoMembers.push(am.id);
        }
        const assoClubs = [];
        for (const ac of associatedClubDocSns) {
            assoClubs.push(ac.id);
        }

        const assoMembersName = [];
        for (const m of assoMembers) {
            assoMembersName.push(await Member.retrieve(String(m)).then(value => value.name));
        }
        const assoClubsName = [];
        for (const c of assoClubs) {
            assoClubsName.push(await FootballClub.retrieve(String(c)).then(value => value.name));
        }

        // if (assoMembersName.length > 0) {
        //     row.insertCell().innerHTML = '<ul><li>' + assoMembersName.join("</li><li>"); + '</li></ul>';
        //
        // } else {
        //     row.insertCell().textContent = "";
        // }
        row.insertCell().textContent = assoMembers.length > 0 ? assoMembers.length : "0";

        // if (assoClubsName.length > 0) {
        //     row.insertCell().innerHTML = '<ul><li>' + assoClubsName.join("</li><li>"); + '</li></ul>';
        //
        // } else {
        //     row.insertCell().textContent = "";
        // }
        row.insertCell().textContent = assoClubs.length > 0 ? assoClubs.length : "0";


    }
    showProgressBar( "hide");
}
