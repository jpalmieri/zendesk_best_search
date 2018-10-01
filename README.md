# Zendesk Best Search

![Macro Search](/assets/search-macros.gif?raw=true)

A Zendesk navbar app which allows you to search:
* Macros
* Triggers
* Automations
* Views
* Help Center Articles

![Article Search](/assets/search-articles.gif?raw=true)

### Filter by:

* Title
* Tag
* Comment (macros only)
* Notifications (triggers and automations only)
* Created date
* Updated date

## Development

### Dependencies
- [Node.js](https://nodejs.org/en/) >= 6.3.x
- [Ruby](https://www.ruby-lang.org/) >= 2.0.x
- [Yarn](https://yarnpkg.com/en/)

### Setup
1. Clone or fork this repo
2. Change (`cd`) into the `zendesk_best_search` directory
3. Run `yarn install`

To run your app locally in Zendesk, you need the [Zendesk Apps Tools (ZAT)](https://github.com/zendesk/zendesk_apps_tools).

You'll also need to run a couple of command-line Node.js-based tools that are installed using `npm`. For a node module to be available from the command-line, it must be installed globally.

To setup these and other dependencies, run these commands:

```
gem install zendesk_apps_tools
npm install --global webpack karma-cli
```

### Development Commands

```
yarn run dev
```

This command will watch your files for changes (using webpack), and serve the app to your localhost (with ZAT). You can open up your Zendesk instance in your browser and add the param `?zat=true`, then check the dialog to "Load unsafe scripts" (in your browser, probably in the address bar). You should be able to view your app after these steps.

```
yarn run validate
```

After making changes, you can build the app and have ZAT tools validate the app with the above command.

```
yarn run package
```

If you are satisfied with your changes, you can use the above command to build the app and zip it up. You can then upload the zipped file to your Zendesk instance.

### More info

This app is adapted from the Zendesk Apps Scaffold project, so you may want to take a peek at [their docs](/doc/README.md) to learn more.

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Added some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

Please submit bug reports to Issues.
