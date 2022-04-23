/**
 * @fileOverview  Auxiliary data management procedures
 * @author Gerd Wagner and Juan-Francisco Reyes (modified by Mina Lee)
 */
import Person from "../m/Person.mjs";
import FootballAssociation from "../m/FootballAssociation.mjs";
import FootballClub from "../m/FootballClub.mjs";
import Member from "../m/Member.mjs";
import Player from "../m/Player.mjs";
import Coach from "../m/Coach.mjs";
import President from "../m/President.mjs";
import NationalTeam from "../m/NationalTeam.mjs";
import { db } from "../c/initialize.mjs";

/*******************************************
 *** Auxiliary methods for testing **********
 ********************************************/
/**
 *  Load and save test data
 */
async function generateTestData () {
    try {
        let response = null;
        // generate person records
        console.log("Generating test data...");
        response = await fetch( "../../test-data/persons.json");
        const personRecords = await response.json();
        await Promise.all( personRecords.map(
            personRec => Person.add( personRec)
        ));
        console.log(`${personRecords.length} person records generated`);

        // generate football association records
        response = await fetch( "../../test-data/associations.json");
        const associationRecords = await response.json();
        await Promise.all( associationRecords.map(
            associationRec => FootballAssociation.add( associationRec)
        ));
        console.log(`${associationRecords.length} football association records generated`);

        // generate football club records
        response = await fetch( "../../test-data/clubs.json");
        const clubRecords = await response.json();
        await Promise.all( clubRecords.map(
            clubRec => FootballClub.add( clubRec)
        ));
        console.log( `${clubRecords.length} football club records generated`);

        // generate member records
        response = await fetch( "../../test-data/members.json");
        const memberRecords = await response.json();
        await Promise.all( memberRecords.map(
            memberRec => Member.add( memberRec)
        ));
        console.log( `${memberRecords.length} member records generated`);

        // generate player records
        response = await fetch( "../../test-data/players.json");
        const playerRecords = await response.json();
        await Promise.all( playerRecords.map(
            playerRec => Player.add( playerRec)
        ));
        console.log( `${playerRecords.length} player records generated`);

        // generate coach records
        response = await fetch( "../../test-data/coaches.json");
        const coachRecords = await response.json();
        await Promise.all( coachRecords.map(
            coachRec => Coach.add( coachRec)
        ));
        console.log( `${coachRecords.length} coach records generated`);

        // generate president records
        response = await fetch( "../../test-data/presidents.json");
        const presidentRecords = await response.json();
        await Promise.all( presidentRecords.map(
            presidentRec => President.add( presidentRec)
        ));
        console.log( `${presidentRecords.length} president records generated`);

        // generate national team records
        response = await fetch( "../../test-data/teams.json");
        const teamRecords = await response.json();
        await Promise.all( teamRecords.map(
            teamRec => NationalTeam.add( teamRec)
        ));
        console.log( `${teamRecords.length} national team records generated`);
    } catch (e) {
        console.error(`${e.constructor.name} : ${e.message}`);
    }
}
/**
 * Clear data
 */
async function clearData () {
    try {
        if (confirm("Do you really want to delete all test data?")) {
            // retrieve all records
            console.log("Cleaning test data...");
            // person
            const personDocSns = (await db.collection("persons").withConverter( Person.converter)
                .get()).docs;
            await Promise.all( personDocSns.map(
                personDocSn => Person.destroy( personDocSn.id)
            ));
            console.log(`${personDocSns.length} person records deleted`);

            // football association
            const assoDocSns = (await db.collection("associations").withConverter( FootballAssociation.converter)
                .get()).docs;
            await Promise.all( assoDocSns.map(
                assoDocSn => FootballAssociation.destroy( assoDocSn.id)
            ));
            console.log(`${assoDocSns.length} football association records deleted`);

            // football club
            const clubDocSns = (await db.collection("clubs").withConverter( FootballClub.converter)
                .get()).docs;
            await Promise.all( clubDocSns.map(
                clubDocSn => FootballClub.destroy( clubDocSn.id)
            ));
            console.log(`${clubDocSns.length} football club records deleted.`);

            // member
            const memberDocSns = (await db.collection("members").withConverter( Member.converter)
                .get()).docs;
            await Promise.all( memberDocSns.map(
                memberDocSn => Member.destroy( memberDocSn.id)
            ));
            console.log(`${memberDocSns.length} member records deleted.`);

            // player
            const playerDocSns = (await db.collection("players").withConverter( Player.converter)
                .get()).docs;
            await Promise.all( playerDocSns.map(
                playerDocSn => Player.destroy( playerDocSn.id)
            ));
            console.log(`${playerDocSns.length} player records deleted.`);

            // coach
            const coachDocSns = (await db.collection("coaches").withConverter( Coach.converter)
                .get()).docs;
            await Promise.all( coachDocSns.map(
                coachDocSn => Coach.destroy( coachDocSn.id)
            ));
            console.log(`${coachDocSns.length} coach records deleted.`);

            // president
            const presidentDocSns = (await db.collection("presidents").withConverter( President.converter)
                .get()).docs;
            await Promise.all( presidentDocSns.map(
                presidentDocSn => President.destroy( presidentDocSn.id)
            ));
            console.log(`${presidentDocSns.length} president records deleted.`);

            // national team
            const teamDocSns = (await db.collection("nationalTeams").withConverter( NationalTeam.converter)
                .get()).docs;
            await Promise.all( teamDocSns.map(
                teamDocSn => NationalTeam.destroy( teamDocSn.id)
            ));
            console.log(`${teamDocSns.length} national team records deleted.`);

        }
    } catch (e) {
        console.error(`${e.constructor.name} : ${e.message}`);
    }
}

export { generateTestData, clearData };
