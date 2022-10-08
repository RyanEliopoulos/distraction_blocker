
function filterListener(details) {
  if(details.url.slice(0, 13) === "moz.extension") {
    // Don't want to catch the extension page in the drag net
    // when passing the originating URL in the query string.
    console.log('extension page detected')
    return;
  }
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
