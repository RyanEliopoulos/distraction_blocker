

function validSettings(settingsObject) {
  /*
    Evaluates contents from the popup's data fields for validity
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
}

function saveSettings() {
  /*
    Gets values from the time pickers and pattern fields.
    Updates local storage and communicates changes to the background script
    if the values are valid
   */
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
  // Saving to disk
  browser.storage.local.set({settingsObject: settingsObject})
    .then(()=> {
      console.log('successfully saved settings. Calling registration background script')
      // Alerting the background filter script to update
       browser.runtime.sendMessage({type: "settings_update", patternStringArray: patternStringArray})
    })
    .catch(error => {
      console.error(`Error writing settings to disk: ${error}`)
    })

}

function updateUI(settingsObject) {
  /*
    Takes the values from settings object and updates the respective UI
    elements.
  */
  // Time pickers
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
  /*
    Pulls settings from storage and updates the UI
    Called on popup "boot"
  */
  browser.storage.local.get("settingsObject")
    .then(results => {
      if(Object.keys(results).length === 0) return; // Returning if settings don't exist
      updateUI(results.settingsObject);
    })
    .catch(error => {
      console.error(`Encountered error retrieving settingsObject from storage: ${error}`)
    })
}

function initBtnListeners() {
  let saveBtn = document.getElementById('save-changes-button')
  saveBtn.onclick = saveSettings;
  let newPatternBtn = document.getElementById('new-pattern-button')
  newPatternBtn.onclick = newPattern;
}

function deletePattern(event) {
  /*
    onClick callback bound to a delete-button-div
    to delete a pattern-list-item
   */
  let listItemDiv = event.target.parentElement //
  listItemDiv.remove();
}

function newPattern() {
  /*
    Callback bound to the new-pattern-button
    Adds a new pattern item to the pattern list div
    (createElement + appendChild)
  */
  let newListItem = buildPatternListItem('')
  let patternListDiv = document.getElementById('pattern-list-div');
  patternListDiv.appendChild(newListItem);
}

function buildPatternListItem(patternString) {
  /*
    Returns Element (div: pattern-list-item)
    <div class="pattern-list-item">
      <div class="delete-button-div inline-block-div" onclick="deletePattern()">
        X
      </div>
      <input type="text" class="pattern-text-input" value=patternString>
    </div>
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


console.log('Loading settings')
loadSettings();
console.log('Running initBtnlisteners');
initBtnListeners();


