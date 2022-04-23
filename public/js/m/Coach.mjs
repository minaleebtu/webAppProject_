/**
 * @fileOverview  The model class Coach with attribute definitions and storage management methods
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 * @copyright Copyright 2013-2021 Gerd Wagner (Chair of Internet Technology) and Juan-Francisco Reyes, Brandenburg University of Technology, Germany.
 * @license This code is licensed under The Code Project Open License (CPOL), implying that the code is provided "as-is",
 * can be modified to create derivative works, can be redistributed, and can be used in commercial applications.
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import { db } from "../c/initialize.mjs";

import {dateToTimestamp, handleUserMessage, timestampToDate} from "../../lib/util.mjs";
import { MandatoryValueConstraintViolation, NoConstraintViolation,
    UniquenessConstraintViolation } from "../../lib/errorTypes.mjs";
import Person, {GenderEL, PersonTypeEL} from "./Person.mjs";
import FootballClub from "./FootballClub.mjs";

/**
 * Constructor function for the class Coach
 * @class
 */
class Coach extends Person {
    // using a single record parameter with ES6 function parameter destructuring
    constructor ({personId, name, dateOfBirth, gender, type, assoClub, assoClub_id}) {
        super({personId, name, dateOfBirth, gender, type});  // invoke Person constructor
        this.assoClub = assoClub || assoClub_id;

    }
    static async checkPersonIdAsIdRef ( personId) {
        var validationResult = Coach.checkPersonId( personId);
        if ((validationResult instanceof NoConstraintViolation)) {
            if (!personId) {
                validationResult = new MandatoryValueConstraintViolation(
                    "A value for the Person ID must be provided!");
            } else {
                let coachDocSn = await db.collection("coaches").doc( personId).get();
                if (!coachDocSn.exists) {
                    validationResult = new UniquenessConstraintViolation(
                        `There is no coach record with this Person ID "${personId}"!`);
                } else {
                    validationResult = new NoConstraintViolation();
                }
            }
        }
        return validationResult;
    };

    get assoClub() {
        return this._assoClub;
    };
    static async checkAssoClub(assoClub_id) {
        var validationResult = null;
        if (!assoClub_id) {
            validationResult = new MandatoryValueConstraintViolation(
                "A value for the associated club must be provided!");
        } else {
            // invoke foreign key constraint check
            validationResult = await FootballClub.checkClubIdAsIdRef( String(assoClub_id));
        }
        return validationResult;
    };
    set assoClub(assoClub) {
        this._assoClub = assoClub;
    };
}

/*********************************************************
 *** Class-level ("static") storage management methods ****
 **********************************************************/
/**
 *  Conversion between a Coach object and a corresponding Firestore document
 */
Coach.converter = {
    toFirestore: function (coach) {
        const data = {
            personId: coach.personId,
            name: coach.name,
            dateOfBirth: dateToTimestamp(coach.dateOfBirth),
            gender: parseInt(coach.gender),
            type: coach.type,
            assoClub_id : coach.assoClub
        };
        return data;
    },
    fromFirestore: function (snapshot, options) {
        const coach = snapshot.data( options);
        const data = {
            personId: coach.personId,
            name: coach.name,
            dateOfBirth: timestampToDate( coach.dateOfBirth),
            gender: parseInt(coach.gender),
            type: coach.type,
            assoClub : coach.assoClub_id
        };
        return new Coach( data);
    }
};

/**
 *  Load a coach record
 */
Coach.retrieve = async function (personId) {
    try {
        const coachRec = (await db.collection("coaches").doc( personId)
            .withConverter( Coach.converter).get()).data();
        console.log(`Coach record "${coachRec.personId}" retrieved.`);
        return coachRec;
    } catch (e) {
        console.error(`Error retrieving coach record: ${e}`);
    }
};

/**
 *  Load all coach records
 */
Coach.retrieveAll = async function (order) {
    let coachesCollRef = db.collection("coaches");
    try {
        if (order) coachesCollRef = coachesCollRef.orderBy( order);
        const coachRecords = (await coachesCollRef.withConverter( Coach.converter)
            .get()).docs.map( d => d.data());
        console.log(`${coachRecords.length} coach records retrieved ${order ? "ordered by " + order : ""}`);
        return coachRecords;
    } catch (e) {
        console.error(`Error retrieving coach records: ${e}`);
    }
};

/**
 * Retrieve block of coach records
 */
Coach.retrieveBlock = async function (params) {
    try {
        let coachesCollRef = db.collection("coaches");
        // set limit and order in query
        coachesCollRef = coachesCollRef.limit( 11);
        if (params.order) coachesCollRef = coachesCollRef.orderBy( params.order);
        // set pagination 'startAt' cursor
        if (params.cursor) {
            if (params.order === "dateOfBirth") {
                coachesCollRef = coachesCollRef.startAt( dateToTimestamp( params.cursor));
            }
            else coachesCollRef = coachesCollRef.startAt( params.cursor);
        }
        const coachRecords = (await coachesCollRef.withConverter( Coach.converter)
            .get()).docs.map( d => d.data());
        console.log(`Block of coach records retrieved! (cursor: ${coachRecords[0][params.order]})`);
        return coachRecords;
    } catch (e) {
        console.error(`Error retrieving all coach records: ${e}`);
    }
};

/**
 *  Create a new coach record
 */
Coach.add = async function (slots) {
    var validationResult = null,
        coach = null;
    try {
        coach = new Coach(slots);
        validationResult = await Coach.checkPersonIdAsId( coach.personId);
        if (!validationResult instanceof NoConstraintViolation) {
            throw validationResult;
        }
        const coachDocRef = db.collection("coaches").doc( coach.personId);
        await coachDocRef.withConverter( Coach.converter).set( coach);
        console.log(`Coach record "${coach.personId}" created!`);
    } catch( e) {
        console.error(`${e.constructor.name}: ${e.message}`);
    }
};

/**
 *  Update an existing coach record
 */
Coach.update = async function (slots) {
    const updatedSlots = {};
    let validationResult = null,
        coachRec = null,
        coachDocRef = null;

    try {
        coachDocRef = db.collection("coaches").doc(slots.personId);
        const  coachDocSn = await  coachDocRef.withConverter(Coach.converter).get();
        coachRec =  coachDocSn.data();
    } catch (e) {
        console.error(`${e.constructor.name}: ${e.message}`);
    }
    try {
        if (coachRec.name !== slots.name) {
            validationResult = Coach.checkName( slots.name);
            if (validationResult instanceof NoConstraintViolation) {
                updatedSlots.name = slots.name;
            } else {
                throw validationResult;
            }
        }
        if (coachRec.dateOfBirth !== slots.dateOfBirth) {
            validationResult = Coach.checkDateOfBirth( slots.dateOfBirth);
            if (validationResult instanceof NoConstraintViolation) {
                updatedSlots.dateOfBirth = dateToTimestamp(slots.dateOfBirth);
            } else {
                throw validationResult;
            }
        }
        if (coachRec.gender !== parseInt(slots.gender)) {
            validationResult = Coach.checkGender( slots.gender);
            if (validationResult instanceof NoConstraintViolation) {
                updatedSlots.gender = parseInt(slots.gender);
            } else {
                throw validationResult;
            }
        }
        if (!coachRec.type.isEqualTo(slots.type)) {
            validationResult = Coach.checkTypes( slots.type);
            if (validationResult instanceof NoConstraintViolation) {
                updatedSlots.type = slots.type;
            } else {
                throw validationResult;
            }
        }
        if (slots.assoClub && coachRec.assoClub !== parseInt(slots.assoClub)) {
            validationResult = await Coach.checkAssoClub( slots.assoClub);
            if (validationResult instanceof NoConstraintViolation) {
                updatedSlots.assoClub = parseInt(slots.assoClub);
            } else {
                throw validationResult;
            }
        } else if (!parseInt(slots.assoClub) && coachRec.assoClub !== undefined) {
            updatedSlots.assoClub = firebase.firestore.FieldValue.delete();
        }
    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
        // noConstraintViolated = false;
    }
    let updatedProperties = Object.keys( updatedSlots);
    if (updatedProperties.length > 0) {
        await coachDocRef.withConverter( Coach.converter).update( updatedSlots);
        console.log(`Property(ies) "${updatedProperties.toString()}" modified for coach record (Person ID: "${slots.personId}")`);
    } else {
        console.log(`No property value changed for coach record (Person ID: "${slots.personId}")!`);
    }
};

/**
 *  Delete a coach record
 */
Coach.destroy = async function (personId) {
    try {
        const clubsCollRef = db.collection("clubs"),
            coachesCollRef = db.collection("coaches"),
            clubQrySn = clubsCollRef.where("assoClub_id", "==", parseInt(personId)),
            associatedClubDocSns = (await clubQrySn.get()).docs,
            coachDocRef = coachesCollRef.doc( personId);

        // initiate batch write
        const batch = db.batch();
        for (const ac of associatedClubDocSns) {
            const coachDocRef = coachesCollRef.doc( ac.id);
            // remove associated coach from each football club record
            batch.update( coachDocRef, {
                assoClub_id: firebase.firestore.FieldValue.delete()
            });
        }
        // delete coach record
        batch.delete( coachDocRef);
        batch.commit(); // finish batch write
        console.log(`Coach record (Person ID: "${personId}") deleted!`);
    } catch( e) {
        console.error(`Error when deleting coach record: ${e}`);
    }
};

/*******************************************
 *** Auxiliary methods for testing **********
 ********************************************/
// Create test data
Coach.generateTestData = async function () {
    try {
        let coachRecords = [
            {
                personId: "12",
                name: "Joachim Löw",
                dateOfBirth: "1960-02-03",
                gender: GenderEL.M,
                type: [PersonTypeEL.COACH],
                assoClub: 1
            },
            {
                personId: "24",
                name: "Martina Voss-Tecklenburg",
                dateOfBirth: "1967-12-22",
                gender: GenderEL.F,
                type: [PersonTypeEL.COACH],
                assoClub: 3
            },
            {
                personId: "27",
                name: "Patrik Grolimund",
                dateOfBirth: "1980-08-19",
                gender: GenderEL.M,
                type: [PersonTypeEL.MEMBER, PersonTypeEL.COACH],
                assoClub: 2
            }
        ];

        console.log('Generating test data...');
        // const response = await fetch( "../../test-data/coaches.json");
        // const coachRecords = await response.json();
        await Promise.all( coachRecords.map( d => Coach.add( d)));

        console.log(`${coachRecords.length} coaches saved.`);
    } catch (e) {
        console.error(`${e.constructor.name}: ${e.message}`);
    }
};

// Clear test data
Coach.clearData = async function () {
    if (confirm("Do you really want to delete all coach records?")) {
        console.log('Clearing test data...');
        let coachesCollRef = db.collection("coaches");
        try {
            const coachDocSns = (await coachesCollRef.withConverter( Person.converter)
                .get()).docs;
            await Promise.all( coachDocSns.map(
                coachDocSns => Coach.destroy( coachDocSns.id)
            ));
            console.log(`${coachDocSns.length} coach records deleted.`);
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
Coach.syncDBwithUI = async function (personId) {
    try {
        let coachDocRef = db.collection("coaches").doc( personId);
        let originalCoachDocSn = await coachDocRef.get();
        // listen document changes returning a snapshot on every change
        return coachDocRef.onSnapshot( coachDocSn => {
            // identify if changes are local or remote
            if (!coachDocSn.metadata.hasPendingWrites) {
                if (!coachDocSn.data()) {
                    handleUserMessage("removed", originalCoachDocSn.data());
                } else if (!coachDocSn.isEqual( originalCoachDocSn)) {
                    handleUserMessage("modified", coachDocSn.data());
                }
            }
        });
    } catch (e) {
        console.error(`${e.constructor.name} : ${e.message}`);
    }
}

export default Coach;
