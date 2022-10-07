function validSettings(settingsObject) {
  /*
    settingsObject:
    {
      'startTimeString': <string>
      'endTimeString': <string>
      'patternStringArray': string[]
    }
   */
  // Checking time window
  let startTimeString = settingsObject.startTimeString
  let endTimeString = settingsObject.endTimeString
  if(startTimeString === '' || endTimeString === '') return false;

  return true;
};


function saveSettings() {
  // Gets values from the start-time and end-time pickers. Writes them to storage.
  let startTimePicker = document.getElementById('start-time-picker');
  let endTimePicker = document.getElementById('end-time-picker');
  let patternInputArray = document.getElementsByClassName('pattern-text-input');
  let patternStringArray = Array.prototype.map.call(patternInputArray, inputElement => ( inputElement.value ));

  let settingsObject = {
    startTimeString:  startTimePicker.value,
    endTimeString: endTimePicker.value,
    patternStringArray: patternStringArray
  }

  if(!validSettings(settingsObject)) {
    console.error(`Invalid settings`)
    return;
  }
  // Settings are valid. Updating data store
  browser.storage.local.set({settingsObject: settingsObject})
    .then(()=> {
      console.log('successfully saved settings.')
    })
    .catch(error => {
      console.error(`Error writing settings to disk: ${error}`)
    })
}


function updateUI(settingsObject) {
  // Takes the values from settings object and updates the respective UI
  // elements.
  let startTimePicker = document.getElementById('start-time-picker');
  startTimePicker.value = settingsObject.startTimeString
  let endTimePicker = document.getElementById('end-time-picker');
  endTimePicker.value = settingsObject.endTimeString

  // Instantiating the pattern list elements
  let patternListDiv = document.getElementById('pattern-list-div');
  settingsObject.patternStringArray.forEach(patternString => {
      let newListItem = buildPatternListItem(patternString);
      patternListDiv.appendChild(newListItem);
  })
}

function loadSettings() {
  // Pulls settings from storage and updates the UI
  // Meant to be called on "boot"
  browser.storage.local.get("settingsObject")
    .then(results => {
      if(Object.keys(results).length === 0) return; // Returning if settings don't exist
      updateUI(results.settingsObject);
    })
    .catch(error => {
      console.error(`Encountered error retrieveing settingsObject from storage: ${error}`)
    })
}

function initBtnListeners() {
  let saveBtn = document.getElementById('save-changes-button')
  saveBtn.onclick = saveSettings;
  let newPatternBtn = document.getElementById('new-pattern-button')
  newPatternBtn.onclick = newPattern;
}

function deletePattern(event) {
  // onClick callback to delete a pattern-list-item
  let listItemDiv = event.target.parentElement //
  listItemDiv.remove();
}

function newPattern() {
  /* Adds a new pattern item to the pattern list div
    (createElement + appendChild)
  */

  let newListItem = buildPatternListItem('')
  /* Attaching to DOM */
  let patternListDiv = document.getElementById('pattern-list-div');
  patternListDiv.appendChild(newListItem);
  console.log('Pressed new pattern button');
}

function buildPatternListItem(patternString) {
  /* Returns Element (div: pattern-list-item)
   */

  let newListItem = document.createElement("div");
  newListItem.classList.add('pattern-list-item');
  /* pattern-list-item contents */
  // Delete button
  let deleteBtnDiv = document.createElement("div");
  deleteBtnDiv.classList.add('delete-button-div');
  deleteBtnDiv.classList.add('inline-block-div');
  deleteBtnDiv.innerText = "X";
  deleteBtnDiv.onclick = deletePattern;
  newListItem.appendChild(deleteBtnDiv);
  // Pattern input field
  let textInput = document.createElement("input");
  textInput.classList.add('pattern-text-input');
  textInput.type = "text";
  textInput.value = patternString;
  newListItem.appendChild(textInput);
  return newListItem;
}


// On initial run we want to pull the settings saved in local storage and populate
// the settings page appropriately.


// Load stored settings, if any

// Install button listeners

console.log('Loading settings')
loadSettings();
console.error('Running initBtnlisteners');
initBtnListeners();


