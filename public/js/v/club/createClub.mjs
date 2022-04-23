/**
 * @fileOverview  View methods for the use case "create football club"
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import Person, { GenderEL } from "../../m/Person.mjs";
import { createChoiceWidget, showProgressBar } from "../../../lib/util.mjs";
import FootballClub from "../../m/FootballClub.mjs";
import FootballAssociation from "../../m/FootballAssociation.mjs";

/***************************************************************
 Declare variables for accessing UI elements
 ***************************************************************/
const formEl = document.forms['Club'],
    genderFieldsetEl = formEl.querySelector("fieldset[data-bind='gender']"),
    selectAssoEl = formEl.selectAsso,
    saveButton = formEl.commit;

/***************************************************************
 Set up widgets
 ***************************************************************/
// set up the gender radio button group
createChoiceWidget( genderFieldsetEl, "gender", [],
    "radio", GenderEL.labels);

const assoRecords = await FootballAssociation.retrieveAll();
for (const assoRec of assoRecords) {
    const optionEl = document.createElement("option");
    optionEl.text = assoRec.name;
    optionEl.value = assoRec.assoId;

    selectAssoEl.add( optionEl, null);
}

/***************************************************************
 Add event listeners for responsive validation
 ***************************************************************/
formEl.clubId.addEventListener("input", async function () {
    let responseValidation = await FootballClub.checkClubIdAsId( formEl.clubId.value);
    formEl["clubId"].setCustomValidity( responseValidation.message);
});
formEl.name.addEventListener("input", function () {
    formEl.name.setCustomValidity( FootballClub.checkName
    ( formEl.name.value).message);
});
genderFieldsetEl.addEventListener("click", function () {
    formEl.gender[0].setCustomValidity(
        (!genderFieldsetEl.getAttribute("data-value")) ?
            "A gender must be selected!":"" );
});
selectAssoEl.addEventListener("click", function () {
    formEl.selectAsso.setCustomValidity(
        formEl.selectAsso.value.length > 0 ? "" :
            "No association selected!"
    );
});

/******************************************************************
 Add further event listeners, especially for the save/submit button
 ******************************************************************/
// set an event handler for the submit/save button
saveButton.addEventListener("click", handleSaveButtonClickEvent);

// neutralize the submit event
formEl.addEventListener( 'submit', function (e) {
    e.preventDefault();
    formEl.reset();
});

async function handleSaveButtonClickEvent() {
    const formEl = document.forms['Club']

    const slots = {
        clubId: formEl.clubId.value,
        name: formEl.name.value,
        gender: genderFieldsetEl.getAttribute("data-value"),
        association_id: parseInt(formEl.selectAsso.value),
    };

    showProgressBar( "show");

    formEl.clubId.setCustomValidity(( await FootballClub.checkClubIdAsId(slots.clubId)).message);
    formEl.name.setCustomValidity( FootballClub.checkName( slots.name).message);
    formEl.gender[0].setCustomValidity( FootballClub.checkGender( slots.gender).message);
    formEl.selectAsso.setCustomValidity(
        (formEl.selectAsso.value.length > 0) ? "" : "No association selected!"
    );

    if (formEl.checkValidity()) {
        await FootballClub.add( slots);
        formEl.reset();
    }
    showProgressBar( "hide");
}