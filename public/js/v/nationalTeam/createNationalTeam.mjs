/**
 * @fileOverview  View methods for the use case "create national team"
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import { GenderEL } from "../../m/Person.mjs";
import { createChoiceWidget, showProgressBar, createMultiSelectionWidget } from "../../../lib/util.mjs";
import Coach from "../../m/Coach.mjs";
import NationalTeam from "../../m/NationalTeam.mjs";

/***************************************************************
 Declare variables for accessing UI elements
 ***************************************************************/
const formEl = document.forms['Team'],
    genderFieldsetEl = formEl.querySelector("fieldset[data-bind='gender']"),
    selectCoachEl = formEl.selectCoach,
    playersCrtWidget = formEl.querySelector( "div.MultiSelectionWidget"),
    saveButton = formEl.commit;

formEl.reset();

/***************************************************************
 Set up selection lists and widgets
 ***************************************************************/
// set up multi selection widget for players
createMultiSelectionWidget( playersCrtWidget, [],
    "crtPlayers", "Enter ID", 11);

// set up the gender radio button group
createChoiceWidget( genderFieldsetEl, "gender", [],
    "radio", GenderEL.labels);

const coachRecords = await Coach.retrieveAll();
for (const coachRecord of coachRecords) {
    const optionEl = document.createElement("option");
    optionEl.text = coachRecord.name;
    optionEl.value = coachRecord.personId;

    selectCoachEl.add( optionEl, null);
}

genderFieldsetEl.addEventListener("click", async function () {
    let responseValidation = await NationalTeam.checkGenderAsId( genderFieldsetEl.getAttribute("data-value"));
    formEl.gender[0].setCustomValidity( responseValidation.message);
});
/***************************************************************
 Add event listeners for responsive validation
 ***************************************************************/
genderFieldsetEl.addEventListener("click", function () {
    formEl.gender[0].setCustomValidity(
        (!genderFieldsetEl.getAttribute("data-value")) ?
            "A gender must be selected!":"" );
});
selectCoachEl.addEventListener("click", function () {
    formEl.selectCoach.setCustomValidity(
        formEl.selectCoach.value.length > 0 ? "" :
            "No coach selected!"
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
    const formEl = document.forms['Team'],
        playersListEl = playersCrtWidget.querySelector("ul");

    const slots = {
        gender: parseInt(genderFieldsetEl.getAttribute("data-value")),
        coach_id: parseInt(formEl.selectCoach.value),
        playerIdRefs: []
    };

    showProgressBar( "show");

    let responseValidation = await NationalTeam.checkGenderAsId( genderFieldsetEl.getAttribute("data-value"));
    formEl.gender[0].setCustomValidity( responseValidation.message);

    formEl.selectCoach.setCustomValidity(
        (formEl.selectCoach.value.length > 0) ? "" : "No coach selected!"
    );

    // get the list of selected players
    for (const el of playersListEl.children) {
        slots.playerIdRefs.push( parseInt(el.getAttribute("data-value")));
    }

    if (slots.playerIdRefs.length > 0) {
        for (const p of slots.playerIdRefs) {
            let responseValidation = await NationalTeam.checkPlayer(p);
            if (responseValidation.message) {
                formEl["crtPlayers"].setCustomValidity( responseValidation.message);
                break;
            }  else formEl["crtPlayers"].setCustomValidity( "");
        }
    }

    if (formEl.checkValidity()) {
        if (slots.playerIdRefs.length >= 11) {
            await NationalTeam.add( slots);
            playersListEl.innerHTML = "";
            formEl.reset();
        } else {
            alert("At least 11 players must be selected!");
        }
    }
    showProgressBar( "hide");
}