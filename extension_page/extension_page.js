/*
  The URL filter redirects the tab to the extension page with
  the offending url stored in a raw string query parameter.

  The filter avoids triggering again because URIs beginning with 'moz-extension' are ignored.
  However, other websites including an offending pattern in their URL will still trigger.
  Using the beginning line anchor in the patterns is ideal.
 */

let searchParams = new URLSearchParams(window.location.search)
let url = searchParams.get('url')


// Updating page to display the offending URL
let p = document.getElementById('url-p')
p.textContent = `${url}`

// Registering override mechanism to the override button
let ob = document.getElementById('override-button')
ob.onclick = ()=>{
  browser.tabs.getCurrent()
    .then(tab => {
      let exemptionObj = {tabId: tab.id}
      browser.storage.local.set({'exemption': exemptionObj})
        .then(()=> {
          console.log('session write success. Opening taboo page');
          window.location.replace(url);
        })
        .catch(error => {
          console.error(`Error writing session s torage: ${error}`)
        })
    })
    .catch(error => {
      console.error(`Error getting current tab: ${error}`)
    })
}
