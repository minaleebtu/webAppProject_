/**
 * @fileOverview  Contains various view functions for the use case "list persons"
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import Person, {GenderEL, PersonTypeEL} from "../../m/Person.mjs";
import { fillSelectWithOptions, showProgressBar } from "../../../lib/util.mjs";
import Member from "../../m/Member.mjs";
import Player from "../../m/Player.mjs";
import Coach from "../../m/Coach.mjs";
import President from "../../m/President.mjs";
import FootballClub from "../../m/FootballClub.mjs";
import FootballAssociation from "../../m/FootballAssociation.mjs";

/**********************************************************************
 Declare variables for accessing UI elements
 **********************************************************************/

const tableBodyEl = document.querySelector("table#persons > tbody");

const trEl = document.querySelector("table>thead>tr"),
    selectTypeEl = document.querySelector("select#selectType"),
    preNextSpan = document.getElementById("preNextBtn");

/***************************************************************
 Initialize pagination mapping references
 ***************************************************************/
let cursor = null,
    previousPageRef = null,
    nextPageRef = null,
    startAtRefs = [];
let order = "personId"; // default order value
const selectOrderEl = document.querySelector("main > div > div > label > select#selectOrder");
const previousBtnEl = document.getElementById("previousPage"),
    nextBtnEl = document.getElementById("nextPage");

await createBlock();
startAtRefs.push( cursor); // set 'first' startAt page reference
previousBtnEl.disabled = true;

/***************************************************************
 Handle order selector
 ***************************************************************/
fillSelectWithOptions(selectTypeEl, PersonTypeEL.labels);

selectTypeEl.addEventListener("change", async function (e) {
    await typeRender(selectOrderEl.value, selectTypeEl.value);
});

selectOrderEl.addEventListener("change", async function (e) {
    const typeValue = selectTypeEl.value;
    order = e.target.value;
    startAtRefs = [];
    await createBlock();
    startAtRefs.push( cursor);
    previousBtnEl.disabled = true;
    nextBtnEl.disabled = false;

    if (typeValue) {
        await typeRender( order, selectTypeEl.value);
    }
    else {
        await createBlock();
    }
});

async function typeRender(order, type) {
    trEl.innerHTML = "";
    tableBodyEl.innerHTML = "";

    if (type) {
        if (typeof type === 'string') {
            type = parseInt(type);
        }
        if (type === PersonTypeEL.MEMBER) {
            preNextSpan.style.visibility = "hidden";

            trEl.innerHTML = "";
            tableBodyEl.innerHTML = "";

            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Person ID"));
            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Name"));
            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Date Of Birth"));
            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Gender"));

            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Associated Clubs"));
            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Associated Associations"));

            const memberRecords = await Member.retrieveAll(order);

            for (const memberRec of memberRecords) {
                const row = tableBodyEl.insertRow();

                row.insertCell().textContent = memberRec.personId;
                row.insertCell().textContent = memberRec.name;
                row.insertCell().textContent = memberRec.dateOfBirth;
                row.insertCell().textContent = GenderEL.labels[memberRec.gender - 1];

                if (memberRec.assoClubs && memberRec.assoClubs.length > 0) {
                    const assoClubsToShow = [];
                    for (const club of memberRec.assoClubs) {
                        assoClubsToShow.push(await FootballClub.retrieve(String(club)).then(value => value.name) + " ("
                         + GenderEL.enumLitNames[await FootballClub.retrieve(String(club)).then(value => value.gender) - 1] + ")");
                    }
                    row.insertCell().innerHTML = '<ul><li>' + assoClubsToShow.join("</li><li>"); + '</li></ul>';
                } else {
                    row.insertCell().textContent = "";
                }

                if (memberRec.assoAssociations && memberRec.assoAssociations.length > 0) {
                    const assoAssociationsName = [];
                    for (const asso of memberRec.assoAssociations) {
                        assoAssociationsName.push(await FootballAssociation.retrieve(String(asso)).then(value => value.name));
                    }
                    row.insertCell().innerHTML = '<ul><li>' + assoAssociationsName.join("</li><li>"); + '</li></ul>';
                } else {
                    row.insertCell().textContent = "";
                }
                // row.insertCell().textContent = assoAssociationsName.length > 0 ? assoAssociationsName.length : "0";
            }
        } else if (type === PersonTypeEL.PLAYER) {
            preNextSpan.style.visibility = "hidden";

            trEl.innerHTML = "";
            tableBodyEl.innerHTML = "";

            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Person ID"));
            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Name"));
            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Date Of Birth"));
            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Gender"));
            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Associated Club"));

            const playerRecords = await Player.retrieveAll(order);

            // for each player, create a table row with a cell for each attribute
            for (let playerRecord of playerRecords) {
                const row = tableBodyEl.insertRow();
                row.insertCell().textContent = playerRecord.personId;
                row.insertCell().textContent = playerRecord.name;
                row.insertCell().textContent = playerRecord.dateOfBirth;
                row.insertCell().textContent = GenderEL.labels[playerRecord.gender - 1];
                if (playerRecord.assoClub) {
                    const clubName = await FootballClub.retrieve(String(playerRecord.assoClub)).then(value => value.name);
                    const clubGender = await FootballClub.retrieve(String(playerRecord.assoClub)).then(value => value.gender);
                    if (clubName !== undefined) {
                        row.insertCell().textContent = clubName + " (" + GenderEL.enumLitNames[clubGender - 1] + ")";
                    } else {
                        row.insertCell().textContent = "";
                    }
                } else{
                    row.insertCell().textContent = "";
                }
                // row.insertCell().textContent = playerRecord.assoClub ?
                //     await FootballClub.retrieve(String(playerRecord.assoClub)).then(value => value.name)? await FootballClub.retrieve(String(playerRecord.assoClub)).then(value => value.name): "" : "";
            }

        } else if (type === PersonTypeEL.COACH) {
            preNextSpan.style.visibility = "hidden";

            trEl.innerHTML = "";
            tableBodyEl.innerHTML = "";

            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Person ID"));
            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Name"));
            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Date Of Birth"));
            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Gender"));
            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Associated Club"));

            const coachRecords = await Coach.retrieveAll(order);

            // for each coach, create a table row with a cell for each attribute
            for (let coachRecord of coachRecords) {
                const row = tableBodyEl.insertRow();

                row.insertCell().textContent = coachRecord.personId;
                row.insertCell().textContent = coachRecord.name;
                row.insertCell().textContent = coachRecord.dateOfBirth;
                row.insertCell().textContent = GenderEL.labels[coachRecord.gender - 1];
                row.insertCell().textContent = coachRecord.assoClub ?
                    await FootballClub.retrieve(String(coachRecord.assoClub)).then(value => value.name)
                    + " (" + GenderEL.enumLitNames[await FootballClub.retrieve(String(coachRecord.assoClub)).then(value => value.gender) - 1] + ")" : "";


            }
        } else if (type === PersonTypeEL.PRESIDENT) {
            preNextSpan.style.visibility = "hidden";

            trEl.innerHTML = "";
            tableBodyEl.innerHTML = "";

            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Person ID"));
            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Name"));
            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Date Of Birth"));
            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Gender"));
            trEl.appendChild(document.createElement("th"))
                .appendChild(document.createTextNode("Associated Association"));

            const presidentRecords = await President.retrieveAll(order);

            // for each president, create a table row with a cell for each attribute
            for (let presidentRecord of presidentRecords) {
                const row = tableBodyEl.insertRow();

                row.insertCell().textContent = presidentRecord.personId;
                row.insertCell().textContent = presidentRecord.name;
                row.insertCell().textContent = presidentRecord.dateOfBirth;
                row.insertCell().textContent = GenderEL.labels[presidentRecord.gender - 1];
                row.insertCell().textContent = presidentRecord.assoAssociation ?
                    await FootballAssociation.retrieve(String(presidentRecord.assoAssociation)).then(value => value.name) : "";
            }
        } else {
            previousBtnEl.disabled = true;
        }
    } else {
        preNextSpan.style.visibility = "visible";
        previousBtnEl.disabled = true;

        trEl.innerHTML = "";
        tableBodyEl.innerHTML = "";

        trEl.appendChild(document.createElement("th"))
            .appendChild(document.createTextNode("Person ID"));
        trEl.appendChild(document.createElement("th"))
            .appendChild(document.createTextNode("Name"));
        trEl.appendChild(document.createElement("th"))
            .appendChild(document.createTextNode("Date Of Birth"));
        trEl.appendChild(document.createElement("th"))
            .appendChild(document.createTextNode("Gender"));
        trEl.appendChild(document.createElement("th"))
            .appendChild(document.createTextNode("Type"));
        await createBlock();
    }
}

/***************************************************************
 Create listing page
 ***************************************************************/
async function createBlock (startAt) {
    tableBodyEl.innerHTML = "";

    showProgressBar("show");

    const personExist = await Person.retrieveAll();

    if (personExist.length > 0) {
        const personRecords = await Person.retrieveBlock({"order": order, "cursor": startAt});
        // set page references for current (cursor) page
        cursor = personRecords[0][order];
        // set next startAt page reference, if not next page, assign 'null' value
        nextPageRef = (personRecords.length < 11) ? null : personRecords[personRecords.length -1][order];

        // for each person, create a table row with a cell for each attribute
        for (let person of personRecords) {
            let row = tableBodyEl.insertRow(-1);
            row.insertCell(-1).textContent = person.personId;
            row.insertCell(-1).textContent = person.name;
            row.insertCell(-1).textContent = person.dateOfBirth;
            row.insertCell(-1).textContent = GenderEL.labels[person.gender - 1];
            row.insertCell(-1).textContent = PersonTypeEL.stringify(person.type);
        }
    } else {
        previousBtnEl.disabled = true;
        nextBtnEl.disabled = true;
    }

    showProgressBar("hide");
}

/**
 * 'Previous' button
 */
previousBtnEl.addEventListener("click", async function () {
    // locate current page reference in index of page references
    previousPageRef = startAtRefs[startAtRefs.indexOf( cursor) - 1];
    // create new page
    await createBlock( previousPageRef);
    // disable 'previous' button if cursor is first page
    if (cursor === startAtRefs[0]) previousBtnEl.disabled = true;
    // enable 'next' button if cursor is not last page
    if (cursor !== startAtRefs[startAtRefs.length -1]) nextBtnEl.disabled = false;
});

/**
 *  'Next' button
 */
nextBtnEl.addEventListener("click", async function () {
    await createBlock( nextPageRef);
    // add new page reference if not present in index
    if (!startAtRefs.find( i => i === cursor)) startAtRefs.push( cursor);
    // disable 'next' button if cursor is last page
    if (!nextPageRef) nextBtnEl.disabled = true;
    // enable 'previous' button if cursor is not first page
    if (cursor !== startAtRefs[0]) previousBtnEl.disabled = false;
});