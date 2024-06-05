const puppet = require("puppeteer")
const cron = require("node-cron")
const mqtt = require('mqtt')
const fs = require('fs')

const pino = require('pino')
const logger = pino({
  transport: {
    target: 'pino-pretty'
  },
})

async function number_job() {

    var options = JSON.parse(fs.readFileSync("options.json"))
    
    var client = mqtt.connect(options)
    client.on('connect', function () {
        logger.info('Mqtt connected')
    })
    client.on('error', function (error) {
        logger.error(`Mqtt error:${error}`)
    })
    client.on('close', function() {
        logger.info(`Mqtt closed`)
    })

    const browser = await puppet.launch({
        //headless: false, // false makes the browser visible
        defaultViewport: null,
        args: ['--start-maximized'] // This maximizes the browser window if headless is false
    })
    logger.info('browser instance created')
    setTimeout(() => {
        if(browser.connected) {
            logger.error('took much time to find the fancy number. closing browser')
            browser.close()
            client.end()
        }
    }, 30000)

    try {
        let fancy_number = await require("./fancy_number").fancy_number(browser)
        logger.info(`fancy_number : ${fancy_number}`)
        await client.publishAsync("/fancynumber", fancy_number)
    } catch(e) {
        logger.error(`error occured: ${e}`)
        await client.publishAsync("/fancynumber", `${e}`)
    }
    await browser.close()
    await client.end()
    
}

async function main() {
    
    await number_job()

    const cron_pattern = '0 */2 * * *'
    cron.schedule(cron_pattern, async () => {
        await number_job()
    })
    logger.info(`job scheduled with pattern:${cron_pattern}`)
}

if (require.main === module) {
    main()
}