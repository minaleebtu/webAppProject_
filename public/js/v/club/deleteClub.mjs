/**
 * @fileOverview  Contains various view functions for the use case "delete football club"
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 */
/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import FootballClub from "../../m/FootballClub.mjs";
import { fillSelectWithOptions } from "../../../lib/util.mjs";

/***************************************************************
 Load data
 ***************************************************************/
const clubRecords = await FootballClub.retrieveAll();

/***************************************************************
 Declare variables for accessing UI elements
 ***************************************************************/
const formEl = document.forms["Club"],
    deleteButton = formEl["commit"],
    selectClubEl = formEl["selectClub"];

formEl.reset();

/***************************************************************
 Set up selection lists
 ***************************************************************/
fillSelectWithOptions( selectClubEl, clubRecords,
    {valueProp:"clubId", displayProp:"name"});

/******************************************************************
 Add further event listeners, especially for the save/delete button
 ******************************************************************/
// Set an event handler for the delete button
deleteButton.addEventListener("click", async function () {
    const clubId = selectClubEl.value;
    if (!clubId) return;
    if (confirm("Do you really want to delete this football club record?")) {
        await FootballClub.destroy(clubId);
        // remove deleted football club from select options
        selectClubEl.remove(selectClubEl.selectedIndex);
        formEl.reset();
    }
});