# ReSpec W3C Auto-Publish (GitHub Action)

GitHub action to [validate](https://github.com/marcoscaceres/respec-validator) a [ReSpec](https://github.com/w3c/respec/) document and publish it as a TR using [Echidna](https://github.com/w3c/echidna/).

The document is published only when a PR is merged. Validation is done when a PR is created/updated and merged.

## Inputs
Working Group Chairs and W3C Team members can [request a token](https://www.w3.org/Web/publications/register) directly from the W3C. This can then be saved as `ECHIDNA_TOKEN` in your repository settings under "Secrets". 

![secrets sections, in GitHub settings](https://user-images.githubusercontent.com/870154/81380287-f9579f80-914d-11ea-84bc-5707bff75dba.png)

Please see [action.yml](action.yml)

## Example Usage

You need two things: 
 1. an "ECHIDNA" [manifest file](https://github.com/w3c/echidna/wiki/Preparing-your-document#manifest-file)
 2. an action.yml file

### ECHIDNA manifest file
The [ECHINA manifest file](https://github.com/w3c/echidna/wiki/Preparing-your-document#manifest-file) needs live at the root of your repository and make sure it's accessible via GitHub pages! 

Just change `your-spec-shortname` to whatever your spec's short name is. 

```
index.html?specStatus=WD&shortName=your-spec-shortname respec
```

### action.yml

Place this file in ".github/workflows/action.yml" (or some other filename if you'd like) and change things as appropriate for your spec.

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
          ECHIDNA_MANIFEST_URL: "https://w3c.github.io/your_spec_repo/ECHIDNA"
          # Please use the URL that's appropriate for your working group!
          WG_DECISION_URL: "https://lists.w3.org/Archives/Public/public-webapps/2014JulSep/0627.html"
          CC: "foo@bar.com,bar@foo.com"
```

#### `WG_DECISION_URL`

Here are some of the possible values of `WG_DECISION_URL` for various working groups:

<dl>
<dt>WebApps WG
<dd>https://lists.w3.org/Archives/Public/public-webapps/2014JulSep/0627.html
<dt>Media Capture WG
<dd>https://lists.w3.org/Archives/Public/public-media-capture/2015Dec/0031.html
<dt>Second Screen WG
<dd>https://lists.w3.org/Archives/Public/public-secondscreen/2015Jun/0096.html
<dt>Web RTC
<dd>https://lists.w3.org/Archives/Public/public-webrtc/2016Mar/0031.html
<dt>Aria
<dd>https://lists.w3.org/Archives/Public/public-html-admin/2015May/0021.html
<dt>Device APIs
<dd>https://lists.w3.org/Archives/Public/public-device-apis/2015Oct/att-0037/minutes-2015-10-15.html#item05
</dl>
