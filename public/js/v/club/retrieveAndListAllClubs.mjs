/**
 * @fileOverview  Contains various view functions for the use case "list football clubs"
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import { db } from "../../c/initialize.mjs"
import { GenderEL } from "../../m/Person.mjs";
import { showProgressBar } from "../../../lib/util.mjs";
import Member from "../../m/Member.mjs";
import Player from "../../m/Player.mjs";
import Coach from "../../m/Coach.mjs";
import FootballClub from "../../m/FootballClub.mjs";
import FootballAssociation from "../../m/FootballAssociation.mjs";

/**********************************************************************
 Declare variables for accessing UI elements
 **********************************************************************/
const selectOrderEl = document.querySelector("main > div > div > label > select");
const tableBodyEl = document.querySelector("table#clubs > tbody");

/***************************************************************
 Create table view
 ***************************************************************/
// invoke list ordered by clubId (default)
await renderList( "clubId");

/***************************************************************
 Handle order selector
 ***************************************************************/
selectOrderEl.addEventListener("change", async function (e) {
    // invoke list with order selected
    await renderList( e.target.value);
});

/***************************************************************
 Render list of all football club records
 ***************************************************************/
async function renderList( order) {
    tableBodyEl.innerHTML = "";
    showProgressBar("show");
    // load a list of all football club records
    const clubRecords = await FootballClub.retrieveAll(order),
        playersCollRef = db.collection("players"),
        coachesCollRef = db.collection("coaches"),
        assosCollRef = db.collection("associations"),
        membersCollRef = db.collection("members");

    // for each football club, create a table row with a cell for each attribute
    for (let club of clubRecords) {
        const playerQrySn = playersCollRef.where("assoClub_id", "==", parseInt(club.clubId)),
            coachQrySn = coachesCollRef.where("assoClub_id", "==", parseInt(club.clubId)),
            assoQrySn = assosCollRef.where("assoId", "==", String(club.association)),
            memberQrySn = membersCollRef.where("assoClubIdRefs", "array-contains", parseInt(club.clubId)),
            associatedPlayerDocSns = (await playerQrySn.get()).docs,
            associatedCoachDocSns = (await coachQrySn.get()).docs,
            associatedAssoDocSns = (await assoQrySn.get()).docs,
            associatedMemberDocSns = (await memberQrySn.get()).docs;

        const assoPlayers = [];
        for (const ap of associatedPlayerDocSns) {
            assoPlayers.push(ap.id);
        }
        const assoMembers = [];
        for (const am of associatedMemberDocSns) {
            assoMembers.push(am.id);
        }

        let row = tableBodyEl.insertRow();
        row.insertCell().textContent = club.clubId;
        row.insertCell().textContent = club.name;
        row.insertCell().textContent = GenderEL.labels[club.gender - 1];
        for (const aa of associatedAssoDocSns) {
            row.insertCell().textContent = aa.id ? await FootballAssociation.retrieve(String(aa.id)).then(value => value.name) : "";
        }

        const assoMembersName = [];
        for (const m of assoMembers) {
            assoMembersName.push(await Member.retrieve(String(m)).then(value => value.name));
        }
        // if (assoMembersName.length > 0) {
        //     row.insertCell().innerHTML = '<ul><li>' + assoMembersName.join("</li><li>"); + '</li></ul>';
        //
        // } else {
        //     row.insertCell().textContent = "";
        // }
        row.insertCell().textContent = assoMembers.length > 0 ? assoMembers.length : "0";


        const assoPlayersName = [];
        for (const p of assoPlayers) {
            assoPlayersName.push(await Player.retrieve(String(p)).then(value => value.name));
        }
        if (assoPlayersName.length > 0) {
            row.insertCell().innerHTML = '<ul><li>' + assoPlayersName.join("</li><li>"); + '</li></ul>';

        } else {
            row.insertCell().textContent = "";
        }
        // row.insertCell().textContent = assoPlayers.length > 0 ? assoPlayers.length : "0";

        if (associatedCoachDocSns.length > 0) {
            for (const ac of associatedCoachDocSns) {
                row.insertCell().textContent = ac.id ? await Coach.retrieve(String(ac.id)).then(value => value.name) : "";
            }
        }
    }
    showProgressBar( "hide");
}

