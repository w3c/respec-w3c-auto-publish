#!/usr/bin/env bash
# This script updates specberus rules and messages.
set -ex
cd specberus
curl -O https://raw.githubusercontent.com/w3c/specberus/master/lib/rules.json
curl -O https://raw.githubusercontent.com/w3c/specberus/master/lib/l10n-en_GB.js
