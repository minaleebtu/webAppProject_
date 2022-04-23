/**
 * @fileOverview  The model class FootballAssociation with attribute definitions and storage management methods
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 * @copyright Copyright 2013-2021 Gerd Wagner (Chair of Internet Technology) and Juan-Francisco Reyes, Brandenburg University of Technology, Germany.
 * @license This code is licensed under The Code Project Open License (CPOL), implying that the code is provided "as-is",
 * can be modified to create derivative works, can be redistributed, and can be used in commercial applications.
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import { db } from "../c/initialize.mjs";
import { isNonEmptyString, handleUserMessage } from "../../lib/util.mjs";
import { NoConstraintViolation, MandatoryValueConstraintViolation, RangeConstraintViolation,
    UniquenessConstraintViolation, ReferentialIntegrityConstraintViolation } from "../../lib/errorTypes.mjs";

/**
 * Constructor function for the class FootballAssociation
 */
class FootballAssociation {
    // using a single record parameter with ES6 function parameter destructuring
    constructor({assoId, name, supAssociations, supAssociationIdRefs}) {
        // assign properties by invoking implicit setters
        this.assoId = assoId; // number (integer)
        this.name = name; // string

        if (supAssociations || supAssociationIdRefs) {
            this.supAssociations = supAssociations || supAssociationIdRefs;
        }
    };

    get assoId() {
        return this._assoId;
    };
    static checkAssoId(assoId) {
        assoId = parseInt(assoId);
        if (!assoId) {
            return new NoConstraintViolation();  // may be optional as an IdRef
        } else {
            // convert to integer
            assoId = parseInt( assoId);
            if (isNaN( assoId) || !Number.isInteger( assoId) || assoId < 1) {
                return new RangeConstraintViolation("The association ID must be a positive integer!");
            } else {
                return new NoConstraintViolation();
            }
        }
    };
    /*
       Checks ID uniqueness constraint against the direct type of a FootballAssociation object
       */
    static async checkAssoIdAsId( assoId) {
        let validationResult = FootballAssociation.checkAssoId( parseInt(assoId));
        if ((validationResult instanceof NoConstraintViolation)) {
            if (!assoId) {
                validationResult = new MandatoryValueConstraintViolation(
                    "A value for the Association ID must be provided!");
            } else {
                let assoDocSn = await db.collection("associations").doc( assoId).get();
                if (assoDocSn.exists) {
                    validationResult = new UniquenessConstraintViolation(
                        "There is already a football association record with this Association ID!");
                } else {
                    validationResult = new NoConstraintViolation();
                }
            }
        }
        return validationResult;
    };
    static async checkAssoIdAsIdRef( id) {
        var constraintViolation = FootballAssociation.checkAssoId( id);
        if ((constraintViolation instanceof NoConstraintViolation) &&
            id !== undefined) {
            let assoDocSn = await db.collection("associations").doc( String(id)).get();
            if (!assoDocSn.exists) {
                constraintViolation = new ReferentialIntegrityConstraintViolation(
                    `There is no football association record with this association ID (${id})!`);
            }
        }
        return constraintViolation;
    };
    set assoId( assoId) {
        const validationResult = FootballAssociation.checkAssoId ( assoId);
        if (validationResult instanceof NoConstraintViolation) {
            this._assoId = assoId;
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
            ("A name must be provided!");
        } else if (!isNonEmptyString(n)) {
            return new RangeConstraintViolation
            ("The name must be a non-empty string!");
        } else {
            return new NoConstraintViolation();
        }
    };
    set name( n) {
        const validationResult = FootballAssociation.checkName( n);
        if (validationResult instanceof NoConstraintViolation) {
            this._name = n;
        } else {
            throw validationResult;
        }
    };

    get supAssociations() {
        return this._supAssociations;
    };

    static async checkSupAssoIdAsIdRef( supAssociation_id) {
        var constraintViolation = FootballAssociation.checkAssoId( supAssociation_id);
        if ((constraintViolation instanceof NoConstraintViolation) && supAssociation_id) {
            let assoDocSn = await db.collection("associations").doc( supAssociation_id).get();
            if (!assoDocSn.exists) {
                constraintViolation = new ReferentialIntegrityConstraintViolation(
                    `There is no football association record with Association ID ${supAssociation_id}!`);
            }
        }
        return constraintViolation;
    };
    static checkSupAssociation( supAssociation_id) {
        var validationResult = null;
        if (!supAssociation_id) {
            // supAssociation(s) are optional
            validationResult = new NoConstraintViolation();
        } else {
            // invoke foreign key constraint check
            validationResult = FootballAssociation.checkSupAssoIdAsIdRef( supAssociation_id);
        }
        return validationResult;
    };
    set supAssociations( sa) {
        this._supAssociations = sa;
    };

}
/*********************************************************
 ***  Class-level ("static") storage management methods **
 *********************************************************/
/**
 *  Conversion between a FootballAssociation object and a corresponding Firestore document
 */
FootballAssociation.converter = {
    toFirestore: function (asso) {
        const data = {
            assoId: asso.assoId,
            name: asso.name
        };
        if (asso.supAssociations) data.supAssociationIdRefs = asso.supAssociations;
        return data;
    },
    fromFirestore: function (snapshot, options) {
        const asso = snapshot.data( options);
        const data = {
            assoId: asso.assoId,
            name: asso.name
        };
        if (asso.supAssociationIdRefs) data.supAssociations = asso.supAssociationIdRefs;

        return new FootballAssociation( data);
    }
};

/**
 *  Load a football association record
 */

FootballAssociation.retrieve = async function (assoId) {
    try {
        const assoRec = (await db.collection("associations").doc( assoId)
            .withConverter( FootballAssociation.converter).get()).data();
        if (assoRec) console.log(`Football Association record (Association ID: "${assoRec.assoId}") retrieved.`);
        return assoRec;
    } catch (e) {
        console.error(`Error retrieving football association record: ${e}`);
    }
};

/**
 *  Load all football association records
 */
FootballAssociation.retrieveAll = async function (order) {
    let assosCollRef = db.collection("associations");
    try {
        if (order) assosCollRef = assosCollRef.orderBy( order);
        const assoRecords = (await assosCollRef.withConverter( FootballAssociation.converter)
            .get()).docs.map( d => d.data());
        console.log(`${assoRecords.length} football association records retrieved ${order ? "ordered by " + order : ""}`);
        return assoRecords;
    } catch (e) {
        console.error(`Error retrieving football association records: ${e}`);
    }
};

/**
 * Retrieve block of football association records
 */
FootballAssociation.retrieveBlock = async function (params) {
    try {
        let assosCollRef = db.collection("associations");
        // set limit and order in query
        assosCollRef = assosCollRef.limit( 11);
        if (params.order) assosCollRef = assosCollRef.orderBy( params.order);
        // set pagination 'startAt' cursor
        if (params.cursor) {
            assosCollRef = assosCollRef.startAt( params.cursor);
        }
        const assoRecords = (await assosCollRef.withConverter( FootballAssociation.converter)
            .get()).docs.map( d => d.data());
        console.log(`Block of football association records retrieved! (cursor: ${assoRecords[0][params.order]})`);
        return assoRecords;
    } catch (e) {
        console.error(`Error retrieving all football association records: ${e}`);
    }
};

/**
 *  Create a new football association record
 */
FootballAssociation.add = async function (slots) {
    var validationResult = null,
        asso = null;

    try {
        asso = new FootballAssociation(slots);
        // invoke asynchronous ID/uniqueness check
        validationResult = await FootballAssociation.checkAssoIdAsId( asso.assoId);

        if (!validationResult instanceof NoConstraintViolation) {
            throw validationResult;
        }
        const assoDocRef = db.collection("associations").doc( asso.assoId);
        await assoDocRef.withConverter( FootballAssociation.converter).set( asso);
        console.log(`Football Association record (Association ID: "${asso.assoId}") created!`);
    } catch( e) {
        console.error(`Error creating football association record: ${e}`);
    }
};

/**
 *  Update an existing football association record
 */
FootballAssociation.update = async function (slots) {
    const updatedSlots = {};
    let validationResult = null,
        assoRec = null,
        assoDocRef = null;
    try {
        // retrieve up-to-date association record
        assoDocRef = db.collection("associations").doc( slots.assoId);
        const assoDocSn = await assoDocRef.withConverter(FootballAssociation.converter).get();
        assoRec = assoDocSn.data();
    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
        // noConstraintViolated = false;
    }
    try {
        if (assoRec.name !== slots.name) {
            validationResult = FootballAssociation.checkName( slots.name);
            if (validationResult instanceof NoConstraintViolation) {
                updatedSlots.name = slots.name;
            } else {
                throw validationResult;
            }
        }
        let supAssociationIdRefs = assoRec.supAssociations;
        if (slots.supAssociationIdRefsToAdd) {
            supAssociationIdRefs = supAssociationIdRefs.concat( slots.supAssociationIdRefsToAdd.map( d => +d));
        }
        if (slots.supAssociationIdRefsToRemove) {
            slots.supAssociationIdRefsToRemove = slots.supAssociationIdRefsToRemove.map( d => +d);
            supAssociationIdRefs = supAssociationIdRefs.filter( d => !slots.supAssociationIdRefsToRemove.includes( d));
        }
        updatedSlots.supAssociationIdRefs = supAssociationIdRefs;

    } catch (e) {
        console.error(`${e.constructor.name}: ${e.message}`);
    }
    let updatedProperties = Object.keys( updatedSlots);
    if (updatedProperties.length > 0) {
        await assoDocRef.withConverter( FootballAssociation.converter).update( updatedSlots);
        console.log(`Property(ies) "${updatedProperties.toString()}" modified for football association record (Association ID: "${slots.assoId}")`);
    } else {
        console.log(`No property value changed for football association record (Association ID: "${slots.assoId}")!`);
    }
};

/**
 *  Delete a football association record
 */
FootballAssociation.destroy = async function (assoId) {
    try {
        const membersCollRef = db.collection("members"),
            presidentsCollRef = db.collection("presidents"),
            assosCollRef = db.collection("associations"),
            presidentQrySn = presidentsCollRef.where("assoAssociation_id", "==", parseInt(assoId)),
            memberQrySn = membersCollRef.where("assoAssociationIdRefs", "array-contains", parseInt(assoId)),
            associatedPresidentDocSns = (await presidentQrySn.get()).docs,
            associatedMemberDocSns = (await memberQrySn.get()).docs,
            assoDocRef = assosCollRef.doc( assoId);

        // initiate batch write
        const batch = db.batch();
        for (const am of associatedMemberDocSns) {
            const memberDocRef = membersCollRef.doc( am.id);
            // remove associated assoId from each Member record
            batch.update( memberDocRef, {
                assoAssociationIdRefs: firebase.firestore.FieldValue.arrayRemove( parseInt(assoId))
            });
        }
        for (const ap of associatedPresidentDocSns) {
            const presidentDocRef = presidentsCollRef.doc( ap.id);
            // remove associated football association from each president record
            batch.update( presidentDocRef, {
                assoAssociation: firebase.firestore.FieldValue.delete()
            });
        }

        // delete football association record
        batch.delete( assoDocRef);
        batch.commit(); // finish batch write
        console.log(`Football association record (Association ID: "${assoId}") deleted!`);
    } catch (e) {
        console.error(`Error deleting football association record: ${e}`);
    }
};

/*******************************************
 *** Auxiliary methods for testing **********
 ********************************************/
// Create test data
FootballAssociation.generateTestData = async function () {
    try {
        // let assoRecords = [
        //     {
        //         assoId: "1",
        //         name: "NORDDEUTSCHER FUSSBALL-VERBAND",
        //         supAssociationIdRefs: []
        //     },
        //     {
        //         assoId: "2",
        //         name: "Schleswig-Holsteinischer Fußballverband",
        //         supAssociationIdRefs: [1]
        //     },
        //     {
        //         assoId: "3",
        //         name: "Hamburger Fußball-Verband",
        //         supAssociationIdRefs: [2]
        //     },
        // ];
        console.log('Generating test data...');
        const response = await fetch( "../../test-data/associations.json");
        const assoRecords = await response.json();
        await Promise.all( assoRecords.map( d => FootballAssociation.add( d)));

        console.log(`${assoRecords.length} football associations saved.`);
    } catch (e) {
        console.error(`${e.constructor.name}: ${e.message}`);
    }

};
// Clear test data
FootballAssociation.clearData = async function () {
    if (confirm("Do you really want to delete all football association records?")) {
        console.log('Clearing test data...');

        let assosCollRef = db.collection("associations");

        try {
            const assoDocSns = (await assosCollRef.withConverter( FootballAssociation.converter)
                .get()).docs;

            await Promise.all( assoDocSns.map(
                assoDocSn => FootballAssociation.destroy( assoDocSn.id)
            ));
            console.log(`${assoDocSns.length} football association records deleted.`);
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
FootballAssociation.syncDBwithUI = async function (assoId) {
    try {
        let assoDocRef = db.collection("associations").doc( assoId);
        let originalAssoDocSn = await assoDocRef.get();
        // listen document changes returning a snapshot on every change
        return assoDocRef.onSnapshot( assoDocSn => {
            // identify if changes are local or remote
            if (!assoDocSn.metadata.hasPendingWrites) {
                if (!assoDocSn.data()) {
                    handleUserMessage("removed", originalAssoDocSn.data());
                } else if (!assoDocSn.isEqual( originalAssoDocSn)) {
                    handleUserMessage("modified", assoDocSn.data());
                }
            }
        });
    } catch (e) {
        console.error(`${e.constructor.name} : ${e.message}`);
    }
}

export default FootballAssociation;

