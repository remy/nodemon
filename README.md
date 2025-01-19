<p align="center">
  <a href="https://nodemon.io/"><img src="https://user-images.githubusercontent.com/13700/35731649-652807e8-080e-11e8-88fd-1b2f6d553b2d.png" alt="Nodemon Logo"></a>
</p>

# nodemon

nodemon is a tool that helps develop Node.js based applications by automatically restarting the node application when file changes in the directory are detected.

nodemon does **not** require *any* additional changes to your code or method of development. nodemon is a replacement wrapper for `node`. To use `nodemon`, replace the word `node` on the command line when executing your script.

[![NPM version](https://badge.fury.io/js/nodemon.svg)](https://npmjs.org/package/nodemon)
[![Backers on Open Collective](https://opencollective.com/nodemon/backers/badge.svg)](#backers) [![Sponsors on Open Collective](https://opencollective.com/nodemon/sponsors/badge.svg)](#sponsors)

# Installation

Either through cloning with git or by using [npm](http://npmjs.org) (the recommended way):

```bash
npm install -g nodemon # or using yarn: yarn global add nodemon
```

And nodemon will be installed globally to your system path.

You can also install nodemon as a development dependency:

```bash
npm install --save-dev nodemon # or using yarn: yarn add nodemon -D
```

With a local installation, nodemon will not be available in your system path or you can't use it directly from the command line. Instead, the local installation of nodemon can be run by calling it from within an npm script (such as `npm start`) or using `npx nodemon`.

# Usage

nodemon wraps your application, so you can pass all the arguments you would normally pass to your app:

```bash
nodemon [your node app]
```

For CLI options, use the `-h` (or `--help`) argument:

```bash
nodemon -h
```

Using nodemon is simple, if my application accepted a host and port as the arguments, I would start it as so:

```bash
nodemon ./server.js localhost 8080
```

Any output from this script is prefixed with `[nodemon]`, otherwise all output from your application, errors included, will be echoed out as expected.

You can also pass the `inspect` flag to node through the command line as you would normally:

```bash
nodemon --inspect ./server.js 80
```

If you have a `package.json` file for your app, you can omit the main script entirely and nodemon will read the `package.json` for the `main` property and use that value as the app ([ref](https://github.com/remy/nodemon/issues/14)).

nodemon will also search for the `scripts.start` property in `package.json` (as of nodemon 1.1.x).

Also check out the [FAQ](https://github.com/remy/nodemon/blob/master/faq.md) or [issues](https://github.com/remy/nodemon/issues) for nodemon.

## Automatic re-running

nodemon was originally written to restart hanging processes such as web servers, but now supports apps that cleanly exit. If your script exits cleanly, nodemon will continue to monitor the directory (or directories) and restart the script if there are any changes.

## Manual restarting

Whilst nodemon is running, if you need to manually restart your application, instead of stopping and restart nodemon, you can type `rs` with a carriage return, and nodemon will restart your process.

## Config files

nodemon supports local and global configuration files. These are usually named `nodemon.json` and can be located in the current working directory or in your home directory. An alternative local configuration file can be specified with the `--config <file>` option.

The specificity is as follows, so that a command line argument will always override the config file settings:

- command line arguments
- local config
- global config

A config file can take any of the command line arguments as JSON key values, for example:

```json
{
  "verbose": true,
  "ignore": ["*.test.js", "**/fixtures/**"],
  "execMap": {
    "rb": "ruby",
    "pde": "processing --sketch={{pwd}} --run"
  }
}
```

The above `nodemon.json` file might be my global config so that I have support for ruby files and processing files, and I can run `nodemon demo.pde` and nodemon will automatically know how to run the script even though out of the box support for processing scripts.

A further example of options can be seen in [sample-nodemon.md](https://github.com/remy/nodemon/blob/master/doc/sample-nodemon.md)

### package.json

If you want to keep all your package configurations in one place, nodemon supports using `package.json` for configuration.
Specify the config in the same format as you would for a config file but under `nodemonConfig` in the `package.json` file, for example, take the following `package.json`:

```json
{
  "name": "nodemon",
  "homepage": "http://nodemon.io",
  "...": "... other standard package.json values",
  "nodemonConfig": {
    "ignore": ["**/test/**", "**/docs/**"],
    "delay": 2500
  }
}
```

Note that if you specify a `--config` file or provide a local `nodemon.json` any `package.json` config is ignored.

*This section needs better documentation, but for now you can also see `nodemon --help config` ([also here](https://github.com/remy/nodemon/blob/master/doc/cli/config.txt))*.

## Using nodemon as a module

Please see [doc/requireable.md](doc/requireable.md)

## Using nodemon as child process

Please see [doc/events.md](doc/events.md#Using_nodemon_as_child_process)

## Running non-node scripts

nodemon can also be used to execute and monitor other programs. nodemon will read the file extension of the script being run and monitor that extension instead of `.js` if there's no `nodemon.json`:

```bash
nodemon --exec "python -v" ./app.py
```

Now nodemon will run `app.py` with python in verbose mode (note that if you're not passing args to the exec program, you don't need the quotes), and look for new or modified files with the `.py` extension.

### Default executables

Using the `nodemon.json` config file, you can define your own default executables using the `execMap` property. This is particularly useful if you're working with a language that isn't supported by default by nodemon.

To add support for nodemon to know about the `.pl` extension (for Perl), the `nodemon.json` file would add:

```json
{
  "execMap": {
    "pl": "perl"
  }
}
```

Now running the following, nodemon will know to use `perl` as the executable:

```bash
nodemon script.pl
```

It's generally recommended to use the global `nodemon.json` to add your own `execMap` options. However, if there's a common default that's missing, this can be merged in to the project so that nodemon supports it by default, by changing [default.js](https://github.com/remy/nodemon/blob/master/lib/config/defaults.js) and sending a pull request.

## Monitoring multiple directories

By default nodemon monitors the current working directory. If you want to take control of that option, use the `--watch` option to add specific paths:

```bash
nodemon --watch app --watch libs app/server.js
```

Now nodemon will only restart if there are changes in the `./app` or `./libs` directory. By default nodemon will traverse sub-directories, so there's no need in explicitly including sub-directories.

Nodemon also supports unix globbing, e.g `--watch './lib/*'`. The globbing pattern must be quoted. For advanced globbing, [see `picomatch` documentation](https://github.com/micromatch/picomatch#advanced-globbing), the library that nodemon uses through `chokidar` (which in turn uses it through `anymatch`).

## Specifying extension watch list

By default, nodemon looks for files with the `.js`, `.mjs`, `.coffee`, `.litcoffee`, and `.json` extensions. If you use the `--exec` option and monitor `app.py` nodemon will monitor files with the extension of `.py`. However, you can specify your own list with the `-e` (or `--ext`) switch like so:

```bash
nodemon -e js,pug
```

Now nodemon will restart on any changes to files in the directory (or subdirectories) with the extensions `.js`, `.pug`.

## Ignoring files

By default, nodemon will only restart when a `.js` JavaScript file changes. In some cases you will want to ignore some specific files, directories or file patterns, to prevent nodemon from prematurely restarting your application.

This can be done via the command line:

```bash
nodemon --ignore lib/ --ignore tests/
```

Or specific files can be ignored:

```bash
nodemon --ignore lib/app.js
```

Patterns can also be ignored (but be sure to quote the arguments):

```bash
nodemon --ignore 'lib/*.js'
```

**Important** the ignore rules are patterns matched to the full absolute path, and this determines how many files are monitored. If using a wild card glob pattern, it needs to be used as `**` or omitted entirely. For example, `nodemon --ignore '**/test/**'` will work, whereas `--ignore '*/test/*'` will not.

Note that by default, nodemon will ignore the `.git`, `node_modules`, `bower_components`, `.nyc_output`, `coverage` and `.sass-cache` directories and *add* your ignored patterns to the list. If you want to indeed watch a directory like `node_modules`, you need to [override the underlying default ignore rules](https://github.com/remy/nodemon/blob/master/faq.md#overriding-the-underlying-default-ignore-rules).

## Application isn't restarting

In some networked environments (such as a container running nodemon reading across a mounted drive), you will need to use the `legacyWatch: true` which enables Chokidar's polling.

Via the CLI, use either `--legacy-watch` or `-L` for short:

```bash
nodemon -L
```

Though this should be a last resort as it will poll every file it can find.

## Delaying restarting

In some situations, you may want to wait until a number of files have changed. The timeout before checking for new file changes is 1 second. If you're uploading a number of files and it's taking some number of seconds, this could cause your app to restart multiple times unnecessarily.

To add an extra throttle, or delay restarting, use the `--delay` command:

```bash
nodemon --delay 10 server.js
```

For more precision, milliseconds can be specified.  Either as a float:

```bash
nodemon --delay 2.5 server.js
```

Or using the time specifier (ms):

```bash
nodemon --delay 2500ms server.js
```

The delay figure is number of seconds (or milliseconds, if specified) to delay before restarting. So nodemon will only restart your app the given number of seconds after the *last* file change.

If you are setting this value in `nodemon.json`, the value will always be interpreted in milliseconds. E.g., the following are equivalent:

```bash
nodemon --delay 2.5

{
  "delay": 2500
}
```

## Gracefully reloading down your script

It is possible to have nodemon send any signal that you specify to your application.

```bash
nodemon --signal SIGHUP server.js
```

Your application can handle the signal as follows.

```js
process.on("SIGHUP", function () {
  reloadSomeConfiguration();
  process.kill(process.pid, "SIGTERM");
})
```

Please note that nodemon will send this signal to every process in the process tree.

If you are using `cluster`, then each workers (as well as the master) will receive the signal. If you wish to terminate all workers on receiving a `SIGHUP`, a common pattern is to catch the `SIGHUP` in the master, and forward `SIGTERM` to all workers, while ensuring that all workers ignore `SIGHUP`.

```js
if (cluster.isMaster) {
  process.on("SIGHUP", function () {
    for (const worker of Object.values(cluster.workers)) {
      worker.process.kill("SIGTERM");
    }
  });
} else {
  process.on("SIGHUP", function() {})
}
```

## Controlling shutdown of your script

nodemon sends a kill signal to your application when it sees a file update. If you need to clean up on shutdown inside your script you can capture the kill signal and handle it yourself.

The following example will listen once for the `SIGUSR2` signal (used by nodemon to restart), run the clean up process and then kill itself for nodemon to continue control:

```js
// important to use `on` and not `once` as nodemon can re-send the kill signal
process.on('SIGUSR2', function () {
  gracefulShutdown(function () {
    process.kill(process.pid, 'SIGTERM');
  });
});
```

Note that the `process.kill` is *only* called once your shutdown jobs are complete. Hat tip to [Benjie Gillam](http://www.benjiegillam.com/2011/08/node-js-clean-restart-and-faster-development-with-nodemon/) for writing this technique up.

## Triggering events when nodemon state changes

If you want growl like notifications when nodemon restarts or to trigger an action when an event happens, then you can either `require` nodemon or add event actions to your `nodemon.json` file.

For example, to trigger a notification on a Mac when nodemon restarts, `nodemon.json` looks like this:

```json
{
  "events": {
    "restart": "osascript -e 'display notification \"app restarted\" with title \"nodemon\"'"
  }
}
```

A full list of available events is listed on the [event states wiki](https://github.com/remy/nodemon/wiki/Events#states). Note that you can bind to both states and messages.

## Pipe output to somewhere else

```js
nodemon({
  script: ...,
  stdout: false // important: this tells nodemon not to output to console
}).on('readable', function() { // the `readable` event indicates that data is ready to pick up
  this.stdout.pipe(fs.createWriteStream('output.txt'));
  this.stderr.pipe(fs.createWriteStream('err.txt'));
});
```

## Using nodemon in your gulp workflow

Check out the [gulp-nodemon](https://github.com/JacksonGariety/gulp-nodemon) plugin to integrate nodemon with the rest of your project's gulp workflow.

## Using nodemon in your Grunt workflow

Check out the [grunt-nodemon](https://github.com/ChrisWren/grunt-nodemon) plugin to integrate nodemon with the rest of your project's grunt workflow.

## Pronunciation

> nodemon, is it pronounced: node-mon, no-demon or node-e-mon (like pokémon)?

Well...I've been asked this many times before. I like that I've been asked this before. There's been bets as to which one it actually is.

The answer is simple, but possibly frustrating. I'm not saying (how I pronounce it). It's up to you to call it as you like. All answers are correct :)

## Design principles

- Fewer flags is better
- Works across all platforms
- Fewer features
- Let individuals build on top of nodemon
- Offer all CLI functionality as an API
- Contributions must have and pass tests

Nodemon is not perfect, and CLI arguments has sprawled beyond where I'm completely happy, but perhaps it can be reduced a little one day.

## FAQ

See the [FAQ](https://github.com/remy/nodemon/blob/master/faq.md) and please add your own questions if you think they would help others.

## Backers

Thank you to all [our backers](https://opencollective.com/nodemon#backer)! 🙏

[![nodemon backers](https://opencollective.com/nodemon/backers.svg?width=890)](https://opencollective.com/nodemon#backers)

## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [Sponsor this project today ❤️](https://opencollective.com/nodemon#sponsor)

<div style="overflow: hidden; margin-bottom: 80px;"><!--oc--><a title='buy instagram followers on skweezer.net today' data-id='532050' data-tier='0' href='https://skweezer.net/buy-instagram-followers'><img alt='buy instagram followers on skweezer.net today' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/b0ddcb1b-9054-4220-8d72-05131b28a2bb/logo-skweezer-icon.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Netpositive' data-id='162674' data-tier='1' href='https://najlepsibukmacherzy.pl/ranking-legalnych-bukmacherow/'><img alt='Netpositive' src='https://opencollective-production.s3.us-west-1.amazonaws.com/52acecf0-608a-11eb-b17f-5bca7c67fe7b.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='KasynoHEX' data-id='177376' data-tier='1' href='https://pl.polskiekasynohex.org/'><img alt='KasynoHEX' src='https://opencollective-production.s3.us-west-1.amazonaws.com/2bb0d6e0-99c8-11ea-9349-199aa0d5d24a.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Casinoonlineaams.com' data-id='198634' data-tier='1' href='https://www.casinoonlineaams.com'><img alt='Casinoonlineaams.com' src='https://opencollective-production.s3.us-west-1.amazonaws.com/61bcf1d0-43ce-11ed-b562-6bf567fce1fd.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Best online casinos not on GamStop in the UK' data-id='243140' data-tier='1' href='https://casino-wise.com/'><img alt='Best online casinos not on GamStop in the UK' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/f889d209-a931-4c06-a529-fe1f86c411bf/casino-wise-logo.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='TheCasinoDB' data-id='270835' data-tier='1' href='https://www.thecasinodb.com'><img alt='TheCasinoDB' src='https://logo.clearbit.com/thecasinodb.com' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='inkedin' data-id='305884' data-tier='1' href='https://inkedin.com'><img alt='inkedin' src='https://logo.clearbit.com/inkedin.com' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Goread.io' data-id='320564' data-tier='1' href='https://goread.io/buy-instagram-followers'><img alt='Goread.io' src='https://opencollective-production.s3.us-west-1.amazonaws.com/7d1302a0-0f33-11ed-a094-3dca78aec7cd.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Best Australian online casinos. Reviewed by Correct Casinos.' data-id='322445' data-tier='1' href='https://www.correctcasinos.com/australian-online-casinos/'><img alt='Best Australian online casinos. Reviewed by Correct Casinos.' src='https://opencollective-production.s3.us-west-1.amazonaws.com/fef95200-1551-11ed-ba3f-410c614877c8.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='' data-id='326865' data-tier='1' href='https://www.uudetkasinot.com'><img alt='' src='https://opencollective-production.s3.us-west-1.amazonaws.com/b6055950-df00-11eb-9caa-b58f40adecd5.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Do My Online Class - NoNeedToStudy.com' data-id='327241' data-tier='1' href='https://www.noneedtostudy.com/take-my-online-class/'><img alt='Do My Online Class - NoNeedToStudy.com' src='https://user-images.githubusercontent.com/13700/187039696-e2d8cd59-8b4e-438f-a052-69095212427d.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Slotmachineweb.com' data-id='329195' data-tier='1' href='https://www.slotmachineweb.com/'><img alt='Slotmachineweb.com' src='https://opencollective-production.s3.us-west-1.amazonaws.com/172f9eb0-22c2-11ed-a0b5-97427086b4aa.jpg' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Website dedicated to finding the best and safest licensed online casinos in India' data-id='342390' data-tier='1' href='https://www.ghotala.com/'><img alt='Website dedicated to finding the best and safest licensed online casinos in India' src='https://opencollective-production.s3.us-west-1.amazonaws.com/75afa9e0-4ac6-11ed-8d6a-fdcc8c0d0736.jpg' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='nongamstopcasinos.net' data-id='367236' data-tier='1' href='https://nongamstopcasinos.net/en/'><img alt='nongamstopcasinos.net' src='https://opencollective-production.s3.us-west-1.amazonaws.com/fb8b5ba0-3904-11ed-8516-edd7b7687a36.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Scommesse777' data-id='370216' data-tier='1' href='https://www.scommesse777.com/'><img alt='Scommesse777' src='https://opencollective-production.s3.us-west-1.amazonaws.com/c0346cb0-7ad4-11ed-a9cf-49dc3536976e.jpg' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Buy Instagram Likes' data-id='411448' data-tier='1' href='https://poprey.com/'><img alt='Buy Instagram Likes' src='https://opencollective-production.s3.us-west-1.amazonaws.com/fe650970-c21c-11ec-a499-b55e54a794b4.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='OnlineCasinosSpelen' data-id='423738' data-tier='1' href='https://onlinecasinosspelen.com'><img alt='OnlineCasinosSpelen' src='https://logo.clearbit.com/onlinecasinosspelen.com' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Beoordelen van nieuwe online casino&apos;s 2023' data-id='424449' data-tier='1' href='https://Nieuwe-Casinos.net'><img alt='Beoordelen van nieuwe online casino&apos;s 2023' src='https://logo.clearbit.com/Nieuwe-Casinos.net' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='CasinoZonderRegistratie.net - Nederlandse Top Casino&apos;s' data-id='424450' data-tier='1' href='https://casinoZonderregistratie.net/'><img alt='CasinoZonderRegistratie.net - Nederlandse Top Casino&apos;s' src='https://opencollective-production.s3.us-west-1.amazonaws.com/aeb624c0-7ae7-11ed-8d0e-bda59436695a.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='OnlineCasinoProfy is your guide to the world of gambling.' data-id='426813' data-tier='1' href='https://polskiekasynaonline24.com/'><img alt='OnlineCasinoProfy is your guide to the world of gambling.' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/f8b0f6de-6ab5-4860-9688-709fe03873d3/2%201%20%282%29.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Famoid is a digital marketing agency that specializes in social media services and tools.' data-id='434604' data-tier='1' href='https://famoid.com/'><img alt='Famoid is a digital marketing agency that specializes in social media services and tools.' src='https://logo.clearbit.com/famoid.com' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='We are the leading Nearshore Technology Solutions company. We architect and engineer scalable and high-performing software solutions.' data-id='452424' data-tier='1' href='https://www.bairesdev.com/sponsoring-open-source-projects/'><img alt='We are the leading Nearshore Technology Solutions company. We architect and engineer scalable and high-performing software solutions.' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/dc38bc3b-7430-4cf7-9b77-36467eb92915/logo8.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Buy real Instagram followers from Twicsy starting at only $2.97. Twicsy has been voted the best site to buy followers from the likes of US Magazine.' data-id='453050' data-tier='1' href='https://twicsy.com/buy-instagram-followers'><img alt='Buy real Instagram followers from Twicsy starting at only $2.97. Twicsy has been voted the best site to buy followers from the likes of US Magazine.' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/f07b6f83-d0ed-43c6-91ae-ec8fa90512cd/twicsy-followers.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='SocialWick offers the best Instagram Followers in the market. If you are looking to boost your organic growth, buy Instagram followers from SocialWick' data-id='462750' data-tier='1' href='https://www.socialwick.com/instagram/followers'><img alt='SocialWick offers the best Instagram Followers in the market. If you are looking to boost your organic growth, buy Instagram followers from SocialWick' src='https://logo.clearbit.com/socialwick.com' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Online United States Casinos' data-id='466446' data-tier='1' href='https://www.onlineunitedstatescasinos.com/'><img alt='Online United States Casinos' src='https://logo.clearbit.com/onlineunitedstatescasinos.com' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Online iGaming platform with reliable and trusted reviews.' data-id='473786' data-tier='1' href='https://onlinecasinohex.ph/'><img alt='Online iGaming platform with reliable and trusted reviews.' src='https://opencollective-production.s3.us-west-1.amazonaws.com/b19cbf10-3a5e-11ed-9713-c7c7fc5beda8.svg' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Looking to boost your YouTube channel? Buy YouTube subscribers with Views4You and watch your audience grow!' data-id='493616' data-tier='1' href='https://views4you.com/buy-youtube-subscribers/'><img alt='Looking to boost your YouTube channel? Buy YouTube subscribers with Views4You and watch your audience grow!' src='https://logo.clearbit.com/views4you.com' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Buy Telegram Members' data-id='501897' data-tier='1' href='https://buycheapestfollowers.com/buy-telegram-channel-members'><img alt='Buy Telegram Members' src='https://github-production-user-asset-6210df.s3.amazonaws.com/13700/286696172-747dca05-a1e8-4d93-a9e9-95054d1566df.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='We review the entire iGaming industry from A to Z' data-id='504258' data-tier='1' href='https://casinolandia.com'><img alt='We review the entire iGaming industry from A to Z' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/5f858add-77f1-47a2-b577-39eecb299c8c/Logo264.jpg' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='aussiecasinoreviewer.com' data-id='508822' data-tier='1' href='https://aussiecasinoreviewer.com/'><img alt='aussiecasinoreviewer.com' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/6ffb5045-e33e-4314-a891-5286fa4a220f/Aussiecasinoreviewer%20logo%20(2)%20(2).jpg' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='MEGAFAMOUS.com' data-id='509686' data-tier='1' href='https://megafamous.com/buy-automatic-instagram-likes'><img alt='MEGAFAMOUS.com' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/c0af8a5d-8fe7-4925-b357-cee797841913/MEGAFAMOUS%20Instagram%20Likes%20.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='PopularityBazaar helps you quickly grow your social media accounts. Buy 100% real likes, followers, views, comments, and more to kickstart your online presence.' data-id='509894' data-tier='1' href='https://popularitybazaar.com/instagram-likes/'><img alt='PopularityBazaar helps you quickly grow your social media accounts. Buy 100% real likes, followers, views, comments, and more to kickstart your online presence.' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/a2878e26-3710-453f-9a41-80eeee60a2cc/Group%201.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='philippinescasinos.ph' data-id='512007' data-tier='1' href='https://philippinescasinos.ph/gcash/'><img alt='philippinescasinos.ph' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/b758f1b0-3211-464b-a19e-95e2a5f4fa22/PhilippinesCasinos%20bigger.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Incognito' data-id='512350' data-tier='1' href='https://www.outlookindia.com/plugin-play/casinos-not-on-gamstop-uk-news-302214'><img alt='Incognito' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/fdf584c2-defe-4025-ab26-15e5c5ff607e/Non%20gamstop%20casino%20Outlookindia.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='NonGamStopBets Casinos not on GamStop' data-id='515480' data-tier='1' href='https://www.nongamstopbets.com/casinos-not-on-gamstop/'><img alt='NonGamStopBets Casinos not on GamStop' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/6c22601d-6a3f-4370-91dd-a9797887372a/nongamstopbets.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='UpGrow is the Best Instagram Growth Service in 2024. Get more real Instagram followers with our AI-powered growth engine to get 10x faster results. ' data-id='519002' data-tier='1' href='https://www.upgrow.com/'><img alt='UpGrow is the Best Instagram Growth Service in 2024. Get more real Instagram followers with our AI-powered growth engine to get 10x faster results. ' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/63ab7268-5ce4-4e61-b9f1-93a1bd89cd3e/ms-icon-310x310.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='CryptoCasinos.online' data-id='525119' data-tier='1' href='https://cryptocasinos.online/'><img alt='CryptoCasinos.online' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/97712948-3b1b-4026-a109-257d879baa23/CryptoCasinos.Online-FBcover18.jpg' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='No deposit casino promo Codes 2024 - The best online Casinos websites. No deposit bonus codes, Free Spins and Promo Codes. Stake, Roobet, Jackpotcity and more.' data-id='540890' data-tier='1' href='https://www.ownedcore.com/casino'><img alt='No deposit casino promo Codes 2024 - The best online Casinos websites. No deposit bonus codes, Free Spins and Promo Codes. Stake, Roobet, Jackpotcity and more.' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/8bd4b78c-95e2-4c41-b4f4-d7fd6c0e12cd/logo4-e6140c27.webp' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Online casino.' data-id='541128' data-tier='1' href='https://www.fruityking.co.nz'><img alt='Online casino.' src='https://logo.clearbit.com/fruityking.co.nz' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Listing no deposit bonus offers from various internet sites .' data-id='546391' data-tier='1' href='https://www.nodepositcasinobonus.org/'><img alt='Listing no deposit bonus offers from various internet sites .' src='https://logo.clearbit.com/nodepositcasinobonus.org' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Fortune Tiger' data-id='551192' data-tier='1' href='https://fortune-tiger-br.com/'><img alt='Fortune Tiger' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/88904f4a-f997-49e8-8fd4-5068acc85a98/fortune-tiger-slot-281-img-2.webp' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='SidesMedia' data-id='558019' data-tier='1' href='https://sidesmedia.com'><img alt='SidesMedia' src='https://logo.clearbit.com/sidesmedia.com' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Find the social proof you need to reach your audience! Boost conversions. Quickly buy Twitter Followers &amp; more with no sign-up. Taking you to the next' data-id='568449' data-tier='1' href='https://Bulkoid.com/buy-twitter-followers'><img alt='Find the social proof you need to reach your audience! Boost conversions. Quickly buy Twitter Followers &amp; more with no sign-up. Taking you to the next' src='https://logo.clearbit.com/Bulkoid.com' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Social Media Management and all kinds of followers' data-id='587050' data-tier='1' href='https://www.socialfollowers.uk/buy-tiktok-followers/'><img alt='Social Media Management and all kinds of followers' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/8941f043-5d00-4e33-a1fd-f2d27ca54963/Social%20Followers%20Uk%20logo%20black.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Trusted last mile route planning and route optimization' data-id='590147' data-tier='1' href='https://route4me.com/'><img alt='Trusted last mile route planning and route optimization' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/237386c3-48a2-47c6-97ac-5f888cdb4cda/Route4MeIconLogo.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Betwinner is an online bookmaker offering sports betting, casino games, and more.' data-id='594768' data-tier='1' href='https://guidebook.betwinner.com/'><img alt='Betwinner is an online bookmaker offering sports betting, casino games, and more.' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/82cab29a-7002-4924-83bf-2eecb03d07c4/0x0.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Help users to find best and cheapest site to buy Instagram Followers' data-id='598908' data-tier='1' href='https://www.reddit.com/r/TikTokExpert/comments/1dpyujh/whats_the_best_site_to_buy_instagram_likes_views/'><img alt='Help users to find best and cheapest site to buy Instagram Followers' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/263abc3a-0841-4694-b24a-788460391613/communityIcon_66mltiw57b4d1.jpg' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='At Buzzoid, you can buy Instagram followers quickly, safely, and easily with just a few clicks. Rated world&apos;s #1 IG service since 2012.' data-id='602382' data-tier='1' href='https://buzzoid.com/buy-instagram-followers/'><img alt='At Buzzoid, you can buy Instagram followers quickly, safely, and easily with just a few clicks. Rated world&apos;s #1 IG service since 2012.' src='https://logo.clearbit.com/buzzoid.com' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='BonusBezDepozytu' data-id='603579' data-tier='1' href='https://bonusbezdepozytu.org/'><img alt='BonusBezDepozytu' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/ce285388-bc43-41f5-b140-e39e78d44050/Bonus%20Bez%20Depozytu%20Logo.jpg' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Zamsino.com' data-id='608094' data-tier='1' href='https://zamsino.com/'><img alt='Zamsino.com' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/e3e99af5-a024-4d85-8594-8fd22e506bc9/Zamsino.com%20Logo.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='⬆️ Graming offer top-notch Instagram followers at the best prices! Click on &quot;Globe&quot; above to check our services' data-id='608370' data-tier='1' href='https://graming.com/buy-instagram-followers/'><img alt='⬆️ Graming offer top-notch Instagram followers at the best prices! Click on &quot;Globe&quot; above to check our services' src='https://logo.clearbit.com/graming.com' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Feedthebot is an informative resource with free seo tools designed to help webmasters, SEO specialists, marketers, and entrepreneurs navigate and bett' data-id='612702' data-tier='1' href='https://www.feedthebot.org/'><img alt='Feedthebot is an informative resource with free seo tools designed to help webmasters, SEO specialists, marketers, and entrepreneurs navigate and bett' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/613fd973-b367-41bb-b253-34d2ebf877e8/logo-feedthebot(2).png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Social media service' data-id='613887' data-tier='1' href='https://www.fbpostlikes.com/buy-instagram-followers.html'><img alt='Social media service' src='https://logo.clearbit.com/fbpostlikes.com' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Find the social proof you need to reach your audience! Boost conversions. Quickly buy Twitter Followers &amp; more with no sign-up. Taking you to the next' data-id='615986' data-tier='1' href='https://growthoid.com/buy-twitter-followers/'><img alt='Find the social proof you need to reach your audience! Boost conversions. Quickly buy Twitter Followers &amp; more with no sign-up. Taking you to the next' src='https://logo.clearbit.com/growthoid.com' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Playfortuneforfun.com' data-id='617861' data-tier='1' href='https://playfortuneforfun.com/'><img alt='Playfortuneforfun.com' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/15dc8611-e11e-4fdf-b80e-7dbddb4dc3db/PFFF.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Reviewing and comparing online casinos available to Finnish players. In addition, we publish relevant news and blog posts about the world of iGaming.' data-id='620398' data-tier='1' href='https://uusimmatkasinot.com/'><img alt='Reviewing and comparing online casinos available to Finnish players. In addition, we publish relevant news and blog posts about the world of iGaming.' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/d5326d0f-3cde-41f4-b480-78ef8a2fb015/Uusimmatkasinot_head_siteicon.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Jabka Skin' data-id='634777' data-tier='1' href='https://jabka.skin/ru/'><img alt='Jabka Skin' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/4c272505-2e0b-4e93-9693-c7d5c07ea0c6/IMG_0161.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Онлайн казино та БК (ставки на спорт) в Україні' data-id='638974' data-tier='1' href='https://betking.com.ua/'><img alt='Онлайн казино та БК (ставки на спорт) в Україні' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/08587758-582c-4136-aba5-2519230960d3/betking.jpg' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='' data-id='Youraffe' data-tier='1' href='https://zimplerkasinot.net/'><img alt='' src='https://github.com/user-attachments/assets/cbeddc6e-827a-41eb-b669-a0a4575d068a' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='kasyna w polsce' data-id='641289' data-tier='1' href='https://plkasynaonline.com'><img alt='kasyna w polsce' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/99a2d8ec-e6b8-402d-ad8e-bc34da5050a9/plkasyna.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Buy Youtube Views' data-id='641611' data-tier='1' href='https://ssmarket.net/buy-youtube-views'><img alt='Buy Youtube Views' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/bbc20da5-6350-4f69-a5a5-33b8d438fe72/favicon_kare.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='casinosfest' data-id='642245' data-tier='1' href='https://casinosfest.com'><img alt='casinosfest' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/908f825b-e459-47fe-9bfb-e0ac79c1eab0/casinosfest-1-red%20(1).png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Prank Caller - #1 Prank Calling App' data-id='642864' data-tier='1' href='https://prankcaller.io'><img alt='Prank Caller - #1 Prank Calling App' src='https://logo.clearbit.com/prankcaller.io' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='At Tokmax, we are dedicated to being the leading platform for enhancing TikTok engagement. Whether you&apos;re an emerging creator or an established influe' data-id='644663' data-tier='1' href='https://tokmax.com'><img alt='At Tokmax, we are dedicated to being the leading platform for enhancing TikTok engagement. Whether you&apos;re an emerging creator or an established influe' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/e599b6c9-f803-4672-8953-de41af36a30a/Final-10.webp' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='Buzzvoice is your one-stop shop for all your social media marketing needs. With Buzzvoice, you can buy followers, comments, likes, video views and more!' data-id='646075' data-tier='1' href='https://buzzvoice.com/'><img alt='Buzzvoice is your one-stop shop for all your social media marketing needs. With Buzzvoice, you can buy followers, comments, likes, video views and more!' src='https://opencollective-production.s3.us-west-1.amazonaws.com/acd68da0-e71e-11ec-a84e-fd82f80383c1.jpg' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='At Famety, you can grow your social media following quickly, safely, and easily with just a few clicks. Rated the world’s #1 social media service since 2013.' data-id='646341' data-tier='1' href='https://www.famety.com/'><img alt='At Famety, you can grow your social media following quickly, safely, and easily with just a few clicks. Rated the world’s #1 social media service since 2013.' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/cfb851d7-3d7e-451b-b872-b653b28c976f/favicon_001.png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='We help people find the best solutions to grow TikTok and Instagram' data-id='648412' data-tier='1' href='https://www.reddit.com/r/TikTokExpert/'><img alt='We help people find the best solutions to grow TikTok and Instagram' src='https://logo.clearbit.com/reddit.com' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='' data-id='648524' data-tier='1' href='https://www.c19.cl/'><img alt='' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/01b96d4c-4852-4499-8c70-e3ec57d0c58c/2024-05-09_17-27%20(1).png' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='' data-id='Youraffe2' data-tier='1' href='https://verovapaatnettikasinot.net/'><img alt='' src='https://github.com/user-attachments/assets/686bae37-cc29-45e6-b079-ea0bdc101f4e' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>
<a title='non GamStop sites' data-id='649825' data-tier='1' href='https://www.stjamestheatre.co.uk/'><img alt='non GamStop sites' src='https://opencollective-production.s3.us-west-1.amazonaws.com/account-avatar/07eb5953-01b2-41cf-8e33-77b9b6df1477/%D0%97%D0%BD%D1%96%D0%BC%D0%BE%D0%BA%20%D0%B5%D0%BA%D1%80%D0%B0%D0%BD%D0%B0%202025-01-10%20%D0%BE%2015.29.42%20(1)%20(1).jpg' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a><!--oc-->
</div>

Please note that links to the sponsors above are not direct endorsements nor affiliated with any of contributors of the nodemon project.

# License

MIT [http://rem.mit-license.org](http://rem.mit-license.org)
