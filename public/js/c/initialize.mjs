/**
 * @fileOverview  Defining the main namespace ("public library") and its MVC subnamespaces
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 */

// initialize Cloud Firestore through Firebase
if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyB_lo7E_7ySfyYyvnUEGJw7cwWtIovn2iE",
    authDomain: "dfbproject-7aeac.firebaseapp.com",
    projectId: "dfbproject-7aeac"
  });
} else { // if already initialized
  firebase.app();
}
// initialize Firestore database interface
const db = firebase.firestore();
// initialize Firebase user authentication interface
const auth = firebase.auth();

export { db, auth };