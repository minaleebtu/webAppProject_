/**
 * @fileOverview  View methods for the use case "update person"
 * @authors Gerd Wagner & Juan-Francisco Reyes
 */
/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import { db } from "../../c/initialize.mjs";
import { fillSelectWithOptions, createChoiceWidget, displaySegmentFields,
    undisplayAllSegmentFields, fillSelectWithOptionsClub, createMultiSelectionWidget } from "../../../lib/util.mjs";
import Person, { GenderEL, PersonTypeEL } from "../../m/Person.mjs";
import Player from "../../m/Player.mjs";
import FootballAssociation from "../../m/FootballAssociation.mjs";
import FootballClub from "../../m/FootballClub.mjs";
import Member from "../../m/Member.mjs";
import Coach from "../../m/Coach.mjs";
import President from "../../m/President.mjs";


/***************************************************************
 Load data
 ***************************************************************/
const personRecords = await Person.retrieveAll();

/***************************************************************
 Declare variables for accessing UI elements
 ***************************************************************/
const formEl = document.forms["Person"],
    submitButton = formEl["commit"],
    selectPersonEl = formEl.selectPerson,
    typeFieldsetEl  = formEl.querySelector("fieldset[data-bind='type']"),
    genderFieldsetEl = formEl.querySelector("fieldset[data-bind='gender']"),
    assoClubsUpWidget = formEl.querySelector(".MultiSelectionWidgetClub"),
    assoAssociationsUpWidget = formEl.querySelector(".MultiSelectionWidgetAsso");
let selectClubPlayerEl = formEl.selectClubPlayer,
    selectClubCoachEl = formEl.selectClubCoach,
    selectAssoPresidentEl = formEl.selectAssoPresident;

formEl.reset();

/***************************************************************
 Initialize subscription to DB-UI synchronization
 ***************************************************************/
let cancelSyncDBwithUI = null;

/***************************************************************
 Set up selection lists and widgets
 ***************************************************************/
// set up the person selection list
fillSelectWithOptions( selectPersonEl, personRecords, {valueProp:"personId", displayProp:"name"});

undisplayAllSegmentFields( formEl, PersonTypeEL.labels);

// load all football association records
const associationRecords = await FootballAssociation.retrieveAll();

createMultiSelectionWidget( assoClubsUpWidget, [],
    "upAssoClubs", "Enter ID", 0);
createMultiSelectionWidget( assoAssociationsUpWidget, [],
    "upAssoAssociations", "Enter ID", 0);

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

// when a person is selected, fill the form with its data
selectPersonEl.addEventListener("change", async function () {
    const personId = selectPersonEl.value;
    if (personId) {
        // retrieve up-to-date person record
        const personRec = await Person.retrieve( personId);

        formEl.personId.value = personRec.personId;
        formEl.name.value = personRec.name;
        formEl.dateOfBirth.value = personRec.dateOfBirth;

        // set up the gender radio button group
        createChoiceWidget( genderFieldsetEl, "gender",
            [personRec.gender], "radio", GenderEL.labels);

        // set up the type check box
        createChoiceWidget( typeFieldsetEl, "type", personRec.type,
            "checkbox", PersonTypeEL.labels);

        typeFieldsetEl.addEventListener("change", handleTypeSelectChangeEvent);

        if (personRec.type.length > 0) {
            for (const v of personRec.type) {
                displaySegmentFields( formEl, PersonTypeEL.labels,
                    parseInt(v));

                if (v === PersonTypeEL.MEMBER) {
                    const assoClubs = await Member.retrieve(personId).then(value => value.assoClubs);
                    const assoAssociations = await Member.retrieve(personId).then(value => value.assoAssociations);

                    if (typeof assoClubs !== 'undefined') {
                        createMultiSelectionWidget(assoClubsUpWidget, assoClubs,
                            "upAssoClubs", "Enter ID", 0);
                    }
                    if (typeof assoAssociations !== 'undefined') {
                        createMultiSelectionWidget(assoAssociationsUpWidget, assoAssociations,
                            "upAssoAssociations", "Enter ID", 0);
                    }
                } else if (v === PersonTypeEL.PLAYER) {
                    const playerRetrieveCheck = (await db.collection("players").doc( personId)
                        .withConverter( Player.converter).get()).data();

                    if (typeof playerRetrieveCheck !== 'undefined') {
                        selectClubPlayerEl.value = await Player.retrieve(personId).then(value => value.assoClub);
                    }
                } else if (v === PersonTypeEL.COACH) {
                    const coachRetrieveCheck = (await db.collection("coaches").doc( personId)
                        .withConverter( Coach.converter).get()).data();

                    if (coachRetrieveCheck !== 'undefined') {
                        selectClubCoachEl.value = await Coach.retrieve(personId).then(value => value.assoClub);
                    }
                } else if (v === PersonTypeEL.PRESIDENT) {
                    const presidentRetrieveCheck = (await db.collection("presidents").doc( personId)
                        .withConverter( President.converter).get()).data();

                    if (presidentRetrieveCheck !== 'undefined') {
                        selectAssoPresidentEl.value = await President.retrieve(personId).then(value => value.assoAssociation);
                    }
                }
            }
        } else {
            undisplayAllSegmentFields( formEl, PersonTypeEL.labels);
        }

    } else {
        formEl.reset();
        typeFieldsetEl.innerHTML = "";
    }
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

// set up listener to document changes on selected person record
selectPersonEl.addEventListener("change", async function () {
    cancelSyncDBwithUI = await Person.syncDBwithUI( selectPersonEl.value);
});

/***************************************************************
 Add event listeners for responsive validation
 ***************************************************************/
formEl.name.addEventListener("input", function () {
    formEl.name.setCustomValidity(
        Person.checkName( formEl.name.value).message);
});
formEl.dateOfBirth.addEventListener("input", function () {
    formEl.dateOfBirth.setCustomValidity(
        Person.checkDateOfBirth( formEl.dateOfBirth.value).message);
});
genderFieldsetEl.addEventListener("change", function () {
    genderFieldsetEl.setCustomValidity(
        (!genderFieldsetEl.value) ? "A gender must be selected!":"" );
});
typeFieldsetEl.addEventListener("click", function () {
    const val = typeFieldsetEl.getAttribute("data-value");
    formEl.type[0].setCustomValidity(
        (!val || Array.isArray(val) && val.length === 0) ?
            "At least one type form must be selected!":"" );
});

/******************************************************************
 Add further event listeners, especially for the save/delete button
 ******************************************************************/
// Set an event handler for the submit/save button
submitButton.addEventListener("click", handleSubmitButtonClickEvent);

// neutralize the submit event
formEl.addEventListener( "submit", function (e) {
    e.preventDefault();
});

// Set event cancel of DB-UI sync when the browser window/tab is closed
window.addEventListener("beforeunload", function () {
    cancelSyncDBwithUI;
});

async function handleSubmitButtonClickEvent() {
    const formEl = document.forms['Person'],
        selectPersonEl = formEl.selectPerson,
        personId = selectPersonEl.value,
        assoClubsListEl = assoClubsUpWidget.querySelector("ul"),
        assoAssociationsListEl = assoAssociationsUpWidget.querySelector("ul");

    if (!personId) return;
    const slots = {
        personId: formEl.personId.value,
        name: formEl.name.value,
        dateOfBirth: formEl.dateOfBirth.value,
        gender: genderFieldsetEl.getAttribute("data-value"),
        type: JSON.parse(typeFieldsetEl.getAttribute("data-value"))
    };

    // set error messages in case of constraint violations
    formEl.name.setCustomValidity(Person.checkName(slots.name).message);
    formEl.dateOfBirth.setCustomValidity(Person.checkDateOfBirth(slots.dateOfBirth).message);
    formEl.gender[0].setCustomValidity(Person.checkGender(slots.gender).message);
    formEl.type[0].setCustomValidity(Person.checkTypes(slots.type).message);

    if (formEl.checkValidity()) {
        await Person.update(slots);
    }

    if (slots.type) {
        // check type and save association entities depending on types
        if (slots.type.includes(PersonTypeEL.MEMBER)) {
            const assoClubIdRefsToAdd = [], assoClubIdRefsToRemove = [];
            for (const assoClubItemEl of assoClubsListEl.children) {
                if (assoClubItemEl.classList.contains("removed")) {
                    assoClubIdRefsToRemove.push(assoClubItemEl.getAttribute("data-value"));
                }
                if (assoClubItemEl.classList.contains("added")) {
                    assoClubIdRefsToAdd.push(assoClubItemEl.getAttribute("data-value"));
                }
            }

            // if the add/remove list is non-empty, create a corresponding slot
            if (assoClubIdRefsToRemove.length > 0) {
                slots.assoClubIdRefsToRemove = assoClubIdRefsToRemove;
            }
            if (assoClubIdRefsToAdd.length > 0) {
                slots.assoClubIdRefsToAdd = assoClubIdRefsToAdd;
            }
            if (slots.assoClubIdRefsToAdd) {
                for (const ac of slots.assoClubIdRefsToAdd) {
                    let responseValidation = await Member.checkAssoClub( ac);
                    if (responseValidation.message !== "") {
                        formEl["upAssoClubs"].setCustomValidity( responseValidation.message);
                        break;
                    } else formEl["upAssoClubs"].setCustomValidity("");
                }
            }

            // construct assoAssociationIdRefs-ToAdd/ToRemove lists
            const assoAssociationIdRefsToAdd = [], assoAssociationIdRefsToRemove = [];
            for (const assoAssociationItemEl of assoAssociationsListEl.children) {
                if (assoAssociationItemEl.classList.contains("removed")) {
                    assoAssociationIdRefsToRemove.push(assoAssociationItemEl.getAttribute("data-value"));
                }
                if (assoAssociationItemEl.classList.contains("added")) {
                    assoAssociationIdRefsToAdd.push(assoAssociationItemEl.getAttribute("data-value"));
                }
            }
            // if the add/remove list is non-empty, create a corresponding slot
            if (assoAssociationIdRefsToRemove.length > 0) {
                slots.assoAssociationIdRefsToRemove = assoAssociationIdRefsToRemove;
            }
            if (assoAssociationIdRefsToAdd.length > 0) {
                slots.assoAssociationIdRefsToAdd = assoAssociationIdRefsToAdd;
            }
            if (slots.assoAssociationIdRefsToAdd) {
                for (const aa of slots.assoAssociationIdRefsToAdd) {
                    let responseValidation = await Member.checkAssoAssociation( aa);
                    if (responseValidation.message !== "") {
                        formEl["upAssoAssociations"].setCustomValidity( responseValidation.message);
                        break;
                    } else formEl["upAssoAssociations"].setCustomValidity("");
                }
            }


            if (formEl.checkValidity()) {
                const memberExistCheck = (await db.collection("members").doc( personId)
                    .withConverter( Member.converter).get()).data();

                if (typeof memberExistCheck === 'undefined') {
                    await Member.add(slots);
                } else {
                    await Member.update(slots);
                }
                assoClubsListEl.innerHTML = "";
                assoAssociationsListEl.innerHTML = "";

            }
        } else {
            const memberExistCheck = (await db.collection("members").doc( personId)
                .withConverter( Member.converter).get()).data();
            if (typeof memberExistCheck !== 'undefined') {
                await Member.destroy(personId);
            }
        }

        if (slots.type.includes(PersonTypeEL.PLAYER)) {
            formEl.selectClubPlayer.setCustomValidity(
                (formEl.selectClubPlayer.value.length > 0) ? "" : "No associated club selected!"
            );

            if (formEl.checkValidity()) {
                const playerExistCheck = (await db.collection("players").doc( personId)
                    .withConverter( Member.converter).get()).data();
                slots.assoClub_id = parseInt(formEl.selectClubPlayer.value);

                if (typeof playerExistCheck === 'undefined') {
                    await Player.add(slots);
                } else {
                    await Player.update(slots);
                }
            }

        } else {
            const playerRetrieveCheck = (await db.collection("players").doc( personId)
                .withConverter( Member.converter).get()).data();
            if (playerRetrieveCheck) {
                await Player.destroy(personId);
            }
        }

        if (slots.type.includes(PersonTypeEL.COACH)) {
            formEl.selectClubCoach.setCustomValidity(
                formEl.selectClubCoach.value.length > 0 ? "" :
                    "No associated club selected!"
            );

            if (formEl.checkValidity()) {
                const coachExistCheck = (await db.collection("coaches").doc( personId)
                    .withConverter( Member.converter).get()).data();
                slots.assoClub_id = parseInt(formEl.selectClubCoach.value);

                if (typeof coachExistCheck === 'undefined') {
                    await Coach.add(slots);
                } else {
                    await Coach.update(slots);
                }
            }

        } else {
            const coachRetrieveCheck = (await db.collection("coaches").doc( personId)
                .withConverter( Member.converter).get()).data();
            if (coachRetrieveCheck) {
                await Coach.destroy(personId);
            }
        }

        if (slots.type.includes(PersonTypeEL.PRESIDENT)) {
            formEl.selectAssoPresident.setCustomValidity(
                formEl.selectAssoPresident.value.length > 0 ? "" :
                    "No associated association selected!"
            );

            if (formEl.checkValidity()) {
                // const presidentExistCheck = await President.retrieve(personId);
                const presidentExistCheck = (await db.collection("presidents").doc( personId)
                    .withConverter( Member.converter).get()).data();
                slots.assoAssociation_id = parseInt(formEl.selectAssoPresident.value);

                if (typeof presidentExistCheck ==='undefined') {
                    await President.add(slots);
                } else {
                    await President.update(slots);
                }
            }
        } else {
            // const presidentRetrieveCheck = await President.retrieve(personId);
            const presidentRetrieveCheck = (await db.collection("presidents").doc( personId)
                .withConverter( Member.converter).get()).data();
            if (presidentRetrieveCheck) {
                await President.destroy(personId);
            }
        }
    }

    if (formEl.checkValidity()) {
        await Person.update(slots);

        // update the selection list option
        selectPersonEl.options[selectPersonEl.selectedIndex].text = slots.name;
        undisplayAllSegmentFields( formEl, PersonTypeEL.labels);
        formEl.reset();
    }
}