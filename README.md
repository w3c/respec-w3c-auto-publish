# ReSpec W3C Auto-Publish (GitHub Action)

GitHub action to [validate](https://github.com/marcoscaceres/respec-validator) a [ReSpec](https://github.com/w3c/respec/) document and publish it as a TR using [Echidna](https://github.com/w3c/echidna/).

The document is published only when a PR is merged. Validation is done when a PR is created/updated and merged.

## Inputs

Please see [action.yml](action.yml)

## Example Usage

``` yaml
name: Node CI

on:
  push:
    branches:
      - gh-pages
  pull_request: {}

jobs:
  validate-and-publish:
    name: Validate and Publish
    runs-on: ubuntu-latest # only linux supported at present
    steps:
      - uses: actions/checkout@v1
      - uses: sidvishnoi/respec-w3c-auto-publish@master # use the action
        with:
          ECHIDNA_TOKEN: ${{ secrets.ECHIDNA_TOKEN }}
          ECHIDNA_MANIFEST_URL: "https://w3c.github.io/gamepad/W3CTRMANIFEST"
          WG_DECISION_URL: "https://lists.w3.org/Archives/Public/public-webapps/2014JulSep/0627.html"
          CC: "foo@bar.com,bar@foo.com"
```
