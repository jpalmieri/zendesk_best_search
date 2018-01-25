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

## Installation

1. [Install Zendesk App Tools](https://support.zendesk.com/hc/en-us/articles/203691236), if you don't have them already.
2. `git clone https://github.com/jpalmieri/best-search`
3. `cd best-search`
4. `zat package`
5. Upload and install the created `.zip` file in `tmp/` as a private app in your Zendesk

### Helpful docs

[Zendesk App Tools documentation](https://developer.zendesk.com/apps/docs/agent/tools)

[Uploading and installing a Zendesk app](https://support.zendesk.com/hc/en-us/articles/203691296--ZAF-v1-Building-your-first-Zendesk-app-Part-5-Installing-the-app-in-your-Zendesk)

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Added some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

Please submit bug reports to Issues.
