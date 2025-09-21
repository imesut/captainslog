#!/bin/bash -l

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Captains Log - Engage #LLAP
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.icon icons/engage-icon-64p.png

# Documentation:
# @raycast.author Mesut Yılmaz
# @raycast.authorURL https://mesut.me


export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd ~/Documents/Github/captainslog || exit; npm run publish