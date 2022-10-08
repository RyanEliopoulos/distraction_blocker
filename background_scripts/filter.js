async function filterActive() {
  /*
   Returns true if current system time is between start and end times
   else false
   */

  // let nowTimeEpoch = Date.now();
  let dateObject = new Date();
  let currentYear = dateObject.getFullYear();
  let currentMonth = dateObject.getMonth();
  let currentDay = dateObject.getDate();
  console.log(`This is the current day: ${currentDay}`)

  let results = await browser.storage.local.get('settingsObject').catch(error => {console.error(error)})


  let startTimeString = results?.settingsObject?.startTimeString;
  let endTimeString = results?.settingsObject?.endTimeString;
  if(startTimeString === undefined || endTimeString === undefined) return;
  console.log(startTimeString)
  // User has set valid window times
  let startHours = parseInt(startTimeString.slice(0, 2))
  console.log(startHours)
  let startMinutes = parseInt(startTimeString.slice(3, 5))
  console.log(startMinutes)
  let startTimeEpoch = new Date(currentYear, currentMonth, currentDay, startHours, currentDay, startMinutes, 0)
  console.log(startTimeEpoch)
  let endHours = parseInt(endTimeString.slice(0, 2))
  let endMinutes = parseInt(endTimeString.slice(3, 5))
  let endTimeEpoch = new Date(currentYear, currentMonth, currentDay, endHours, endMinutes, 0)
  console.log(`Here is the startTimeEpoch: ${startTimeEpoch}`)
  console.log(`Here is the endTimeEpoch: ${endTimeEpoch}`)
  if(startTimeEpoch <= dateObject && dateObject <= endTimeEpoch) {
    console.log('Filter is active');
    return true;
  }
  else {
    console.log('Filter is not active');
    console.log(dateObject)
    return false;
  }
}



function filterListener(details) {

  console.log(`filterActive results: ${filterActive()}`)
  if(details.url.slice(0, 13) === "moz.extension") {
    // Don't want to catch the extension page in the drag net
    // when passing the originating URL in the query string.
    console.log('extension page detected')
    return;
  }

  filterActive()
    .then(isActive => {
      if(!isActive) return;
      browser.storage.local.get('exemption')
        .then(results => {
          console.log('install script session storage get')
          console.log(results)
          let exemptTabId = results?.exemption?.tabId
          let exemptionFulfilled = results?.exemption?.fulfilled
          if (exemptTabId === details.tabId && exemptionFulfilled === false) {
            // Exempt
            console.log('removing exemption')
            browser.storage.local.remove('exemption')
              .catch(error => {
                console.error(`Error removing exemption from storage: ${error}`)
              });
          }
          else {
            // Not exempt
            browser.tabs.remove(details.tabId)
            browser.tabs.create({url: `../extension_page/extension_page.html?url=${details.url}`})
            console.log('Triggered a targeted URL filter')
          }
        })
        .catch(error => {
          console.error(`Error laoding exemptino from local storage: ${error}`)
        })
    })
}

function onUpdate(message, sender, sendResponse) {
  console.log('in onUpdate')
  if(message.type !== "settings_update") return;
  // Adjusting webNavigation filter
  console.log('removing old filter')
  if(browser.webNavigation.onCommitted.hasListener(filterListener)) {
    browser.webNavigation.onCommitted.removeListener(filterListener);
  }
  console.log('creating filter array')
  let urlFilterArray = message.patternStringArray.map(patternString => (
    {urlMatches: patternString}
  ))
  let filter = { url: urlFilterArray}
  console.log(filter)

  browser.webNavigation.onCommitted.addListener(filterListener, filter);
  console.log('Filters updated')
}

function onInstall() {
  if(browser.runtime.onMessage.hasListener(onUpdate)) return
  browser.runtime.onMessage.addListener(onUpdate);
}



onInstall()
