/**
 * @fileOverview  View methods for the user authentication
 * @authors Gerd Wagner & Juan-Francisco Reyes (modified by Mina Lee)
 */
/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import { auth } from "../c/initialize.mjs";

/**
 * set user authentication status
 */

function setupUiByUserStatus() {
    // set initial values and login management elements
    const page = window.location.pathname,
        allowedPages = ["/","/index.html",
            "/authenticateUser.html"],
        loginMngEls = document.querySelectorAll("header > div#login-management > small");

    // reset (hide) all login management elements: [0]sign in/up , [1]sign out
    if (page !== "/authenticateUser.html") {
        loginMngEls[0].hidden = loginMngEls[1].hidden = true;
    }
    //evaluate user authentication status
    auth.onAuthStateChanged( async function (user) {
        // if status is 'anonymous' or 'registered'
        if (user) {
            if (user.isAnonymous) { // if user is 'anonymous'
                if (!allowedPages.includes( page)) {
                    // redirect to authentication page
                    window.location.pathname = "/authenticateUser.html";
                }
                loginMngEls[0].hidden = false; // show 'sign in/up'
                console.log("Authenticated as 'anonymous'");
            } else { // if status is 'registered'
                const spanEl = document.createElement("span");
                // enable UI elements on start page
                const linkEls = document.querySelectorAll("a.disabled");
                for (const el of linkEls) {
                    el.classList.remove("disabled");
                }
                if (!user.emailVerified) {
                    spanEl.textContent = `Check your email '${user.email}' for instructions to verify your account before using any operation `;
                    const clearDataButtons =
                        document.querySelectorAll("button.clearData");
                    for (const btn of clearDataButtons) {
                        btn.disabled = true;
                    }
                    const generateTestDataButtons =
                        document.querySelectorAll("button.generateTestData");
                    for (const btn of generateTestDataButtons) {
                        btn.disabled = true;
                    }

                    // document.getElementById("clearDataPerson").disabled = true;
                    // document.getElementById("generateTestDataPerson").disabled = true;
                } else {
                    spanEl.textContent = `${user.email} `;

                    const clearDataButtons =
                        document.querySelectorAll("button.clearData");
                    for (const btn of clearDataButtons) {
                        btn.disabled = false;
                    }
                    const generateTestDataButtons =
                        document.querySelectorAll("button.generateTestData");
                    for (const btn of generateTestDataButtons) {
                        btn.disabled = false;
                    }

                    // document.getElementById("clearDataPerson").disabled = false;
                    // document.getElementById("generateTestDataPerson").disabled = false;
                }

                loginMngEls[1].prepend( spanEl);
                loginMngEls[1].hidden = false; // show 'sign out'

                // if current page is not allowed & email is verified
                if (!allowedPages.includes( page) && !user.emailVerified) {
                    alert (`Check your email ${user.email} for instructions to verify your account before using this operation`);
                    window.location.pathname = "/index.html";
                } else if (page === "/" || page === "/index.html") {
                    // enable UI elements on start page
                    const linkEls = document.querySelectorAll("a.disabled");
                    for (const el of linkEls) {
                        el.classList.remove("disabled");
                    }
                }
                // set and event handler for 'sign out' button
                const signOutButton = loginMngEls[1].querySelector("button");
                signOutButton.addEventListener("click", handleSignOut);
                console.log(`Authenticated as 'registered with ${user.emailVerified ? '' : 'NO '}verified account' (${user.email})`);
            }
        } else { // if user is not 'registered' nor 'anonymous' (null)
            // sign in user as 'anonymous'
            auth.signInAnonymously();
        }
    });
}

/**
 * initialize sign in/sign up form
 */
function setupSignInAndSignUp() {
    const formEl = document.forms["User"],
        btnSignIn = formEl.signin,
        btnSignUp = formEl.signup;
    // manage sign up event
    btnSignUp.addEventListener("click", handleSignUpButton);
    // manage sign in event
    btnSignIn.addEventListener("click", handleSignInButton);
    // neutralize the submit event
    formEl.addEventListener( "submit", function (e) {
        e.preventDefault();
    });
}

/**
 * sign up
 */
async function handleSignUpButton() {
    const formEl = document.forms["User"],
        email = formEl.email.value,
        password = formEl.password.value;
    if (email && password) {
        try {
            // get 'anonymous' user data from IndexedDB
            const userRef = await auth.currentUser;
            // create credential providing email and password
            const credential = firebase.auth.EmailAuthProvider.credential( email, password);
            // create a 'registered' user merging credential with 'anonymous' user data
            await userRef.linkWithCredential( credential);
            // send verification email
            await userRef.sendEmailVerification();
            console.log (`User ${email} became 'Registered'`);
            alert (`Account created ${email}.\n\nCheck your email for instructions to verify this account.`);
            window.location.pathname = "/index.html";
        } catch (e) {
            const divEl = document.getElementById("error"),
                smallEl = divEl.querySelector("small");
            smallEl.textContent = e.message;
            divEl.hidden = false;
        }
    }
}

/**
 * sign in
 */
async function handleSignInButton() {
    const formEl = document.forms["User"],
        email = formEl.email.value,
        password = formEl.password.value;
    if (email && password) {
        try {
            const signIn = await auth.signInWithEmailAndPassword( email, password);
            if (signIn.user.emailVerified) {
                console.log(`Granted access to user ${email}`);
            }
            window.location.pathname = "/index.html";
        } catch (e) {
            const divEl = document.getElementById("error"),
                smallEl = divEl.querySelector("small");
            smallEl.textContent = e.message;
            divEl.hidden = false;
        }
    }
}

/**
 * verify email
 */
async function handleVerifyEmail() {
    const urlParams = new URLSearchParams( location.search),
        verificationCode = urlParams.get( "oobCode"), // get verification code from URL
        h1El = document.querySelector("main > h1"),
        pEl = document.querySelector("main > p"),
        linkEl = document.querySelector("footer > a");
    try { // if email can be verified
        // apply the email verification code
        await auth.applyActionCode( verificationCode);
        // if success, manipulate HTML elements: message, instructions and link
        h1El.textContent = "Your email has been verified.";
        pEl.textContent = "You can use now any operation on the DFB App.";
        let textNodeEl = document.createTextNode("« Go to DFB App");
        linkEl.appendChild( textNodeEl);
        linkEl.href = "index.html";
    } catch (e) { // if email has been already verified
        // if error, manipulate HTML elements: message, instructions and link
        h1El.textContent = "Your validation link has been already used.";
        pEl.textContent = "You can Sign In now the DFB App with Auth.";
        let textNodeEl = document.createTextNode("« Go to the Sign in page");
        linkEl.appendChild( textNodeEl);
        linkEl.href = "authenticateUser.html";
        console.error( e.message);
    }
}

/**
 * sign out
 */
function handleSignOut() {
    try {
        auth.signOut();
        window.location.pathname = "/index.html";
    } catch (e) {
        console.error( e.message);
    }
}

export { setupUiByUserStatus, setupSignInAndSignUp, handleVerifyEmail };

