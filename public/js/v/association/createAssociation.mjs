/**
 * @fileOverview  View methods for the use case "create football association"
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import FootballAssociation from "../../m/FootballAssociation.mjs";
import { showProgressBar, createMultiSelectionWidget } from "../../../lib/util.mjs";

/***************************************************************
 Declare variables for accessing UI elements
 ***************************************************************/
const formEl = document.forms['Association'],
    supAssoCrtWidget = formEl.querySelector("div.MultiSelectionWidget"),
    saveButton = formEl.commit;
formEl.reset();

/***************************************************************
 Set up widgets
 ***************************************************************/
createMultiSelectionWidget( supAssoCrtWidget, [],
    "crtSupAssos", "Enter ID", 0);

/***************************************************************
 Add event listeners for responsive validation
 ***************************************************************/
formEl.assoId.addEventListener("input", async function () {
    let responseValidation = await FootballAssociation.checkAssoIdAsId( formEl.assoId.value);
    formEl.assoId.setCustomValidity( responseValidation.message);
});
formEl.name.addEventListener("input", function () {
    formEl.name.setCustomValidity( FootballAssociation.checkName
    ( formEl.name.value).message);
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
    const supAssociationsListEl = supAssoCrtWidget.querySelector("ul");
    const slots = {
        assoId: formEl.assoId.value,
        name: formEl.name.value,
        supAssociationIdRefs: []
    };

    formEl.assoId.setCustomValidity(( await FootballAssociation.checkAssoIdAsId(slots.assoId)).message);
    formEl.name.setCustomValidity( FootballAssociation.checkName( slots.name).message);
    // formEl.selectPresident.setCustomValidity( FootballAssociation.checkPresident( slots.president_id).message);

// get the list of selected supAssociations
    for (const el of supAssociationsListEl.children) {
        slots.supAssociationIdRefs.push( parseInt( el.getAttribute("data-value")));
    }
    if (slots.supAssociationIdRefs.length > 0) {
        for (const sa of slots.supAssociationIdRefs) {
            let responseValidation = await FootballAssociation.checkSupAssociation( String(sa));
            if (responseValidation.message) {
                formEl["crtSupAssos"].setCustomValidity( responseValidation.message);
                break;
            }  else formEl["crtSupAssos"].setCustomValidity( "");
        }
    } else {
        formEl["crtSupAssos"].setCustomValidity( "");
    }

    showProgressBar( "show");
    if (formEl.checkValidity()) {
        await FootballAssociation.add( slots);
        supAssociationsListEl.innerHTML = "";
        formEl.reset();
    }
    showProgressBar( "hide");
}