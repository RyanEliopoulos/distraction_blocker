
let searchParams = new URLSearchParams(window.location.search)
let url = searchParams.get('url')


let ob = document.getElementById('override-button')
ob.onclick = ()=>{
  browser.tabs.getCurrent()
    .then(tab => {
      let exemptionObj = {tabId: tab.id, fulfilled: false}
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
