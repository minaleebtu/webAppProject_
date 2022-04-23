/**
 * @fileOverview  Defines utility procedures/functions
 * @author Gerd Wagner (modified by Mina Lee)
 */

import { GenderEL } from "../js/m/Person.mjs";
/**
 * Verifies if a value represents an integer
 * @param {number} x
 * @return {boolean}
 */
function isNonEmptyString(x) {
  return typeof(x) === "string" && x.trim() !== "";
}
/**
 * Serialize a Date object as an ISO date string
 * @return  YYYY-MM-DD
 */
function createIsoDateString (d) {
  return d.toISOString().substring(0,10);
}
/**
 * Verifies if a value represents an integer or integer string
 * @param {string} x
 * @return {boolean}
 */
function isIntegerOrIntegerString(x) {
  return typeof(x) === "number" && Number.isInteger(x) ||
      typeof(x) === "string" && x.search(/^-?[0-9]+$/) == 0;
}
/**
 * Creates a "clone" of an object that is an instance of a model class
 *
 * @param {object} obj
 */
function cloneObject( obj) {
  var p="", val,
      clone = Object.create( Object.getPrototypeOf(obj));
  for (p in obj) {
    if (obj.hasOwnProperty(p)) {
      val = obj[p];
      if (typeof val === "number" ||
          typeof val === "string" ||
          typeof val === "boolean" ||
          val instanceof Date ||
          // typed object reference
          typeof val === "object" && !!val.constructor ||
          // list of data values
          Array.isArray( val) &&
          !val.some( function (el) {
            return typeof el === "object";
          }) ||
          // list of typed object references
          Array.isArray( val) &&
          val.every( function (el) {
            return (typeof el === "object" && !!el.constructor);
          })
      ) {
        if (Array.isArray( val)) clone[p] = val.slice(0);
        else clone[p] = val;
      }
      // else clone[p] = cloneObject(val);
    }
  }
  return clone;
}
/**
 * Create a DOM option element
 *
 * @param {string} val
 * @param {string} txt
 * @param {string} classValues [optional]
 *
 * @return {object}
 */
function createOption( val, txt, classValues) {
  var el = document.createElement("option");
  el.value = val;
  el.text = txt || val;
  if (classValues) el.className = classValues;
  return el;
}
/**
 * Fill a select element with option elements created from an
 * map of objects
 *
 * @param {object} selectEl  A select(ion list) element
 * @param {object|array} selectionRange  A map of objects or an array
 * @param {string} keyProp [optional]  The standard identifier property
 * @param {object} optPar [optional]  A record of optional parameter slots
 *                 including optPar.displayProp and optPar.selection
 */
// function fillSelectWithOptions( selectEl, selectionRange, keyProp, optPar) {
//   var optionEl=null, displayProp="";
//   // delete old contents
//   selectEl.innerHTML = "";
//   // create "no selection yet" entry
//   if (!selectEl.multiple) selectEl.add( createOption(""," --- "));
//   // create option elements from object property values
//   var options = Array.isArray( selectionRange) ? selectionRange : Object.keys( selectionRange);
//   for (let i=0; i < options.length; i++) {
//     if (Array.isArray( selectionRange)) {
//       optionEl = createOption( i, options[i]);
//     } else {
//       const key = options[i];
//       const obj = selectionRange[key];
//       if (!selectEl.multiple) obj.index = i+1;  // store selection list index
//       if (optPar && optPar.displayProp) displayProp = optPar.displayProp;
//       else displayProp = keyProp;
//       optionEl = createOption( key, obj[displayProp]);
//       // if invoked with a selection argument, flag the selected options
//       if (selectEl.multiple && optPar && optPar.selection &&
//           optPar.selection[keyProp]) {
//         // flag the option element with this value as selected
//         optionEl.selected = true;
//       }
//     }
//     selectEl.add( optionEl);
//   }
// }
function fillSelectWithOptions( selectEl, selectionRange, optPar) {
  // create option elements from array key and values
  const options = selectionRange.entries();
  // delete old contents
  selectEl.innerHTML = "";
  // create "no selection yet" entry
  if (!selectEl.multiple) {
    selectEl.add( createOption(""," --- "));
  }
  //
  for (const [index, o] of options) {
    const key = index + 1;
    const optionEl = createOption(
        optPar ? (o[optPar.valueProp] ? o[optPar.valueProp] : key) : key,
        optPar ? (o[optPar.displayProp] ? o[optPar.displayProp] : o) : o
    );
    if (selectEl.multiple && optPar && optPar.selection &&
        optPar.selection.includes(key)) {
      // flag the option element with this value as selected
      optionEl.selected = true;
    }
    selectEl.add( optionEl);
  }
}

function fillSelectWithOptionsClub( selectEl, selectionRange, keyProp, optPar) {
  var optionEl=null, displayProp="";
  // delete old contents
  selectEl.innerHTML = "";
  // create "no selection yet" entry
  if (!selectEl.multiple) selectEl.add( createOption(""," --- "));
  const options = [];
  selectionRange.forEach(function (item) {
    options.push(item);
  });
  for (let op of options) {
    optionEl = createOption( op[keyProp], op[optPar]+" ("+GenderEL.enumLitNames[op["gender"] - 1]+")");
    selectEl.add( optionEl);
  }

}

function fillSelectWithOptionsGender( selectEl, selectionRange, keyProp) {
  var optionEl=null, displayProp="";
  // delete old contents
  selectEl.innerHTML = "";
  // create "no selection yet" entry
  if (!selectEl.multiple) selectEl.add( createOption(""," --- "));
  const options = [];
  selectionRange.forEach(function (item) {
    options.push(item);
  });
  for (let op of options) {
    optionEl = createOption( op[keyProp], GenderEL.enumLitNames[op[keyProp] - 1]);
    selectEl.add( optionEl);
  }

}


/**
 * * Create a choice control (radio button or checkbox) element
 *
 * @param {string} t  The type of choice control ("radio" or "checkbox")
 * @param {string} n  The name of the choice control input element
 * @param {string} v  The value of the choice control input element
 * @param {string} lbl  The label text of the choice control
 * @return {object}
 */
function createLabeledChoiceControl( t,n,v,lbl) {
  var ccEl = document.createElement("input"),
      lblEl = document.createElement("label");
  ccEl.type = t;
  ccEl.name = n;
  ccEl.value = v;
  lblEl.appendChild( ccEl);
  lblEl.appendChild( document.createTextNode( lbl));
  return lblEl;
}
/**
 * Create a choice widget in a given fieldset element.
 * A choice element is either an HTML radio button or an HTML checkbox.
 * @method
 */
function createChoiceWidget( containerEl, fld, values,
                             choiceWidgetType, choiceItems, isMandatory) {
  const choiceControls = containerEl.querySelectorAll("label");
  // remove old content
  for (const j of choiceControls.keys()) {
    containerEl.removeChild( choiceControls[j]);
  }
  if (!containerEl.hasAttribute("data-bind")) {
    containerEl.setAttribute("data-bind", fld);
  }
  // for a mandatory radio button group initialze to first value
  if (choiceWidgetType === "radio" && isMandatory && values.length === 0) {
    values[0] = 1;
  }
  if (values.length >= 1) {
    if (choiceWidgetType === "radio") {
      containerEl.setAttribute("data-value", values[0]);
    } else {  // checkboxes
      containerEl.setAttribute("data-value", "["+ values.join() +"]");
    }
  }
  for (const j of choiceItems.keys()) {
    // button values = 1..n
    const el = createLabeledChoiceControl( choiceWidgetType, fld,
        j+1, choiceItems[j]);
    // mark the radio button or checkbox as selected/checked
    if (values.includes(j+1)) el.firstElementChild.checked = true;
    containerEl.appendChild( el);
    el.firstElementChild.addEventListener("click", function (e) {
      const btnEl = e.target;
      if (choiceWidgetType === "radio") {
        if (containerEl.getAttribute("data-value") !== btnEl.value) {
          containerEl.setAttribute("data-value", btnEl.value);
        } else if (!isMandatory) {
          // turn off radio button
          btnEl.checked = false;
          containerEl.setAttribute("data-value", "");
        }
      } else {  // checkbox
        let values = JSON.parse( containerEl.getAttribute("data-value")) || [];
        let i = values.indexOf( parseInt( btnEl.value));
        if (i > -1) {
          values.splice(i, 1);  // delete from value list
        } else {  // add to value list
          values.push( btnEl.value);
        }
        containerEl.setAttribute("data-value", "["+ values.join() +"]");
      }
    });
  }
  return containerEl;
}

function undisplayAllSegmentFields( domNode, segmentNames) {
  if (!domNode) domNode = document;  // normally invoked for a form element
  for (const segmentName of segmentNames) {
    const fields = domNode.getElementsByClassName( segmentName);
    for (const el of fields) {
      el.style.display = "none";
    }
  }
}

function displaySegmentFields( domNode, segmentNames, segmentIndex) {
  if (!domNode) domNode = document;  // normally invoked for a form element
  for (let i=0; i < segmentNames.length; i++) {
    const fields = domNode.getElementsByClassName( segmentNames[i]);
    for (const el of fields) {
      el.style.display = (i === segmentIndex - 1) ? "block" : "none";
    }
  }
}

/**
 * Fill a list element with items from an entity table
 *
 * @param {object} listEl  A list element
 * @param {object} eTbl  An entity table
 * @param {string} displayProp  The object property to be displayed in the list
 */
function fillListFromMapOld( listEl, eTbl, displayProp) {
  const keys = Object.keys( eTbl);
  // delete old contents
  listEl.innerHTML = "";
  // create list items from object property values
  for (const key of keys) {
    const listItemEl = document.createElement("li");
    listItemEl.textContent = eTbl[key][displayProp];
    listEl.appendChild( listItemEl);
  }
}

/**
 * Create a list element from an map of objects
 *
 * @param {object} eTbl  An entity table
 * @param {string} displayProp  The object property to be displayed in the list
 * @return {object}
 */
function createListFromMap( eTbl, displayProp) {
  const listEl = document.createElement("ul");
  fillListFromMapOld( listEl, eTbl, displayProp);
  return listEl;
}

function newCreateListFromMap( eTbl, array) {
  let ul = document.createElement('ul');

  document.getElementById('myItemList').appendChild(ul);

  array.forEach(function (item) {
    let li = document.createElement('li');
    ul.appendChild(li);

    li.innerHTML += item;
  });
  // const listEl = document.createElement("ul");
  // document.getElementById("demo").innerHTML = '<ul><li>' + array.join("</li><li>"); + '</li></ul>';
  // fillListFromMapOld( listEl, eTbl, displayProp);
  // return listEl;
}

/**
 * Handle user messages
 * @param {string} status
 * @param {string} data
 */
function handleUserMessage (status, data) {
  const userMessageContainerEl = document.querySelector(".user-message"),
      errorMessage = userMessageContainerEl.querySelector("div"),
      buttonEl = document.createElement("button");
  let msgText = `The selected book ${JSON.stringify(data)} has been ${status}.
\nPlease reload this page to continue `;
  // display user message
  userMessageContainerEl.innerHTML = "";
  errorMessage.textContent = msgText;
  buttonEl.setAttribute("type", "button");
  buttonEl.textContent = "Reload";
  errorMessage.appendChild( buttonEl);
  userMessageContainerEl.appendChild( errorMessage);
  userMessageContainerEl.hidden = false;
  // add listener to reload button
  buttonEl.addEventListener( "click", function () {
    location.reload();
  })
}

/**
 * Show or hide progress bar element
 * @param {string} status
 */
function showProgressBar (status) {
  let progressEl = document.querySelector( 'progress');
  if (status === "show") progressEl.hidden = false;
  if (status === "hide") progressEl.hidden = true;
}

/**
 * Convert Firestore timeStamp object to Date string in format YYYY-MM-DD
 * @param {object} timeStamp A Firestore timeStamp object
 */
function timestampToDate (timeStamp) {
  let dateObj = timeStamp.toDate();
  let  y = dateObj.getFullYear(),
      m = "" + (dateObj.getMonth() + 1),
      d = "" + dateObj.getDate();
  if (m.length < 2) m = "0" + m;
  if (d.length < 2) d = "0" + d;
  return [y, m, d].join("-");
}

/**
 * Convert Date string in format YYYY-MM-DD to a Firestore timeStamp object
 * @param {string} date A date string
 */
function dateToTimestamp (date) {
  return firebase.firestore.Timestamp.fromDate( new Date(date));
}

// *************** Multiple Selection Widget ****************************************
/**
 * Create the contents of an Multiple Selection widget, which is a div containing
 * 1) an input field, where item to be deleted are entered,
 * 2) a div containing a select element and an add button allowing to add a selected item
 *    to the association list
 *
 * @param {object} widgetContainerEl  The widget's container div
 * @param {object} selectionRange  An map of objects, which is used to
 *                 create the options of the select element
 * @param {string} inputTextId  input element's name attribute
 * @param {string} placeholder  input element's placeholder message
 * @param {number} minCard  value of minimal number of choices
 */
function createMultiSelectionWidget(widgetContainerEl, selectionRange,
                                    inputTextId, placeholder, minCard) {
  const selectedItemsListEl = document.createElement("ul");
  let el = null;
  if (!minCard) minCard = 0;  // default
  widgetContainerEl.innerHTML = ""; // delete old contents
  // event handler for removing an item from the selection
  selectedItemsListEl.addEventListener( 'click', function (e) {
    if (e.target.tagName === "BUTTON") {  // delete/undo button was clicked
      const btnEl = e.target,
          listItemEl = btnEl.parentNode;
      let listEl = listItemEl.parentNode;
      // if (listEl.children.length <= minCard) {
      //   alert(`A record must have at least ${minCard} item associated!`);
      //   return;
      // }
      if (listItemEl.classList.contains("removed")) {
        // undoing a previous removal
        listItemEl.classList.remove("removed");
        // change button text
        btnEl.textContent = "✕";
      } else if (listItemEl.classList.contains("added")) {
        // removing a previously added item means moving it back to the selection range
        listItemEl.parentNode.removeChild( listItemEl);
      } else {
        // removing an ordinary item
        listItemEl.classList.add("removed");
        // change button text
        btnEl.textContent = "undo";
      }
    }
  });
  for (const authorId of selectionRange) {
    addItemToListOfSelectedItems( selectedItemsListEl, authorId,
        `> ${authorId}`);
  }
  // embed input text field
  const spanEl = document.querySelector(`label[for="${inputTextId}"] > span`);
  spanEl.innerHTML = "";
  const inputEl = document.createElement("input");
  inputEl.setAttribute("size", "15") ;
  inputEl.setAttribute("placeholder", placeholder);
  inputEl.setAttribute("name",inputTextId)
  widgetContainerEl.appendChild( selectedItemsListEl);
  spanEl.appendChild( inputEl);
  const addButton = createPushButton("add")
  spanEl.appendChild( addButton);
  let enteredValues = selectionRange.length > 0 ? [] : selectionRange;
  // event handler for moving an item from the input text to the selected items list
  addButton.parentNode.addEventListener( 'click', function (e) {
    if (e.target.tagName === "BUTTON") {  // add button was clicked
      if (inputEl.value) {
        if (selectionRange.includes( parseInt( inputEl.value))) { // check uniqueness
          alert(`There is an item entered with the same value: ${inputEl.value}`);
        } else if (isNaN( +inputEl.value)) { // check only numbers
          alert(`Only numbers can be entered`);
        } else { // add item
          addItemToListOfSelectedItems( selectedItemsListEl, inputEl.value,
              `> ${inputEl.value}`, "added");
          inputEl.value = "";
        }
      }
      inputEl.value = "";
      inputEl.focus();
    }
  });
}

/**
 * Add an item to a list element showing selected objects
 *
 * @param {object} listEl  A list element
 * @param {string} stdId  A standard identifier of an object
 * @param {string} humanReadableId  A human-readable ID of the object
 * @param {string} classValue?  A class value to be assigned to the list item
 */
function addItemToListOfSelectedItems( listEl, stdId, humanReadableId, classValue) {
  var el=null;
  const listItemEl = document.createElement("li");
  listItemEl.setAttribute("data-value", stdId);
  el = document.createElement("span");
  el.textContent = humanReadableId;
  listItemEl.appendChild( el);
  el = createPushButton("✕");
  listItemEl.appendChild( el);
  if (classValue) listItemEl.classList.add( classValue);
  listEl.appendChild( listItemEl);
}

// *************** D O M - Related ****************************************
/**
 * Create a Push Button
 * @param {string} txt [optional]
 * @return {object}
 */
function createPushButton( txt) {
  var pB = document.createElement("button");
  pB.type = "button";
  if (txt) pB.textContent = txt;
  return pB;
}

export { isNonEmptyString, isIntegerOrIntegerString, cloneObject, createOption,
  fillSelectWithOptions, fillSelectWithOptionsClub, createChoiceWidget, createIsoDateString, undisplayAllSegmentFields,
  displaySegmentFields, createListFromMap, handleUserMessage, showProgressBar,
  dateToTimestamp, timestampToDate, newCreateListFromMap, createMultiSelectionWidget, fillSelectWithOptionsGender};
