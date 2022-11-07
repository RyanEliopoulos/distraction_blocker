async function filterActive() {
  /*
   Returns true if current system time is between the start and end times
   specified on the popup page
   else false
   */

  // Current time details
  let dateObject = new Date();
  let currentYear = dateObject.getFullYear();
  let currentMonth = dateObject.getMonth();
  let currentDay = dateObject.getDate();
  // Activation window details
  let results = await browser.storage.local.get('settingsObject').catch(error => {console.error(error)})
  let startTimeString = results?.settingsObject?.startTimeString;
  let endTimeString = results?.settingsObject?.endTimeString;
  if(startTimeString === undefined || endTimeString === undefined) return;
  // User has set valid window times. Constructing corresponding Date objects for comparison
  let startHours = parseInt(startTimeString.slice(0, 2))
  console.log(startHours)
  let startMinutes = parseInt(startTimeString.slice(3, 5))
  console.log(startMinutes)
  let startTimeEpoch = new Date(currentYear, currentMonth, currentDay, startHours, currentDay, startMinutes, 0)
  console.log(startTimeEpoch)
  let endHours = parseInt(endTimeString.slice(0, 2))
  let endMinutes = parseInt(endTimeString.slice(3, 5))
  let endTimeEpoch = new Date(currentYear, currentMonth, currentDay, endHours, endMinutes, 0)
  if(startTimeEpoch <= dateObject && dateObject <= endTimeEpoch) {
    console.log('Filter is active');
    return true;
  }
  else {
    console.log('Filter is not active');
    return false;
  }
}

function filterListener(details) {
  // Executes when the webNavigation.onCommitted event fires with
  // a URL matching those registered during the onUpdate call.
  // Embedded frames originating from a filtered URL are ignored.
  // Calls occurring outside of the specified activation times are ignored.

  if(details.frameId > 0) {
    // This is an embedded frame. Ignoring.
    return;
  }
  if(details.url.slice(0, 13) === "moz-extension") {
    // Don't want to catch the extension page in the drag net
    // when passing the originating URL in the query string.
    console.log('extension page detected')
    return;
  }
  console.log(details.url.slice(0, 13))
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
            // Not exempt. Redirecting.
            let updateProperties = {
              url: `../extension_page/extension_page.html?url=${details.url}`,
              loadReplace: true  // So the back button doesn't just trigger the filter again.
            }
            browser.tabs.update(details.tabId, updateProperties)
            console.log('Triggered a targeted URL filter')
          }
        })
        .catch(error => {
          console.error(`Error loading exemption from local storage: ${error}`)
        })
    })
}

function onUpdate(message, sender, sendResponse) {
  // one-way communication from the popup when the user clicks
  // the 'Save Changes' button or from onStartup
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

function registerMsgListener() {
  // Registers the callback listening for communication from the popup.
  if(browser.runtime.onMessage.hasListener(onUpdate)) return
  browser.runtime.onMessage.addListener(onUpdate);
}

function handleStartup() {
  // Reads any filter patterns from persistent memory and register
  // them with the filter.
  console.log('Inside handleStartup')
  browser.storage.local.get('settingsObject')
    .then(results => {
      if(Object.keys(results).length === 0) {
        console.log('No stored settingsObject')
        return;
      }
      console.log('loading values from settingsObject')
      browser.runtime.sendMessage({type: 'settings_update', patternStringArray: results.patternStringArray})
    })
    .catch(error => {
      console.error(`Error retrieving settingsObject in handleStartup: ${error}`)
    })
}

function main() {
  if(!browser.runtime.onStartup.hasListener(handleStartup)) {
    browser.runtime.onStartup.addListener(handleStartup)
  }
  registerMsgListener()
}

main()

