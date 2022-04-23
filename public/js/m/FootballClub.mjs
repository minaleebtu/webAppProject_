/**
 * @fileOverview  The model class FootballClub with attribute definitions and storage management methods
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 * @copyright Copyright 2013-2021 Gerd Wagner (Chair of Internet Technology) and Juan-Francisco Reyes, Brandenburg University of Technology, Germany.
 * @license This code is licensed under The Code Project Open License (CPOL), implying that the code is provided "as-is",
 * can be modified to create derivative works, can be redistributed, and can be used in commercial applications.
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import { db } from "../c/initialize.mjs";
import { isIntegerOrIntegerString, isNonEmptyString, handleUserMessage } from "../../lib/util.mjs";
import { NoConstraintViolation, MandatoryValueConstraintViolation,
    RangeConstraintViolation, UniquenessConstraintViolation,
    ReferentialIntegrityConstraintViolation } from "../../lib/errorTypes.mjs";
import { GenderEL } from "./Person.mjs";
import FootballAssociation from "./FootballAssociation.mjs";

/**
 * Constructor function for the class FootballClub
 */
class FootballClub {
    // using a single record parameter with ES6 function parameter destructuring
    constructor({clubId, name, gender, association, association_id}) {
        // assign properties by invoking implicit setters
        this.clubId = clubId; // number (integer)
        this.name = name; // string
        this.gender = gender; // GenderEL

        this.association = association || association_id;
    };

    get clubId() {
        return this._clubId;
    };
    static checkClubId(clubId) {
        if (!clubId) {
            return new NoConstraintViolation();  // may be optional as an IdRef
        } else {
            // convert to integer
            clubId = parseInt( clubId);
            if (isNaN( clubId) || !Number.isInteger( clubId) || clubId < 1) {
                return new RangeConstraintViolation("The Club ID must be a positive integer!");
            } else {
                return new NoConstraintViolation();
            }
        }
    };
    /*
       Checks ID uniqueness constraint against the direct type of a FootballClub object
       */
    static async checkClubIdAsId( clubId) {
        let validationResult = FootballClub.checkClubId( clubId);
        if ((validationResult instanceof NoConstraintViolation)) {
            if (!clubId) {
                validationResult = new MandatoryValueConstraintViolation(
                    "A value for the Club ID must be provided!");
            } else {
                let clubDocSn = await db.collection("clubs").doc( clubId).get();
                if (clubDocSn.exists) {
                    validationResult = new UniquenessConstraintViolation(
                        "There is already a football club record with this Club ID!");
                } else {
                    validationResult = new NoConstraintViolation();
                }
            }
        }
        return validationResult;
    };
    static async checkClubIdAsIdRef( id) {
        var constraintViolation = FootballClub.checkClubId( id);
        if ((constraintViolation instanceof NoConstraintViolation) &&
            id !== undefined) {
            let clubDocSn = await db.collection("clubs").doc( id).get();
            if (!clubDocSn.exists) {
                constraintViolation = new ReferentialIntegrityConstraintViolation(
                    `There is no football club record with this club ID (${id})!`);
            }
        }
        return constraintViolation;
    };
    set clubId( clubId) {
        const validationResult = FootballClub.checkClubId ( clubId);
        if (validationResult instanceof NoConstraintViolation) {
            this._clubId = clubId;
        } else {
            throw validationResult;
        }
    };

    get name() {
        return this._name;
    };
    static checkName(n) {
        if (!n) {
            return new MandatoryValueConstraintViolation
            ("[Football Club] A name must be provided!");
        } else if (!isNonEmptyString(n)) {
            return new RangeConstraintViolation
            ("The name must be a non-empty string!");
        } else {
            return new NoConstraintViolation();
        }
    };
    set name( n) {
        const validationResult = FootballClub.checkName( n);
        if (validationResult instanceof NoConstraintViolation) {
            this._name = n;
        } else {
            throw validationResult;
        }
    };

    get gender() {
        return this._gender;
    };
    static checkGender(g) {
        if (!g) {
            return new MandatoryValueConstraintViolation(
                "A value for the gender must be provided!"
            );
        } else if (!isIntegerOrIntegerString(g) ||
            parseInt(g) < 1 || parseInt(g) > GenderEL.MAX) {
            return new RangeConstraintViolation(
                `Invalid value for gender: ${g}`);
        } else {
            return new NoConstraintViolation();
        }
    };
    set gender(g) {
        const validationResult = FootballClub.checkGender( g);
        if (validationResult instanceof NoConstraintViolation) {
            this._gender = parseInt( g);
        } else {
            throw validationResult;
        }
    };

    get association() {
        return this._association;
    };
    static async checkAssociation(association_id) {
        var validationResult = null;
        if (!association_id) {
            validationResult = new MandatoryValueConstraintViolation(
                "A value for the association must be provided!");
        } else {
            // invoke foreign key constraint check
            validationResult = await FootballAssociation.checkAssoIdAsIdRef( association_id);
        }
        return validationResult;
    };
    set association(a) {
        this._association = a;
    };
}

/*********************************************************
 ***  Class-level ("static") storage management methods **
 *********************************************************/
/**
 *  Conversion between a FootballClub object and a corresponding Firestore document
 */
FootballClub.converter = {
    toFirestore: function (club) {
        const data = {
            clubId: club.clubId,
            name: club.name,
            gender: parseInt(club.gender),
            association_id: club.association
        };
        return data;
    },
    fromFirestore: function (snapshot, options) {
        const club = snapshot.data( options);
        const data = {
            clubId: club.clubId,
            name: club.name,
            gender: parseInt(club.gender),
            association: club.association_id
        };
        return new FootballClub( data);
    }
};

/**
 *  Load a football club record
 */
FootballClub.retrieve = async function (clubId) {
    try {
        const clubRec = (await db.collection("clubs").doc( clubId)
            .withConverter( FootballClub.converter).get()).data();
        console.log(`Football club record (Club ID: "${clubRec.clubId}") retrieved.`);
        return clubRec;
    } catch (e) {
        console.error(`Error retrieving football club record: ${e}`);
    }
};

/**
 *  Load all football club records
 */
FootballClub.retrieveAll = async function (order) {
    let clubsCollRef = db.collection("clubs");
    try {
        if (order) clubsCollRef = clubsCollRef.orderBy( order);
        const clubRecords = (await clubsCollRef.withConverter( FootballClub.converter)
            .get()).docs.map( d => d.data());
        console.log(`${clubRecords.length} football club records retrieved ${order ? "ordered by " + order : ""}`);
        return clubRecords;
    } catch (e) {
        console.error(`Error retrieving football club records: ${e}`);
    }
};

/**
 * Retrieve block of football club records
 */
FootballClub.retrieveBlock = async function (params) {
    try {
        let clubsCollRef = db.collection("clubs");
        // set limit and order in query
        clubsCollRef = clubsCollRef.limit( 11);
        if (params.order) clubsCollRef = clubsCollRef.orderBy( params.order);
        // set pagination 'startAt' cursor
        if (params.cursor) {
            clubsCollRef = clubrsCollRef.startAt( params.cursor);
        }
        const clubRecords = (await clubsCollRef.withConverter( FootballClub.converter)
            .get()).docs.map( d => d.data());
        console.log(`Block of football club records retrieved! (cursor: ${clubRecords[0][params.order]})`);
        return clubRecords;
    } catch (e) {
        console.error(`Error retrieving all football club records: ${e}`);
    }
};

/**
 *  Create a new football club record
 */
FootballClub.add = async function (slots) {
    var validationResult = null,
        club = null;
    try {
        club = new FootballClub(slots);
        validationResult = await FootballClub.checkClubIdAsId( club.clubId);
        if (!validationResult instanceof NoConstraintViolation) {
            throw validationResult;
        }
        const clubDocRef = db.collection("clubs").doc( club.clubId);
        await clubDocRef.withConverter( FootballClub.converter).set( club);
        console.log(`Football club record (Club ID: "${club.clubId}") created!`);
    } catch( e) {
        console.error(`${e.constructor.name}: ${e.message}`);
    }
};

/**
 *  Update an existing football club record
 */
FootballClub.update = async function (slots) {
    const updatedSlots = {};
    let validationResult = null,
        clubRec = null,
        clubDocRef = null;

    try {
        clubDocRef = db.collection("clubs").doc(slots.clubId);
        const clubDocSn = await clubDocRef.withConverter(FootballClub.converter).get();
        clubRec = clubDocSn.data();
    } catch (e) {
        console.error(`${e.constructor.name}: ${e.message}`);
    }

    try {
        if (clubRec.name !== slots.name) {
            validationResult = FootballClub.checkName( slots.name);
            if (validationResult instanceof NoConstraintViolation) {
                updatedSlots.name = slots.name;
            } else {
                throw validationResult;
            }
        }
        if (clubRec.gender !== parseInt(slots.gender)) {
            validationResult = FootballClub.checkGender( slots.gender);
            if (validationResult instanceof NoConstraintViolation) {
                updatedSlots.gender = parseInt(slots.gender);
            } else {
                throw validationResult;
            }
        }
        if (slots.association_id && clubRec.association !== parseInt(slots.association_id)) {
            validationResult = await FootballClub.checkAssociation( slots.association_id);
            if (validationResult instanceof NoConstraintViolation) {
                updatedSlots.association_id = parseInt(slots.association_id);
            } else {
                throw validationResult;
            }
        } else if (!parseInt(slots.association_id) && clubRec.association !== undefined) {
            updatedSlots.association_id = firebase.firestore.FieldValue.delete();
        }
    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
    }
    let updatedProperties = Object.keys( updatedSlots);
    if (updatedProperties.length > 0) {
        await clubDocRef.withConverter( FootballClub.converter).update( updatedSlots);
        console.log(`Property(ies) "${updatedProperties.toString()}" modified for football club record (Club ID: "${slots.clubId}")`);
    } else {
        console.log(`No property value changed for football club record (Club ID: "${slots.clubId}")!`);
    }
};

/**
 *  Delete a football club record
 */
FootballClub.destroy = async function (clubId) {
    try {
        const membersCollRef = db.collection("members"),
            playersCollRef = db.collection("players"),
            coachesCollRef = db.collection("coaches"),
            clubsCollRef = db.collection("clubs"),
            playerQrySn = playersCollRef.where("assoClub_id", "==", parseInt(clubId)),
            coachQrySn = coachesCollRef.where("assoClub_id", "==", parseInt(clubId)),
            memberQrySn = membersCollRef.where("assoClubIdRefs", "array-contains", parseInt(clubId)),
            associatedPlayerDocSns = (await playerQrySn.get()).docs,
            associatedCoachDocSns = (await coachQrySn.get()).docs,
            associatedMemberDocSns = (await memberQrySn.get()).docs,
            clubDocRef = clubsCollRef.doc( clubId);

        // initiate batch write
        const batch = db.batch();
        for (const am of associatedMemberDocSns) {
            const memberDocRef = membersCollRef.doc( am.id);
            // remove associated clubId from each Member record
            batch.update( memberDocRef, {
                assoClubIdRefs: firebase.firestore.FieldValue.arrayRemove( parseInt(clubId))
            });
        }
        for (const ap of associatedPlayerDocSns) {
            const playerDocRef = playersCollRef.doc( ap.id);
            // remove associated football club from each player record
            batch.update( playerDocRef, {
                assoClub_id: firebase.firestore.FieldValue.delete()
            });
        }
        for (const ac of associatedCoachDocSns) {
            const coachDocRef = coachesCollRef.doc( ac.id);
            // remove associated football club from each coach record
            batch.update( coachDocRef, {
                assoClub_id: firebase.firestore.FieldValue.delete()
            });
        }
        // delete football club record
        batch.delete( clubDocRef);
        batch.commit(); // finish batch write
        console.log(`Football club record (Club ID: "${clubId}") deleted!`);
    } catch (e) {
        console.error(`Error deleting football club record: ${e}`);
    }
};

/*******************************************
 *** Auxiliary methods for testing **********
 ********************************************/
// Create test data
FootballClub.generateTestData = async function () {
    try {
        let clubRecords = [
            {
                clubId: "1",
                name: "Arsenal FC",
                gender: GenderEL.M,
                association_id: 1
            },
            {
                clubId: "2",
                name: "Bayern Munich",
                gender: GenderEL.F,
                association_id: 2
            },
            {
                clubId: "3",
                name: "Eintracht Frankfurt",
                gender: GenderEL.M,
                association_id: 2
            },
            {
                clubId: "4",
                name: "Bayern Munich",
                gender: GenderEL.F,
                association_id: 2
            },
            {
                clubId: "5",
                name: "Eintracht Frankfurt",
                gender: GenderEL.F,
                association_id: 3
            },
            {
                clubId: "6",
                name: "SGS Essen",
                gender: GenderEL.F,
                association_id: 3
            }
        ];
        console.log('Generating test data...');
        // const response = await fetch( "../../test-data/clubs.json");
        // const clubRecords = await response.json();
        await Promise.all( clubRecords.map( d => FootballClub.add( d)));

        console.log(`${clubRecords.length} football clubs saved.`);
    } catch (e) {
        console.error(`${e.constructor.name}: ${e.message}`);
    }
};
// Clear test data
FootballClub.clearData = async function () {
    if (confirm("Do you really want to delete all football club records?")) {
        console.log('Clearing test data...');

        let clubsCollRef = db.collection("clubs");

        try {
            const clubDocSns = (await clubsCollRef.withConverter( FootballClub.converter)
                .get()).docs;

            await Promise.all( clubDocSns.map(
                clubDocSn => FootballClub.destroy( clubDocSn.id)
            ));
            console.log(`${clubDocSns.length} football club records deleted.`);
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
FootballClub.syncDBwithUI = async function (clubId) {
    try {
        let clubDocRef = db.collection("clubs").doc( clubId);
        let originalClubDocSn = await clubDocRef.get();
        // listen document changes returning a snapshot on every change
        return clubDocRef.onSnapshot( clubDocSn => {
            // identify if changes are local or remote
            if (!clubDocSn.metadata.hasPendingWrites) {
                if (!clubDocSn.data()) {
                    handleUserMessage("removed", originalClubDocSn.data());
                } else if (!clubDocSn.isEqual( originalClubDocSn)) {
                    handleUserMessage("modified", clubDocSn.data());
                }
            }
        });
    } catch (e) {
        console.error(`${e.constructor.name} : ${e.message}`);
    }
}

export default FootballClub;

