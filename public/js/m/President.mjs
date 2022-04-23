/**
 * @fileOverview  The model class President with attribute definitions and storage management methods
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 * @copyright Copyright 2013-2021 Gerd Wagner (Chair of Internet Technology) and Juan-Francisco Reyes, Brandenburg University of Technology, Germany.
 * @license This code is licensed under The Code Project Open License (CPOL), implying that the code is provided "as-is",
 * can be modified to create derivative works, can be redistributed, and can be used in commercial applications.
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import { db } from "../c/initialize.mjs";
import { handleUserMessage, dateToTimestamp, timestampToDate} from "../../lib/util.mjs";
import { MandatoryValueConstraintViolation, NoConstraintViolation } from "../../lib/errorTypes.mjs";
import Person from "./Person.mjs";
import FootballAssociation from "./FootballAssociation.mjs";

/**
 * Constructor function for the class President
 * @class
 */
class President extends Person {
    // using a single record parameter with ES6 function parameter destructuring
    constructor ({personId, name, dateOfBirth, gender, type, assoAssociation, assoAssociation_id}) {
        super({personId, name, dateOfBirth, gender, type});  // invoke Person constructor

        this.assoAssociation = assoAssociation || assoAssociation_id;
    }

    get assoAssociation() {
        return this._assoAssociation;
    }
    static async checkAssoAssociation(assoAssociation_id) {
        var validationResult = null;
        if (!assoAssociation_id) {
            validationResult = new MandatoryValueConstraintViolation("The associated association must be required!");
        } else {
            // invoke foreign key constraint check
            validationResult = await FootballAssociation.checkAssoIdAsIdRef( String(assoAssociation_id));

        }
        return validationResult;
    }
    set assoAssociation(aa) {
        this._assoAssociation = aa;
    }
}

/*********************************************************
 *** Class-level ("static") storage management methods ****
 **********************************************************/
/**
 *  Conversion between a President object and a corresponding Firestore document
 */
President.converter = {
    toFirestore: function (president) {
        const data = {
            personId: president.personId,
            name: president.name,
            dateOfBirth: dateToTimestamp(president.dateOfBirth),
            gender: parseInt(president.gender),
            type: president.type,
            assoAssociation_id: president.assoAssociation
        };
        return data;
    },
    fromFirestore: function (snapshot, options) {
        const president = snapshot.data( options);
        const data = {
            personId: president.personId,
            name: president.name,
            dateOfBirth: timestampToDate( president.dateOfBirth),
            gender: parseInt(president.gender),
            type: president.type,
            assoAssociation : president.assoAssociation_id
        };
        return new President( data);
    }
};

/**
 *  Load a president record
 */
President.retrieve = async function (personId) {
    try {
        const presidentRec = (await db.collection("presidents").doc( personId)
            .withConverter( President.converter).get()).data();
        console.log(`President record "${presidentRec.personId}" retrieved.`);
        return presidentRec;
    } catch (e) {
        console.error(`Error retrieving president record: ${e}`);
    }
};

/**
 *  Load all president records
 */
President.retrieveAll = async function (order) {
    let presidentsCollRef = db.collection("presidents");
    try {
        if (order) presidentsCollRef = presidentsCollRef.orderBy( order);
        const presidentRecords = (await presidentsCollRef.withConverter( President.converter)
            .get()).docs.map( d => d.data());
        console.log(`${presidentRecords.length} president records retrieved ${order ? "ordered by " + order : ""}`);
        return presidentRecords;
    } catch (e) {
        console.error(`Error retrieving president records: ${e}`);
    }
};

/**
 * Retrieve block of president records
 */
President.retrieveBlock = async function (params) {
    try {
        let presidentsCollRef = db.collection("presidents");
        // set limit and order in query
        presidentsCollRef = presidentsCollRef.limit( 11);
        if (params.order) presidentsCollRef = presidentsCollRef.orderBy( params.order);
        // set pagination 'startAt' cursor
        if (params.cursor) {
            if (params.order === "dateOfBirth") {
                presidentsCollRef = presidentsCollRef.startAt( dateToTimestamp( params.cursor));
            }
            else presidentsCollRef = presidentsCollRef.startAt( params.cursor);
        }
        const presidentRecords = (await presidentsCollRef.withConverter( President.converter)
            .get()).docs.map( d => d.data());
        console.log(`Block of president records retrieved! (cursor: ${presidentRecords[0][params.order]})`);
        return presidentRecords;
    } catch (e) {
        console.error(`Error retrieving all president records: ${e}`);
    }
};

/**
 *  Create a new president record
 */
President.add = async function (slots) {
    var validationResult = null,
        president = null;
    try {
        president = new President(slots);
        validationResult = await President.checkPersonIdAsId( president.personId);
        if (!validationResult instanceof NoConstraintViolation) {
            throw validationResult;
        }
        const presidentDocRef = db.collection("presidents").doc( president.personId);
        await presidentDocRef.withConverter( President.converter).set( president);
        console.log(`President record "${president.personId}" created!`);
    } catch( e) {
        console.error(`${e.constructor.name}: ${e.message}`);
    }
};
/**
 *  Update an existing president record
 */
President.update = async function (slots) {
    const updatedSlots = {};
    let validationResult = null,
        presidentRec = null,
        presidentDocRef = null;

    try {
        presidentDocRef = db.collection("presidents").doc(slots.personId);
        const presidentDocSn = await presidentDocRef.withConverter(President.converter).get();
        presidentRec = presidentDocSn.data();
    } catch (e) {
        console.error(`${e.constructor.name}: ${e.message}`);
    }
    try {
        if (presidentRec.name !== slots.name) {
            validationResult = President.checkName( slots.name);
            if (validationResult instanceof NoConstraintViolation) {
                updatedSlots.name = slots.name;
            } else {
                throw validationResult;
            }
        }
        if (presidentRec.dateOfBirth !== slots.dateOfBirth) {
            validationResult = President.checkDateOfBirth( slots.dateOfBirth);
            if (validationResult instanceof NoConstraintViolation) {
                updatedSlots.dateOfBirth = dateToTimestamp(slots.dateOfBirth);
            } else {
                throw validationResult;
            }
        }
        if (presidentRec.gender !== parseInt(slots.gender)) {
            validationResult = President.checkGender( slots.gender);
            if (validationResult instanceof NoConstraintViolation) {
                updatedSlots.gender = parseInt(slots.gender);
            } else {
                throw validationResult;
            }
        }
        if (!presidentRec.type.isEqualTo(slots.type)) {
            validationResult = President.checkTypes( slots.type);
            if (validationResult instanceof NoConstraintViolation) {
                updatedSlots.type = slots.type;
            } else {
                throw validationResult;
            }
        }
        if (slots.assoAssociation && presidentRec.assoAssociation !== parseInt(slots.assoAssociation)) {
            validationResult = await President.checkAssoAssociation( slots.assoAssociation);
            if (validationResult instanceof NoConstraintViolation) {
                updatedSlots.assoAssociation = parseInt(slots.assoAssociation);
            } else {
                throw validationResult;
            }
        } else if (!parseInt(slots.assoAssociation) && presidentRec.assoAssociation !== undefined) {
            updatedSlots.assoAssociation = firebase.firestore.FieldValue.delete();
        }
    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
    }

    let updatedProperties = Object.keys( updatedSlots);

    if (updatedProperties.length > 0) {
        await presidentDocRef.withConverter( President.converter).update( updatedSlots);
        console.log(`Property(ies) "${updatedProperties.toString()}" modified for president record (Person ID: "${slots.personId}")`);
    } else {
        console.log(`No property value changed for president record (Person ID: "${slots.personId}")!`);
    }
};

/**
 *  Delete a president record
 */
President.destroy = async function (personId) {
    try {
        const assosCollRef = db.collection("associations"),
            presidentsCollRef = db.collection("presidents"),
            assoQrySn = assosCollRef.where("assoAssociation_id", "==", parseInt(personId)),
            associatedAssoDocSns = (await assoQrySn.get()).docs,
            presidentDocRef = presidentsCollRef.doc( personId);
        // initiate batch write
        const batch = db.batch();
        for (const aa of associatedAssoDocSns) {
            const assoDocRef = assosCollRef.doc( aa.id);
            // remove associated personId from each football association record
            batch.update( assoDocRef, {
                assoAssociation_id: firebase.firestore.FieldValue.delete()
            });
        }
        // delete president record
        batch.delete( presidentDocRef);
        batch.commit(); // finish batch write
        console.log(`President record (Person ID: "${personId}") deleted!`);
    } catch (e) {
        console.error(`Error deleting president record: ${e}`);
    }
};

/*******************************************
 *** Auxiliary methods for testing **********
 ********************************************/
// Create test data
President.generateTestData = async function () {
    try {
        // let presidentRecords = [
        //     {
        //         personId: "25",
        //         name: "Peter Peters",
        //         dateOfBirth: "1965-11-10",
        //         gender: GenderEL.M,
        //         type: [PersonTypeEL.PRESIDENT],
        //         assoAssociation_id: 1
        //     },
        //     {
        //         personId: "26",
        //         name: "Britta Carlson",
        //         dateOfBirth: "1978-03-03",
        //         gender: GenderEL.F,
        //         type: [PersonTypeEL.PRESIDENT],
        //         assoAssociation_id: 2
        //     }
        // ];
        console.log('Generating test data...');
        const response = await fetch( "../../test-data/presidents.json");
        const presidentRecords = await response.json();
        await Promise.all( presidentRecords.map( d => President.add( d)));

        console.log(`${presidentRecords.length} presidents saved.`);
    } catch (e) {
        console.error(`${e.constructor.name}: ${e.message}`);
    }
};

// Clear test data
President.clearData = async function () {
    if (confirm("Do you really want to delete all president records?")) {
        console.log('Clearing test data...');

        let presidentsCollRef = db.collection("presidents");

        try {
            const presidentDocSns = (await presidentsCollRef.withConverter( President.converter)
                .get()).docs;

            await Promise.all( presidentDocSns.map(
                presidentDocSn => President.destroy( presidentDocSn.id)
            ));
            console.log(`${presidentDocSns.length} presidents deleted.`);
        } catch (e) {
            console.error(`${e.constructor.name}: ${e.message}`);
        }
    }
};

/*******************************************
 *** Non specific use case procedures ******
 ********************************************/
/**
 * Handle DB-UI synchronization
 */
President.syncDBwithUI = async function (personId) {
    try {
        let presidentDocRef = db.collection("presidents").doc( personId);
        let originalPresidentDocSn = await presidentDocRef.get();
        // listen document changes returning a snapshot on every change
        return presidentDocRef.onSnapshot( presidentDocSn => {
            // identify if changes are local or remote
            if (!presidentDocSn.metadata.hasPendingWrites) {
                if (!presidentDocSn.data()) {
                    handleUserMessage("removed", originalPresidentDocSn.data());
                } else if (!presidentDocSn.isEqual( originalPresidentDocSn)) {
                    handleUserMessage("modified", presidentDocSn.data());
                }
            }
        });
    } catch (e) {
        console.error(`${e.constructor.name} : ${e.message}`);
    }
}

export default President;
