/**
 * @fileOverview  The model class NationalTeam with attribute definitions and storage management methods
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 * @copyright Copyright 2013-2021 Gerd Wagner (Chair of Internet Technology) and Juan-Francisco Reyes, Brandenburg University of Technology, Germany.
 * @license This code is licensed under The Code Project Open License (CPOL), implying that the code is provided "as-is",
 * can be modified to create derivative works, can be redistributed, and can be used in commercial applications.
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import { db } from "../c/initialize.mjs";
import { isIntegerOrIntegerString, handleUserMessage} from "../../lib/util.mjs";
import { NoConstraintViolation, MandatoryValueConstraintViolation,
    RangeConstraintViolation, UniquenessConstraintViolation } from "../../lib/errorTypes.mjs";
import { GenderEL } from "./Person.mjs";
import Player from "./Player.mjs";
import Coach from "./Coach.mjs";

/**
 * Constructor function for the class NationalTeam
 */
class NationalTeam {
    // using a single record parameter with ES6 function parameter destructuring
    constructor({gender, coach, coach_id, players, playerIdRefs}) {
        // assign properties by invoking implicit setters
        this.gender = gender; // GenderEL
        this.coach = coach || coach_id; // Coach
        this.players = players || playerIdRefs; // Player
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
    static async checkGenderAsId( gender) {
        let validationResult = NationalTeam.checkGender( parseInt(gender));
        if ((validationResult instanceof NoConstraintViolation)) {
            if (!gender) {
                validationResult = new MandatoryValueConstraintViolation(
                    "A value for the gender must be provided!");
            } else {
                let teamDocSn = await db.collection("nationalTeams").doc( String(gender)).get();
                if (teamDocSn.exists) {
                    validationResult = new UniquenessConstraintViolation(
                        "There is already a national team record with this gender!");
                } else {
                    validationResult = new NoConstraintViolation();
                }
            }
        }
        return validationResult;
    };
    set gender(g) {
        const validationResult = NationalTeam.checkGender( g);
        if (validationResult instanceof NoConstraintViolation) {
            this._gender = parseInt( g);
        } else {
            throw validationResult;
        }
    };

    get coach() {
        return this._coach;
    };
    static async checkCoach( coach_id) {
        var validationResult = null;
        if (!coach_id) {
            validationResult = new MandatoryValueConstraintViolation
            ("Coach must be selected!");
        } else {
            // invoke foreign key constraint check
            validationResult = await Coach.checkPersonIdAsIdRef( String(coach_id));
        }
        return validationResult;
    };
    set coach( c) {
        this._coach = c;
    };

    get players() {
        return this._players;
    };
    static async checkPlayer (player_id) {
        var validationResult = null;
        if (!player_id) {
            validationResult = new MandatoryValueConstraintViolation
            ("Players must be selected (at least 11 players)!");
        } else {
            // invoke foreign key constraint check
            validationResult = await Player.checkPersonIdAsIdRef( String(player_id));
        }
        return validationResult;
    };
    set players( p) {
        this._players = p;
    }
}
/*********************************************************
 ***  Class-level ("static") storage management methods **
 *********************************************************/
/**
 *  Conversion between a NationalTeam object and a corresponding Firestore document
 */
NationalTeam.converter = {
    toFirestore: function (team) {
        const data = {
            gender: team.gender,
            coach_id : team.coach,
            playerIdRefs: team.players
        };
        return data;
    },
    fromFirestore: function (snapshot, options) {
        const team = snapshot.data( options);
        const data = {
            gender: parseInt(team.gender),
            coach: team.coach_id,
            players: team.playerIdRefs
        }
        return new NationalTeam( data);
    }
};

/**
 *  Load a national team record
 */
NationalTeam.retrieve = async function (gender) {
    try {
        const teamRec = (await db.collection("nationalTeams").doc( gender)
            .withConverter( NationalTeam.converter).get()).data();

        if (gender === GenderEL.M) {
            console.log(`National team record (Men) retrieved.`);
        } else if (gender === GenderEL.F) {
            console.log(`National team record (Female) retrieved.`);
        }
        return teamRec;
    } catch (e) {
        console.error(`Error retrieving national team record: ${e}`);
    }
};

/**
 *  Load all national team records
 */
NationalTeam.retrieveAll = async function () {
    let teamsCollRef = db.collection("nationalTeams");
    try {
        const teamRecords = (await teamsCollRef.withConverter( NationalTeam.converter)
            .get()).docs.map( d => d.data());
        return teamRecords;
    } catch (e) {
        console.error(`Error retrieving national team records: ${e}`);
    }
};

/**
 *  Create a new national team record
 */
NationalTeam.add = async function (slots) {
    var validationResult = null,
        team = null;
    try {
        team = new NationalTeam(slots);
        validationResult = await NationalTeam.checkGenderAsId( String(team.gender));

        if (!validationResult instanceof NoConstraintViolation) {
            throw validationResult;
        }
        const teamDocRef = db.collection("nationalTeams").doc( String(team.gender));
        await teamDocRef.withConverter( NationalTeam.converter).set( team);

        if (team.gender === GenderEL.M) {
            console.log(`National team (Men) record created.`);
        } else if (team.gender === GenderEL.F) {
            console.log(`National team (Women) record created.`);
        }

    } catch( e) {
        console.error(`Error creating national team record: ${e}`);
    }
};

/**
 *  Update an existing national team record
 */
NationalTeam.update = async function (slots) {
    const updatedSlots = {};
    let validationResult = null,
        teamRec = null,
        teamDocRef = null;
    try {
        teamDocRef = db.collection("nationalTeams").doc( String(slots.gender));
        const teamDocSns = await teamDocRef.withConverter( NationalTeam.converter).get();
        teamRec = teamDocSns.data();
    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
    }

    try {
        if (slots.coach_id && teamRec.coach !== slots.coach_id) {
            validationResult = await NationalTeam.checkCoach( slots.coach_id);
            if (validationResult instanceof NoConstraintViolation) {
                updatedSlots.coach_id = slots.coach_id;
            } else {
                throw validationResult;
            }
        } else if (!slots.coach_id && teamRec.coach !== undefined) {
            updatedSlots.coach_id = firebase.firestore.FieldValue.delete();
        }

        let playerIdRefs = teamRec.players;

        if (slots.playerIdRefsToAdd) {
            playerIdRefs = playerIdRefs.concat( slots.playerIdRefsToAdd.map( d => +d));
        }
        if (slots.playerIdRefsToRemove) {
            slots.playerIdRefsToRemove = slots.playerIdRefsToRemove.map( d => +d);
            playerIdRefs = playerIdRefs.filter( d => !slots.playerIdRefsToRemove.includes( d));
        }
        updatedSlots.playerIdRefs = playerIdRefs;
    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
    }

    let updatedProperties = Object.keys( updatedSlots);
    if (updatedProperties.length > 0) {
        await teamDocRef.withConverter( NationalTeam.converter).update( updatedSlots);

        if (parseInt(slots.gender) === GenderEL.M) {
            console.log(`Property(ies) "${updatedProperties.toString()}" modified for national team (Men) record"`);
        } else if (parseInt(slots.gender) === GenderEL.F) {
            console.log(`Property(ies) "${updatedProperties.toString()}" modified for national team (Women) record"`);
        }
    } else {
        console.log(`No property value changed for national team record!`);
    }
};

/**
 *  Delete a national team record
 */
NationalTeam.destroy = async function (gender) {
    try {
        await db.collection("nationalTeams").doc( gender).delete();
        if (gender === GenderEL.M) {
            console.log(`National team record (Men) deleted.`);
        } else if (gender === GenderEL.F) {
            console.log(`National team record (Women) deleted.`); }
    } catch( e) {
        console.error(`Error when deleting national team record: ${e}`);
    }
};

/*******************************************
 *** Auxiliary methods for testing **********
 ********************************************/
// Create test data
NationalTeam.generateTestData = async function () {
    try {
        // let teamRecords = [
        //     {
        //         gender: GenderEL.M,
        //         coach_id: 12,
        //         playerIdRefs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        //
        //     },
        //     {
        //         gender: GenderEL.F,
        //         coach_id: 24,
        //         playerIdRefs: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 28]
        //     }
        // ];
        console.log('Generating test data...');
        const response = await fetch( "../../test-data/teams.json");
        const teamRecords = await response.json();
        await Promise.all( teamRecords.map( d => NationalTeam.add( d)));

        console.log(`${teamRecords.length} national teams saved.`);
    } catch (e) {
        console.error(`${e.constructor.name}: ${e.message}`);
    }
};

// Clear test data
NationalTeam.clearData = async function () {
    if (confirm("Do you really want to delete all national team records?")) {
        console.log('Clearing test data...');

        let teamsCollRef = db.collection("nationalTeams");

        try {
            const teamDocSns = (await teamsCollRef.withConverter( NationalTeam.converter)
                .get()).docs;

            await Promise.all( teamDocSns.map(
                teamDocSn => NationalTeam.destroy( teamDocSn.id)
            ));
            console.log(`${teamDocSns.length} national team records deleted.`);
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
NationalTeam.syncDBwithUI = async function (gender) {
    try {
        let teamDocRef = db.collection("nationalTeams").doc( gender);
        let originalTeamDocSn = await teamDocRef.get();
        // listen document changes returning a snapshot on every change
        return teamDocRef.onSnapshot( teamDocSn => {
            // identify if changes are local or remote
            if (!teamDocSn.metadata.hasPendingWrites) {
                if (!teamDocSn.data()) {
                    handleUserMessage("removed", originalTeamDocSn.data());
                } else if (!teamDocSn.isEqual( originalTeamDocSn)) {
                    handleUserMessage("modified", teamDocSn.data());
                }
            }
        });
    } catch (e) {
        console.error(`${e.constructor.name} : ${e.message}`);
    }
}

export default NationalTeam;

