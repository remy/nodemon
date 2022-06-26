const https = require('https')
const ConfigStore = require('configstore')
const { compare } = require('compare-versions')

const CHECK_INTERVAL = 1000 * 60 * 60 * 24

module.exports = function (pkg) {
  const pkgName = pkg.name
  const pkgVer = pkg.version

  const config = new ConfigStore(`update-notifier-${pkgName}`)
  if (Date.now() - config.get('lastUpdateCheck') < CHECK_INTERVAL) {
    return;
  }

  https.get(`https://registry.npmjs.org/-/package/${pkgName}/dist-tags`, (res) => {
    let body = ''
    res.on('data', (chunk) => body += chunk)
    res.on('end', () => {
      const jsonBody = JSON.parse(body)
      const latestVer = jsonBody['latest']
      if (compare(latestVer, pkgVer, '>')) {
        const msg = `    Update of \x1b[36m${pkgName}\x1b[0m available \x1b[30m${pkgVer}\x1b[0m → \x1b[32m${latestVer}\x1b[0m`
        console.log('')
        console.log(msg)
        console.log('')
      }
      config.set('lastUpdateCheck', Date.now())
    })
  })
}
