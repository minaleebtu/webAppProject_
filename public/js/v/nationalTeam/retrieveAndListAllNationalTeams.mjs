/**
 * @fileOverview  Contains various view functions for the use case "list national teams"
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/

import { GenderEL } from "../../m/Person.mjs";
import { showProgressBar } from "../../../lib/util.mjs";
import Player from "../../m/Player.mjs";
import Coach from "../../m/Coach.mjs";
import NationalTeam from "../../m/NationalTeam.mjs";

/**********************************************************************
 Declare variables for accessing UI elements
 **********************************************************************/
const tableBodyEl = document.querySelector("table#teams > tbody");

/***************************************************************
 Create table view
 ***************************************************************/
await renderList();

/***************************************************************
 Render list of all national team records
 ***************************************************************/
async function renderList() {
    tableBodyEl.innerHTML = "";
    showProgressBar("show");
    // load a list of all national team records
    const teamRecords = await NationalTeam.retrieveAll();
    // for each national team, create a table row with a cell for each attribute
    for (let team of teamRecords) {
        let row = tableBodyEl.insertRow();
        row.insertCell().textContent = GenderEL.labels[team.gender - 1];
        row.insertCell().textContent = team.coach ?
            await Coach.retrieve(String(team.coach)).then(value => value.name) : "";

        if (team.players) {
            if (team.players.length > 0) {
                const playersName = [];
                for (const p of team.players) {
                    playersName.push(await Player.retrieve(String(p)).then(value => value.name));
                }
                row.insertCell().innerHTML = '<ul><li>' + playersName.join("</li><li>"); + '</li></ul>';

            } else {
                row.insertCell().textContent = "";
            }
        }
    }
    showProgressBar( "hide");
}

