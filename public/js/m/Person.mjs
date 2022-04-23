/**
 * @fileOverview  The model class Person with attribute definitions and storage management methods
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 * @copyright Copyright 2013-2021 Gerd Wagner (Chair of Internet Technology) and Juan-Francisco Reyes, Brandenburg University of Technology, Germany.
 * @license This code is licensed under The Code Project Open License (CPOL), implying that the code is provided "as-is",
 * can be modified to create derivative works, can be redistributed, and can be used in commercial applications.
 */

/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import { db } from "../c/initialize.mjs";
import { createIsoDateString, isIntegerOrIntegerString, isNonEmptyString,
    handleUserMessage, dateToTimestamp, timestampToDate } from "../../lib/util.mjs";
import { NoConstraintViolation, MandatoryValueConstraintViolation, RangeConstraintViolation,
    UniquenessConstraintViolation, IntervalConstraintViolation } from "../../lib/errorTypes.mjs";
import Enumeration from "../../lib/Enumeration.mjs";

/**
 * Define two Enumerations
 */
const PersonTypeEL = new Enumeration(["Member", "Player", "Coach", "President"]);
const GenderEL = new Enumeration({"M":"Male", "F":"Female"});

/**
 * Constructor function for the class Person
 */
class Person {
  // using a single record parameter with ES6 function parameter destructuring
  constructor({personId, name, dateOfBirth, gender, type}) {
    // assign properties by invoking implicit setters
    this.personId = personId; // number (integer)
    this.name = name; // string
    this.dateOfBirth = dateOfBirth; // date
    this.gender = gender; // GenderEL
    this.type = type; // PersonTypeEL
  };

  get personId() {
    return this._personId;
  };
  static checkPersonId(personId) {
    personId = parseInt(personId);
    if (!personId) {
      return new NoConstraintViolation();  // may be optional as an IdRef
    } else {
      // convert to integer
      personId = parseInt( personId);
      if (isNaN( personId) || !Number.isInteger( personId) || personId < 1) {
        return new RangeConstraintViolation("The Person ID must be a positive integer!");
      } else {
        return new NoConstraintViolation();
      }
    }
  };
  /*
     Checks ID uniqueness constraint against the direct type of a Person object
     */
  static async checkPersonIdAsId( personId) {
    let validationResult = Person.checkPersonId( personId);
    if ((validationResult instanceof NoConstraintViolation)) {
      if (!personId) {
        validationResult = new MandatoryValueConstraintViolation(
            "A value for the Person ID must be provided!");
      } else {
        let personDocSn = await db.collection("persons").doc( personId).get();
        if (personDocSn.exists) {
          validationResult = new UniquenessConstraintViolation(
              "There is already a person record with this Person ID!");
        } else {
          validationResult = new NoConstraintViolation();
        }
      }
    }
    return validationResult;
  };

  static async checkPersonIdAsIdRef ( personId) {
    var validationResult = Person.checkPersonId( personId);
    if ((validationResult instanceof NoConstraintViolation)) {
      if (!personId) {
        validationResult = new MandatoryValueConstraintViolation(
            "A value for the Person ID must be provided!");
      } else {
        let personDocSn = await db.collection("persons").doc( personId).get();
        if (!personDocSn.exists) {
          validationResult = new UniquenessConstraintViolation(
              `There is no person record with this Person ID "${personId}"!`);
        } else {
          validationResult = new NoConstraintViolation();
        }
      }
    }
    return validationResult;
  };
  set personId( personId) {
    const validationResult = Person.checkPersonId ( personId);
    if (validationResult instanceof NoConstraintViolation) {
      this._personId = personId;
    } else {
      throw validationResult;
    }
  };

  get name() {
    return this._name;
  };
  static checkName(n) {
    if (!n) {
      return new MandatoryValueConstraintViolation("A name must be provided!");
    } else if (!isNonEmptyString(n)) {
      return new RangeConstraintViolation("The name must be a non-empty string!");
    } else {
      return new NoConstraintViolation();
    }
  };
  set name( n) {
    const validationResult = Person.checkName( n);
    if (validationResult instanceof NoConstraintViolation) {
      this._name = n;
    } else {
      throw validationResult;
    }
  };

  get dateOfBirth() {
    return this._dateOfBirth;
  };
  static checkDateOfBirth(dob) {
    const BIRTH_DATE_MIN = new Date("1890-01-01");
    if (!dob || dob === "") {
      return new MandatoryValueConstraintViolation
      ("A value for the date of birth must be provided!");
    } else {
      if (new Date(dob) < BIRTH_DATE_MIN) {
        return new IntervalConstraintViolation
        (`The value of date of birth must be greater than or equal to 
              ${createIsoDateString(BIRTH_DATE_MIN)}!`);
      } else {
        return new NoConstraintViolation();
      }
    }
  };
  set dateOfBirth(dob) {
    const validationResult = Person.checkDateOfBirth( dob);
    if (validationResult instanceof NoConstraintViolation) {
      this._dateOfBirth = dob;
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
    const validationResult = Person.checkGender( g);
    if (validationResult instanceof NoConstraintViolation) {
      this._gender = parseInt( g);
    } else {
      throw validationResult;
    }
  };

  get type() {
    return this._type;
  };
  static checkType(t) {
    if (!t) {
      return new MandatoryValueConstraintViolation(
          "Type must be provided!");
    } else if (!Number.isInteger( t) || t < 1 ||
        t > PersonTypeEL.MAX) {
      return new RangeConstraintViolation
      (`Invalid value for type: ${t}`);
    } else {
      return new NoConstraintViolation();
    }
  };
  static checkTypes(ts) {
    if (!ts || (Array.isArray( ts) &&
        ts.length === 0)) {
      return new MandatoryValueConstraintViolation(
          "Type must be provided!");
    } else if (!Array.isArray( ts)) {
      return new RangeConstraintViolation(
          "The value of type must be an array!");
    } else {
      for (const i of ts.keys()) {
        const validationResult = Person.checkType( ts[i]);
        if (!(validationResult instanceof NoConstraintViolation)) {
          return validationResult;
        }
      }
      return new NoConstraintViolation();
    }
  };
  set type(ts) {
    const validationResult = Person.checkTypes( ts);
    if (validationResult instanceof NoConstraintViolation) {
      this._type = ts;
    } else {
      throw validationResult;
    }
  };
}

/*********************************************************
 ***  Class-level ("static") storage management methods **
 *********************************************************/
/**
 *  Conversion between a Person object and a corresponding Firestore document
 */
Person.converter = {
  toFirestore: function (person) {
    const data = {
      personId: person.personId,
      name: person.name,
      dateOfBirth: dateToTimestamp(person.dateOfBirth),
      gender: parseInt(person.gender),
      type: person.type
    };
    return data;
  },
  fromFirestore: function (snapshot, options) {
    const person = snapshot.data( options);
    const data = {
      personId: person.personId,
      name: person.name,
      dateOfBirth: timestampToDate( person.dateOfBirth),
      gender: parseInt(person.gender),
      type: person.type
    };
    return new Person( data);
  }
};

/**
 *  Load a person record
 */
Person.retrieve = async function (personId) {
  try {
    const personRec = (await db.collection("persons").doc( personId)
        .withConverter( Person.converter).get()).data();
    console.log(`Person record (Person ID: "${personRec.personId}") retrieved.`);
    return personRec;
  } catch (e) {
    console.error(`Error retrieving person record: ${e}`);
  }
};

/**
 * Retrieve block of person records
 */
Person.retrieveBlock = async function (params) {
  try {
    let personsCollRef = db.collection("persons");
    // set limit and order in query
    personsCollRef = personsCollRef.limit( 11);
    if (params.order) personsCollRef = personsCollRef.orderBy( params.order);
    // set pagination 'startAt' cursor
    if (params.cursor) {
      if (params.order === "dateOfBirth") {
        personsCollRef = personsCollRef.startAt( dateToTimestamp( params.cursor));
      }
      else personsCollRef = personsCollRef.startAt( params.cursor);
    }
    const personRecords = (await personsCollRef.withConverter( Person.converter)
        .get()).docs.map( d => d.data());
    console.log(`Block of person records retrieved! (cursor: ${personRecords[0][params.order]})`);
    return personRecords;
  } catch (e) {
    console.error(`Error retrieving all person records: ${e}`);
  }
};

/**
 *  Load all person records
 */
Person.retrieveAll = async function (order) {
  let personsCollRef = db.collection("persons");
  try {
    if (order) personsCollRef = personsCollRef.orderBy( order);
    const personRecords = (await personsCollRef.withConverter( Person.converter)
        .get()).docs.map( d => d.data());
    console.log(`${personRecords.length} person records retrieved ${order ? "ordered by " + order : ""}`);
    return personRecords;
  } catch (e) {
    console.error(`Error retrieving person records: ${e}`);
  }
};

/**
 *  Create a new person record
 */
Person.add = async function (personId, name, dateOfBirth, gender, type) {
  var validationResult = null,
      person = null;
  const slots = {
    personId: personId,
    name: name,
    dateOfBirth: dateOfBirth,
    gender: gender,
    type: type
  };
  try {
    person = new Person(slots);
    validationResult = await Person.checkPersonIdAsId( person.personId);
    if (!validationResult instanceof NoConstraintViolation) {
      throw validationResult;
    }
    const personDocRef = db.collection("persons").doc( person.personId);
    await personDocRef.withConverter( Person.converter).set( person);
    console.log(`Person record (Person ID: "${person.personId}") created!`);
  } catch( e) {
    console.error(`${e.constructor.name}: ${e.message}`);
  }
};

/**
 *  Update an existing person record
 */
Person.update = async function (slots) {
  const updatedSlots = {};
  let validationResult = null,
      personRec = null,
      personDocRef = null;
  try {
    personDocRef = db.collection("persons").doc(slots.personId);
    const personDocSn = await personDocRef.withConverter(Person.converter).get();
    personRec = personDocSn.data();
  } catch (e) {
    console.error(`${e.constructor.name}: ${e.message}`);
  }

  try {
    if (personRec.name !== slots.name) {
      validationResult = Person.checkName( slots.name);
      if (validationResult instanceof NoConstraintViolation) {
        updatedSlots.name = slots.name;
      } else {
        throw validationResult;
      }
    }
    if (personRec.dateOfBirth !== slots.dateOfBirth) {
      validationResult = Person.checkDateOfBirth( slots.dateOfBirth);
      if (validationResult instanceof NoConstraintViolation) {
        updatedSlots.dateOfBirth = dateToTimestamp( slots.dateOfBirth);
      } else {
        throw validationResult;
      }
    }
    if (personRec.gender !== parseInt(slots.gender)) {
      validationResult = Person.checkGender( slots.gender);
      if (validationResult instanceof NoConstraintViolation) {
        updatedSlots.gender = slots.gender;
      } else {
        throw validationResult;
      }
    }
    if (!personRec.type.isEqualTo(slots.type)) {
      validationResult = Person.checkTypes( slots.type);
      if (validationResult instanceof NoConstraintViolation) {
        updatedSlots.type = slots.type;
      } else {
        throw validationResult;
      }
    }
  } catch (e) {
    console.error(`${e.constructor.name}: ${e.message}`);
  }
  let updatedProperties = Object.keys( updatedSlots);
  if (updatedProperties.length > 0) {
    await personDocRef.withConverter( Person.converter).update( updatedSlots);
    console.log(`Property(ies) "${updatedProperties.toString()}" modified for person record (Person ID: "${slots.personId}")`);
  } else {
    console.log(`No property value changed for person record (Person ID: "${slots.personId}")!`);
  }
};

/**
 *  Delete a person record
 */
Person.destroy = async function (personId) {
  try {
    await db.collection("persons").doc( personId).delete();
    console.log(`Person record (Person ID: "${personId}") deleted.`);
  } catch( e) {
    console.error(`Error when deleting person record: ${e}`);
    return;
  }
};

/*******************************************
 *** Auxiliary methods for testing **********
 ********************************************/
// Create test data
Person.generateTestData = async function () {
  try {
    // let personRecords = [
    //   {
    //     personId: "1",
    //     name: "Manuel Neuer",
    //     dateOfBirth: "1986-03-27",
    //     gender: GenderEL.M,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "2",
    //     name: "Antonio Rudiger",
    //     dateOfBirth: "1993-03-03",
    //     gender: GenderEL.M,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "3",
    //     name: "Marcel Halstenberg",
    //     dateOfBirth: "1991-09-27",
    //     gender: GenderEL.M,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "4",
    //     name: "Matthias Ginter",
    //     dateOfBirth: "1994-01-19",
    //     gender: GenderEL.M,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "5",
    //     name: "Mats Hummels",
    //     dateOfBirth: "1988-12-16",
    //     gender: GenderEL.M,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "6",
    //     name: "Joshua Kimmich",
    //     dateOfBirth: "1995-02-08",
    //     gender: GenderEL.M,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "7",
    //     name: "Kai Havertz",
    //     dateOfBirth: "1999-06-11",
    //     gender: GenderEL.M,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "8",
    //     name: "Toni Kroos",
    //     dateOfBirth: "1990-01-04",
    //     gender: GenderEL.M,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "9",
    //     name: "Kevin Volland",
    //     dateOfBirth: "1992-07-30",
    //     gender: GenderEL.M,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "10",
    //     name: "Serge Gnabry",
    //     dateOfBirth: "1995-07-14",
    //     gender: GenderEL.M,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "11",
    //     name: "Timo Werner",
    //     dateOfBirth: "1996-03-06",
    //     gender: GenderEL.M,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "12",
    //     name: "Joachim Löw",
    //     dateOfBirth: "1960-02-03",
    //     gender: GenderEL.M,
    //     type: [PersonTypeEL.COACH]
    //   },
    //   {
    //     personId: "13",
    //     name: "Merle Frohms",
    //     dateOfBirth: "1995-01-28",
    //     gender: GenderEL.F,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "14",
    //     name: "Sophia Kleinherne",
    //     dateOfBirth: "2000-04-12",
    //     gender: GenderEL.F,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "15",
    //     name: "Jana Feldkamp",
    //     dateOfBirth: "1998-03-15",
    //     gender: GenderEL.F,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "16",
    //     name: "Leonie Maier",
    //     dateOfBirth: "1992-09-29",
    //     gender: GenderEL.F,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "17",
    //     name: "Lena Sophie Oberdorf",
    //     dateOfBirth: "2001-12-19",
    //     gender: GenderEL.F,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "18",
    //     name: "Lea Schuller",
    //     dateOfBirth: "1997-11-12",
    //     gender: GenderEL.F,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "19",
    //     name: "Sydney Lohmann",
    //     dateOfBirth: "2000-06-19",
    //     gender: GenderEL.F,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "20",
    //     name: "Svenja Huth",
    //     dateOfBirth: "1991-01-25",
    //     gender: GenderEL.F,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "21",
    //     name: "Laura Benkarth",
    //     dateOfBirth: "1992-10-14",
    //     gender: GenderEL.F,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "22",
    //     name: "Laura Freigang",
    //     dateOfBirth: "1998-02-01",
    //     gender: GenderEL.F,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "23",
    //     name: "Tabea Wassmuth",
    //     dateOfBirth: "1996-08-25",
    //     gender: GenderEL.F,
    //     type: [PersonTypeEL.PLAYER]
    //   },
    //   {
    //     personId: "24",
    //     name: "Martina Voss-Tecklenburg",
    //     dateOfBirth: "1967-12-22",
    //     gender: GenderEL.F,
    //     type: [PersonTypeEL.COACH]
    //   },
    //   {
    //     personId: "25",
    //     name: "Peter Peters",
    //     dateOfBirth: "1965-11-10",
    //     gender: GenderEL.M,
    //     type: [PersonTypeEL.PRESIDENT]
    //   },
    //   {
    //     personId: "26",
    //     name: "Britta Carlson",
    //     dateOfBirth: "1978-03-03",
    //     gender: GenderEL.F,
    //     type: [PersonTypeEL.PRESIDENT]
    //   },
    //   {
    //     personId: "27",
    //     name: "Patrik Grolimund",
    //     dateOfBirth: "1980-08-19",
    //     gender: GenderEL.M,
    //     type: [PersonTypeEL.MEMBER, PersonTypeEL.COACH]
    //   },
    //   {
    //     personId: "28",
    //     name: "Sandra Starke",
    //     dateOfBirth: "1993-07-31",
    //     gender: GenderEL.F,
    //     type: [PersonTypeEL.MEMBER, PersonTypeEL.PLAYER]
    //   }
    // ];
    console.log('Generating test data...');
    const response = await fetch( "../../test-data/persons.json");
    const personRecords = await response.json();
    await Promise.all( personRecords.map( d =>
        Person.add( d.personId, d.name, d.dateOfBirth, d.gender, d.type)));

    console.log(`${personRecords.length} people saved.`);
  } catch (e) {
    console.error(`${e.constructor.name}: ${e.message}`);
  }
};

// Clear test data
Person.clearData = async function () {
  if (confirm("Do you really want to delete all person records?")) {
    console.log('Clearing test data...');

    let personsCollRef = db.collection("persons");

    try {
      const personDocSns = (await personsCollRef.withConverter( Person.converter)
          .get()).docs;

      await Promise.all( personDocSns.map(
          personDocSn => Person.destroy( personDocSn.id)
      ));
      console.log(`${personDocSns.length} person records deleted.`);
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
Person.syncDBwithUI = async function (personId) {
  try {
    let personDocRef = db.collection("persons").doc( personId);
    let originalPersonDocSn = await personDocRef.get();
    // listen document changes returning a snapshot on every change
    return personDocRef.onSnapshot( personDocSn => {
      // identify if changes are local or remote
      if (!personDocSn.metadata.hasPendingWrites) {
        if (!personDocSn.data()) {
          handleUserMessage("removed", originalPersonDocSn.data());
        } else if (!personDocSn.isEqual( originalPersonDocSn)) {
          handleUserMessage("modified", personDocSn.data());
        }
      }
    });
  } catch (e) {
    console.error(`${e.constructor.name} : ${e.message}`);
  }
}

export default Person;
export { GenderEL, PersonTypeEL };

