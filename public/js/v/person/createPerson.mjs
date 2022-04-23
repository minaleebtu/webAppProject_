/**
 * @fileOverview  View methods for the use case "create person"
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import Person, { GenderEL, PersonTypeEL  } from "../../m/Person.mjs";
import { undisplayAllSegmentFields, displaySegmentFields, createChoiceWidget,
    fillSelectWithOptionsClub, showProgressBar, createMultiSelectionWidget } from "../../../lib/util.mjs";
import FootballClub from "../../m/FootballClub.mjs";
import FootballAssociation from "../../m/FootballAssociation.mjs";
import Member from "../../m/Member.mjs";
import Player from "../../m/Player.mjs";
import Coach from "../../m/Coach.mjs";
import President from "../../m/President.mjs";

/***************************************************************
 Declare variables for accessing UI elements
 ***************************************************************/
const formEl = document.forms['Person'],
    genderFieldsetEl = formEl.querySelector("fieldset[data-bind='gender']"),
    typeFieldsetEl = formEl.querySelector("fieldset[data-bind='type']"),
    assoClubsCrtWidget = formEl.querySelector(
        "div.MultiSelectionWidgetClub"),
    assoAssociationsCrtWidget = formEl.querySelector(
        "div.MultiSelectionWidgetAsso"),
    selectClubPlayerEl = formEl.selectClubPlayer,
    selectClubCoachEl = formEl.selectClubCoach,
    selectAssoPresidentEl = formEl.selectAssoPresident,
    saveButton = formEl.commit;

formEl.reset();

/***************************************************************
 Set up selection lists and widgets
 ***************************************************************/
createMultiSelectionWidget( assoClubsCrtWidget, [],
    "crtAssoClubs", "Enter ID", 0);
createMultiSelectionWidget( assoAssociationsCrtWidget, [],
    "crtAssoAssociations", "Enter ID", 0);

// set up the gender radio button group
createChoiceWidget( genderFieldsetEl, "gender", [],
    "radio", GenderEL.labels);

// set up the type radio button group
createChoiceWidget( typeFieldsetEl, "type", [],
    "checkbox", PersonTypeEL.labels);

// load all football association records
const associationRecords = await FootballAssociation.retrieveAll("assoId");

// for type 'Player' (associated clubs)
fillSelectWithOptionsClub( selectClubPlayerEl,
    await FootballClub.retrieveAll().then(value=>value),
    "clubId", "name");

// for type 'Coach' (associated clubs)
fillSelectWithOptionsClub( selectClubCoachEl, await FootballClub.retrieveAll("clubId").then(value=>value), "clubId", "name");

// for type 'President' (associated associations)
for (const associationRec of associationRecords) {
    const optionEl = document.createElement("option");
    optionEl.text = associationRec.name;
    optionEl.value = associationRec.assoId;

    selectAssoPresidentEl.add( optionEl, null);
}

undisplayAllSegmentFields( formEl, PersonTypeEL.labels);

typeFieldsetEl.addEventListener("change", handleTypeSelectChangeEvent);

/***************************************************************
 Add event listeners for responsive validation
 ***************************************************************/
formEl.personId.addEventListener("input", async function () {
    let responseValidation = await Person.checkPersonIdAsId( formEl.personId.value);
    formEl["personId"].setCustomValidity( responseValidation.message);
});
formEl.name.addEventListener("input", function () {
    formEl.name.setCustomValidity( Person.checkName( formEl.name.value).message);
});
formEl.dateOfBirth.addEventListener("input", function () {
    formEl.dateOfBirth.setCustomValidity( Person.checkDateOfBirth( formEl.dateOfBirth.value).message);
});
genderFieldsetEl.addEventListener("click", function () {
    formEl.gender[0].setCustomValidity(
        (!genderFieldsetEl.getAttribute("data-value")) ?
            "A gender must be selected!":"" );
});
typeFieldsetEl.addEventListener("click", function () {
    const val = typeFieldsetEl.getAttribute("data-value");
    formEl.type[0].setCustomValidity(
        (!val || Array.isArray(val) && val.length === 0) ?
            "At least one type must be selected!":"" );
});

async function handleTypeSelectChangeEvent(e) {
    const formEl = e.currentTarget.form,
        selectedValues = [];
    var checkboxes = document.getElementsByName("type");

    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            selectedValues.push(i);

            if (i === ((PersonTypeEL.MEMBER) - 1)) {
            } else if (i === ((PersonTypeEL.PLAYER) - 1)) {

                formEl.selectClubPlayer.addEventListener("change", function () {
                    formEl.selectClubPlayer.setCustomValidity(
                        (formEl.selectClubPlayer.value.length > 0) ? "" : "No associated club selected!"
                    );
                });
            } else if (i === ((PersonTypeEL.COACH) - 1)) {
                formEl.selectClubCoach.addEventListener("change", function () {
                    formEl.selectClubCoach.setCustomValidity(
                        (formEl.selectClubCoach.value.length > 0) ? "" : "No associated club selected!"
                    );
                });
                //
                // formEl.selectClubCoach.addEventListener("input", function () {
                //     formEl.selectClubCoach.setCustomValidity(
                //         Coach.checkAssoClub(formEl.selectClubCoach.value).message);
                // });
            } else if (i === ((PersonTypeEL.PRESIDENT) - 1)) {
                formEl.selectAssoPresident.addEventListener("change", function () {
                    formEl.selectAssoPresident.setCustomValidity(
                        (formEl.selectAssoPresident.value.length > 0) ? "" : "No associated association selected!"
                    );
                });
                // formEl.selectAssoPresident.addEventListener("input", function () {
                //     formEl.selectAssoPresident.setCustomValidity(
                //         President.checkAssoAssociation(formEl.selectAssoPresident.value).message);
                // });
            }
        }
    }
    if (selectedValues.length > 0) {
        for (const v of selectedValues) {
            displaySegmentFields(formEl, PersonTypeEL.labels,
                parseInt(v + 1));
        }
    } else {
        undisplayAllSegmentFields(formEl, PersonTypeEL.labels);
    }
}

/******************************************************************
 Add further event listeners, especially for the save/submit button
 ******************************************************************/
// set an event handler for the submit/save button
saveButton.addEventListener("click", handleSaveButtonClickEvent);

async function handleSaveButtonClickEvent() {
    const formEl = document.forms['Person'],
        assoClubsListEl = assoClubsCrtWidget.querySelector("ul"),
        assoAssociationsListEl = assoAssociationsCrtWidget.querySelector("ul");

    const selectedTypesOptions = typeFieldsetEl.getAttribute("data-value");
    const slots = {
        personId: formEl.personId.value,
        name: formEl.name.value,
        dateOfBirth: formEl.dateOfBirth.value,
        gender: genderFieldsetEl.getAttribute("data-value"),
        type: []
    };
    slots.type = JSON.parse(selectedTypesOptions);

    // set error messages in case of constraint violations
    showProgressBar( "show");
    formEl.personId.setCustomValidity(( await Person.checkPersonIdAsId(slots.personId)).message);
    formEl.name.setCustomValidity( Person.checkName( slots.name).message);
    formEl.dateOfBirth.setCustomValidity( Person.checkDateOfBirth( slots.dateOfBirth).message);
    formEl.gender[0].setCustomValidity( Person.checkGender( slots.gender).message);
    formEl.type[0].setCustomValidity( Person.checkTypes( slots.type).message);

    if (slots.type) {
        // check type and save association entities depending on types
        if (slots.type.includes(PersonTypeEL.MEMBER)) {
            slots.assoClubIdRefs = [];
            slots.assoAssociationIdRefs = [];

            // get the list of selected assoClubs
            for (const el of assoClubsListEl.children) {
                slots.assoClubIdRefs.push( parseInt(el.getAttribute("data-value")));
            }
            if (slots.assoClubIdRefs.length > 0) {
                for (const ac of slots.assoClubIdRefs) {
                    let responseValidation = await Member.checkAssoClub( String(ac));
                    if (responseValidation.message) {
                        formEl["crtAssoClubs"].setCustomValidity( responseValidation.message);
                        break;
                    }  else formEl["crtAssoClubs"].setCustomValidity( "");
                }
            } else {
                formEl["crtAssoClubs"].setCustomValidity( "");
            }

            // get the list of selected assoAssociations
            for (const el of assoAssociationsListEl.children) {
                slots.assoAssociationIdRefs.push( parseInt(el.getAttribute("data-value")));
            }
            if (slots.assoAssociationIdRefs.length > 0) {
                for (const aa of slots.assoAssociationIdRefs) {
                    let responseValidation = await Member.checkAssoAssociation( String(aa));
                    if (responseValidation.message) {
                        formEl["crtAssoAssociations"].setCustomValidity( responseValidation.message);
                        break;
                    }  else formEl["crtAssoAssociations"].setCustomValidity( "");
                }
            } else {
                formEl["crtAssoAssociations"].setCustomValidity( "");
            }

            if (formEl.checkValidity()) {
                await Member.add(slots);

                // drop widget content
                assoClubsListEl.innerHTML = "";
                assoAssociationsListEl.innerHTML = "";
            }
        }

        if (slots.type.includes(PersonTypeEL.PLAYER)) {
            formEl.selectClubPlayer.setCustomValidity(
                (formEl.selectClubPlayer.value.length > 0) ? "" : "No associated club selected!"
            );

            if (formEl.checkValidity()) {
                slots.assoClub_id = parseInt(formEl.selectClubPlayer.value);

                await Player.add(slots);
            }
        }

        if (slots.type.includes(PersonTypeEL.COACH)) {
            formEl.selectClubCoach.setCustomValidity(
                formEl.selectClubCoach.value.length > 0 ? "" :
                    "No associated club selected!"
            );

            if (formEl.checkValidity()) {
                slots.assoClub_id = parseInt(formEl.selectClubCoach.value);

                await Coach.add(slots);
            }
        }

        if (slots.type.includes(PersonTypeEL.PRESIDENT)) {
            formEl.selectAssoPresident.setCustomValidity(
                formEl.selectAssoPresident.value.length > 0 ? "" :
                    "No associated association selected!"
            );

            if (formEl.checkValidity()) {
                slots.assoAssociation_id = parseInt(formEl.selectAssoPresident.value);

                await President.add(slots);
            }
        }
    }

    if (formEl.checkValidity()) {
        await Person.add(slots.personId, slots.name, slots.dateOfBirth, slots.gender, slots.type);
        undisplayAllSegmentFields( formEl, PersonTypeEL.labels);
        formEl.reset();
    }
    showProgressBar( "hide");
}

// neutralize the submit event
formEl.addEventListener("submit", function (e) {
    e.preventDefault();
});
