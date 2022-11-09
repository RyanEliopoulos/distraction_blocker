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

function deleteFromLocalStorage(key) {
  console.log(`Deleting ${key} from local storage`)
  browser.storage.local.remove(key)
    .catch(error => {
      console.error(`Error deleting from local storage: ${error}`)
    })
}

async function navigateCallback(details) {
  // Registered on webNavigation event.
  // Determines fate of each web navigation by evaluating each URL against the stored regular expressions.
  // Ignores embedded content originating from a URL matching one of the patterns.
  console.log('in navigateCallback')
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
  let isActive = await filterActive()
  if(!isActive) {
    console.log('Filter is not currently active. Allowing all traffic')
    return
  }
  // pulling patterns and evaluating against the URL
  let storedData = await browser.storage.local.get('settingsObject').catch(error => {console.error(error)})
  if(Object.keys(storedData).length === 0) {
    console.log('no settingsObject in local storage')
    return
  }
  let patternStringArray = storedData.settingsObject.patternStringArray
  patternStringArray.forEach(pattern => {
    let regex = new RegExp(pattern)
    if(regex.test(details.url)) {
      console.log(`Regex match for pattern ${pattern}`)
      browser.storage.local.get('exemption')
        .then(result => {
          console.log('Checking for exemptions')
          let exemptTabId = result?.exemption?.tabId
          if(exemptTabId === details.tabId) {
            // Tab is authorized for a manual override
            console.log('Exemption found.')
            deleteFromLocalStorage('exemption')
          }
          else {
            // Tab not authorized for manual override. Redirecting to block page.
            console.log('No exemption found. Redirecting')
            let updateProperties = {
              url: `../extension_page/extension_page.html?url=${details.url}`,
              loadReplace: true  // So the back button doesn't just trigger the filter again.
            }
            browser.tabs.update(details.tabId, updateProperties)
          }
        })
        .catch(error => {
          console.error(`Error loading exemption from disk: ${error}`)
        })
    }
  })
}

function main() {
    if(!browser.webNavigation.onBeforeNavigate.hasListener(navigateCallback)) {
      browser.webNavigation.onCommitted.addListener(navigateCallback);
  }
}

main()
