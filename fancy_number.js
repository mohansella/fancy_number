const puppet = require("puppeteer")
const sleep = require("sleep-promise")

const pino = require('pino')
const logger = pino({
  transport: {
    target: 'pino-pretty'
  },
})

/*** 
 *  @param {puppet.Browser} browser
 */
async function fancy_number(browser) {

    const page = await browser.newPage()

    const waitOnIdle = async function (text) {
        await page.waitForNetworkIdle();
        logger.info(text);
        await sleep(1000);
    }

    // Navigate to the website
    await page.goto('https://fancy.parivahan.gov.in/fancy/faces/public/login.xhtml')

    // Hover over the element with class name 'dropdown'
    await page.waitForSelector('.dropdown')
    await page.hover('.dropdown') // Hover over the element

    // Click on the anchor element with ID 'lnkallAvailableNumber'
    await page.waitForSelector('#lnkallAvailableNumber')
    await page.click('#lnkallAvailableNumber')


    //--------------  1. Click State Dropdown
    await page.waitForSelector('#ib_state123_label')
    await page.click('#ib_state123_label')
    await waitOnIdle("States List Selected")

    // Click State
    await page.evaluate(() => {
        const stateList = document.getElementsByClassName("ui-selectonemenu-item ui-selectonemenu-list-item ui-corner-all");
        let tnState = Array.from(stateList).find(a => a.innerText.includes("Tamil"))
        tnState.click()
    });
    await waitOnIdle("TN selected")

    //--------------  2. Click RTO Dropdown
    await page.waitForSelector('#ib_rto123_label')
    await page.click('#ib_rto123_label')
    await waitOnIdle("RTO list clicked")

    // Click RTO
    await page.evaluate(() => {
        const rtoList = document.getElementsByClassName("ui-selectonemenu-item ui-selectonemenu-list-item ui-corner-all")
        let sankagiri = Array.from(rtoList).find(a => a.innerText.includes("SANKAGIRI"))
        sankagiri.click();
    });
    await waitOnIdle("sankagiri selected")

    //--------------  3. Click Vehicle Dropdown
    await page.waitForSelector('#ib_Veh_Seri');
    await page.click('#ib_Veh_Seri');
    await waitOnIdle("Series List selected")

    // Click Series
    await page.evaluate(() => {
        const seriesList = document.getElementsByClassName("ui-selectonemenu-item ui-selectonemenu-list-item ui-corner-all")
        let series = Array.from(seriesList).find(a => a.innerText.includes("TN52AD"))
        series.click()
    });
    await waitOnIdle("Series selected")

    // Wait for table
    await page.waitForSelector('.ui-datagrid-data')


    // -------------- 4. Data grid
    while (true) {
        let result = await page.evaluate(() => {
            function sumOfDigit(num) {
                return num.toString().split("")
                    .reduce((sum, digit) =>
                        sum + parseInt(digit), 0);
            }
            const grids = document.querySelectorAll(".ui-datagrid-column>.ui-outputlabel.ui-widget")
            let toReturn = Array.from(grids).find((e) => {
                let redMatch = `${e.attributes.style.textContent}`.match('red')
                if (redMatch && redMatch.length === 1) {
                    return
                }
                if (sumOfDigit(sumOfDigit(sumOfDigit(e.innerText))) == 8) {
                    return
                }
                return true
            })
            if (toReturn) {
                return Promise.resolve(toReturn.innerText)
            }
        })

        if (result) {
            return `TN 52 AD ${result}`
        }
        await page.click('.ui-icon.ui-icon-seek-next')
        await waitOnIdle("next page clicked")
    }

}

module.exports = {
    fancy_number
}