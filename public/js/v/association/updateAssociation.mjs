/**
 * @fileOverview  View methods for the use case "update football association"
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import FootballAssociation from "../../m/FootballAssociation.mjs";
import { createMultiSelectionWidget, fillSelectWithOptions } from "../../../lib/util.mjs";

/***************************************************************
 Load data
 ***************************************************************/
const assoRecords = await FootballAssociation.retrieveAll();

/***************************************************************
 Declare variables for accessing UI elements
 ***************************************************************/
const formEl = document.forms["Association"],
    selectAssoEl = formEl.selectAssociation,
    supAssosUpWidget = formEl.querySelector(".MultiSelectionWidget"),
    updateButton = formEl.commit;

formEl.reset();

/***************************************************************
 Initialize subscription to DB-UI synchronization
 ***************************************************************/
let cancelSyncDBwithUI = null;

/***************************************************************
 Set up the selection lists
 ***************************************************************/
fillSelectWithOptions( selectAssoEl, assoRecords, {valueProp:"assoId", displayProp:"name"});

/***************************************************************
 When a football association is selected
 ***************************************************************/
// when a football association is selected, fill the form with its data
selectAssoEl.addEventListener("change", async function () {
    const assoId = selectAssoEl.value;
    if (assoId) {
        // retrieve up-to-date football association record
        const assoRec = await FootballAssociation.retrieve( assoId);
        formEl.assoId.value = assoRec.assoId;
        formEl.name.value = assoRec.name;

        if (assoRec.supAssociations) {
            createMultiSelectionWidget(supAssosUpWidget, assoRec.supAssociations,
                "upSupAssos", "Enter ID", 0);
        }

    } else {
        formEl.reset();
    }
});

// set up listener to document changes on selected football association record
selectAssoEl.addEventListener("change", async function () {
    cancelSyncDBwithUI = await FootballAssociation.syncDBwithUI( selectAssoEl.value);
});

/***************************************************************
 Add event listeners for responsive validation
 ***************************************************************/
formEl.name.addEventListener("input", function () {
    formEl.name.setCustomValidity(
        FootballAssociation.checkName( formEl.name.value).message);
});

/******************************************************************
 Add further event listeners, especially for the save/delete button
 ******************************************************************/
// Set an event handler for the submit/save button
updateButton.addEventListener("click", handleSubmitButtonClickEvent);
// neutralize the submit event
formEl.addEventListener( "submit", function (e) {
    e.preventDefault();
});

// Set event cancel of DB-UI sync when the browser window/tab is closed
window.addEventListener("beforeunload", function () {
    cancelSyncDBwithUI();
});

/**
 * check data and invoke update
 */
async function handleSubmitButtonClickEvent() {
    const formEl = document.forms["Association"],
        selectAssoEl = formEl.selectAssociation,
        assoId = selectAssoEl.value,
        supAssosListEl = supAssosUpWidget.querySelector("ul");

    if (!assoId) return;
    const slots = {
        assoId: formEl.assoId.value,
        name: formEl.name.value
    };
    // set error messages in case of constraint violations
    formEl.name.setCustomValidity( FootballAssociation.checkName( slots.name).message);

    // construct supAssociationIdRefs-ToAdd/ToRemove lists
    const supAssociationIdRefsToAdd = [], supAssociationIdRefsToRemove = [];
    for (const supAssoItemEl of supAssosListEl.children) {
        if (supAssoItemEl.classList.contains("removed")) {
            supAssociationIdRefsToRemove.push(supAssoItemEl.getAttribute("data-value"));
        }
        if (supAssoItemEl.classList.contains("added")) {
            supAssociationIdRefsToAdd.push(supAssoItemEl.getAttribute("data-value"));
        }
    }
    // if the add/remove list is non-empty, create a corresponding slot
    if (supAssociationIdRefsToRemove.length > 0) {
        slots.supAssociationIdRefsToRemove = supAssociationIdRefsToRemove;
    }
    if (supAssociationIdRefsToAdd.length > 0) {
        slots.supAssociationIdRefsToAdd = supAssociationIdRefsToAdd;
    }
    if (slots.supAssociationIdRefsToAdd) {
        for (const sa of slots.supAssociationIdRefsToAdd) {
            let responseValidation = await FootballAssociation.checkSupAssociation( sa);
            if (responseValidation.message !== "") {
                formEl["upSupAssos"].setCustomValidity( responseValidation.message);
                break;
            } else formEl["upSupAssos"].setCustomValidity("");
        }
    }

    if (formEl.checkValidity()) {
        await FootballAssociation.update(slots);
        // update the selection list option
        supAssosListEl.innerHTML = "";
        selectAssoEl.options[selectAssoEl.selectedIndex].text = slots.name;

        formEl.reset();
    }
}