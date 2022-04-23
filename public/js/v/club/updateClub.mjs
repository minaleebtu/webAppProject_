/**
 * @fileOverview  View methods for the use case "update football club"
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import { GenderEL } from "../../m/Person.mjs";
import { createChoiceWidget, fillSelectWithOptions } from "../../../lib/util.mjs";
import FootballClub from "../../m/FootballClub.mjs";
import FootballAssociation from "../../m/FootballAssociation.mjs";

/***************************************************************
 Load data
 ***************************************************************/
const clubRecords = await FootballClub.retrieveAll();

/***************************************************************
 Declare variables for accessing UI elements
 ***************************************************************/
const formEl = document.forms["Club"],
    selectClubEl = formEl.selectClub,
    genderFieldsetEl = formEl.querySelector("fieldset[data-bind='gender']"),
    selectAssoEl = formEl.selectAsso,
    updateButton = formEl.commit;

/***************************************************************
 Initialize subscription to DB-UI synchronization
 ***************************************************************/
let cancelSyncDBwithUI = null;

/***************************************************************
 Set up selection lists and widgets
 ***************************************************************/
// set up the football club selection list
fillSelectWithOptions( selectClubEl, clubRecords, {valueProp:"clubId", displayProp:"name"});

// load all football association records
const assoRecords = await FootballAssociation.retrieveAll();
for (const assoRec of assoRecords) {
    const optionEl = document.createElement("option");
    optionEl.text = assoRec.name;
    optionEl.value = assoRec.assoId;

    selectAssoEl.add( optionEl, null);
}
selectAssoEl.disabled = true;

// when a football club is selected, fill the form with its data
selectClubEl.addEventListener("change", async function () {
    const clubId = selectClubEl.value;
    if (clubId) {
        selectAssoEl.disabled = false;

        // retrieve up-to-date football club record
        const clubRec = await FootballClub.retrieve( clubId);

        formEl.clubId.value = clubRec.clubId;
        formEl.name.value = clubRec.name;
        selectAssoEl.value = await FootballAssociation.retrieve(String(clubRec.association)).then(value => value.assoId);

        // set up the gender radio button group
        createChoiceWidget( genderFieldsetEl, "gender",
            [clubRec.gender], "radio", GenderEL.labels);

    } else {
        formEl.reset();
    }
});

// set up listener to document changes on selected football club record
selectClubEl.addEventListener("change", async function () {
    cancelSyncDBwithUI = await FootballClub.syncDBwithUI( selectClubEl.value);
});

/***************************************************************
 Add event listeners for responsive validation
 ***************************************************************/
formEl.name.addEventListener("input", function () {
    formEl.name.setCustomValidity(
        FootballClub.checkName( formEl.name.value).message);
});
genderFieldsetEl.addEventListener("click", function () {
    formEl.gender[0].setCustomValidity(
        (!genderFieldsetEl.getAttribute("data-value")) ? "A gender must be selected!":"" );
});
selectAssoEl.addEventListener("click", function () {
    formEl.selectAsso.setCustomValidity(
        formEl.selectAsso.value.length > 0 ? "" :
            "No association selected!"
    );
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
    const formEl = document.forms["Club"],
        selectClubEl = formEl.selectClub,
        clubId = selectClubEl.value;
    if (!clubId) return;
    const slots = {
        clubId: formEl.clubId.value,
        name: formEl.name.value,
        gender: genderFieldsetEl.getAttribute("data-value"),
        association_id: parseInt(formEl.selectAsso.value)
    };

    // set error messages in case of constraint violations
    formEl.name.setCustomValidity( FootballClub.checkName( slots.name).message);
    formEl.gender[0].setCustomValidity( FootballClub.checkGender( slots.gender).message);
    formEl.selectAsso.setCustomValidity(
        (formEl.selectAsso.value.length > 0) ? "" : "No association selected!"
    );

    if (formEl.checkValidity()) {
        await FootballClub.update(slots);
        // update the selection list option
        selectClubEl.options[selectClubEl.selectedIndex].text = slots.name;
        formEl.reset();
    }
}