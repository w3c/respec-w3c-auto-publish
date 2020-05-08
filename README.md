# ReSpec W3C Auto-Publish (GitHub Action)

GitHub action to [validate](https://github.com/marcoscaceres/respec-validator) a [ReSpec](https://github.com/w3c/respec/) document and publish it as a TR using [Echidna](https://github.com/w3c/echidna/).

The document is published only when a PR is merged. Validation is done when a PR is created/updated and merged.

## Inputs
Working Group Chairs and W3C Team members can [request a token](https://www.w3.org/Web/publications/register) directly from the W3C. This can then be saved as `ECHIDNA_TOKEN` in your repository settings under "Secrets". 

![secrets sections, in GitHub settings](https://user-images.githubusercontent.com/870154/81380287-f9579f80-914d-11ea-84bc-5707bff75dba.png)

Please see [action.yml](action.yml)

## Example Usage

Place this file in ".github/workflows/action.yml". 

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
      - uses: w3c/respec-w3c-auto-publish@v1 # use the action
        with:
          ECHIDNA_TOKEN: ${{ secrets.ECHIDNA_TOKEN }}
          ECHIDNA_MANIFEST_URL: "https://w3c.github.io/gamepad/W3CTRMANIFEST"
          WG_DECISION_URL: "https://lists.w3.org/Archives/Public/public-webapps/2014JulSep/0627.html"
          CC: "foo@bar.com,bar@foo.com"
```
