/**
 * @fileOverview  Contains various view functions for the use case "delete football association"
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import FootballAssociation from "../../m/FootballAssociation.mjs";
import { fillSelectWithOptions } from "../../../lib/util.mjs";

/***************************************************************
 Load data
 ***************************************************************/
const assoRecords = await FootballAssociation.retrieveAll();

/***************************************************************
 Declare variables for accessing UI elements
 ***************************************************************/
const formEl = document.forms["Association"],
    deleteButton = formEl["commit"],
    selectAssoEl = formEl["selectAssociation"];

/***************************************************************
 Set up selection lists
 ***************************************************************/
fillSelectWithOptions( selectAssoEl, assoRecords,
    {valueProp:"assoId", displayProp:"name"});

/******************************************************************
 Add further event listeners, especially for the save/delete button
 ******************************************************************/
// Set an event handler for the delete button
deleteButton.addEventListener("click", async function () {
    const assoId = selectAssoEl.value;
    if (!assoId) return;
    if (confirm("Do you really want to delete this football association record?")) {
        FootballAssociation.destroy(assoId);
        // remove deleted football association from select options
        selectAssoEl.remove(selectAssoEl.selectedIndex);
    }
});