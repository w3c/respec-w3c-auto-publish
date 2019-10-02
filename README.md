# ReSpec W3C Auto-Publish (GitHub Action)

This action lets you validate a ReSpec based spec and publish them to /TR/

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
      - uses: sidvishnoi/respec-w3c-auto-publish # use the action
        with:
          ECHIDNA_TOKEN: ${{ secrets.ECHIDNA_TOKEN }}
          GH_USER: ${{ secrets.GH_USER }}     # optional
          GH_TOKEN: ${{ secrets.GH_TOKEN }}   # optional
          ECHIDNA_MANIFEST_URL: "https://w3c.github.io/gamepad/W3CTRMANIFEST"
          WG_DECISION_URL: "https://lists.w3.org/Archives/Public/public-webapps/2014JulSep/0627.html"
          CC: "foo@bar.com,bar@foo.com"
          PUBLISH: ${{ github.event_name != 'pull_request' }} # publish only on merge (default: false)
```
