#!/bin/bash

set -e -x

# This script basically follows the instructions to download an old version of Chromium: https://www.chromium.org/getting-involved/download-chromium
# 1) It retrieves the current stable version number from https://www.chromium.org/developers/calendar (via the https://omahaproxy.appspot.com/all file), e.g. 359700 for Chromium 48.
# 2) It checks the Travis cache for this specific version
# 3) If not available, it downloads and caches it, using the "decrement commit number" trick.

#Build version read from the OmahaProxy CSV Viewer at https://www.chromium.org/developers/calendar
#Let's use Chromium 47 as the default (352221 build number), and try to grab the latest stable from https://omahaproxy.appspot.com/all
CHROMIUM_VERSION=352221
TMP=$(curl -s "https://omahaproxy.appspot.com/all") || true
oldIFS="$IFS"
IFS='
'
IFS=${IFS:0:1}
lines=( $TMP )
IFS=','
for line in "${lines[@]}"
  do
    lineArray=($line);
    if [ "${lineArray[0]}" = "linux" ] && [ "${lineArray[1]}" = "stable" ] ; then
      CHROMIUM_VERSION="${lineArray[7]}"
    fi
done
IFS="$oldIFS"

CHROMIUM_DIR=$HOME/.chrome/chromium
CHROMIUM_BIN=$CHROMIUM_DIR/chrome-linux/chrome
CHROMIUM_VERSION_FILE=$CHROMIUM_DIR/VERSION
CHROMIUM_LINK='https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Linux_x64%2F352221%2Fchrome-linux.zip?generation=1443837963036000&alt=media'

EXISTING_VERSION=""
if [[ -f $CHROMIUM_VERSION_FILE && -x $CHROMIUM_BIN ]]; then
  EXISTING_VERSION=`cat $CHROMIUM_VERSION_FILE`
  echo Found cached Chromium version: ${EXISTING_VERSION}
fi

if [[ "$EXISTING_VERSION" != "$CHROMIUM_VERSION" ]]; then
  echo Downloading Chromium version: ${CHROMIUM_VERSION}
  rm -fR $CHROMIUM_DIR
  mkdir -p $CHROMIUM_DIR

  NEXT=$CHROMIUM_VERSION
  FILE="chrome-linux.zip"
  STATUS=404
  while [[ $STATUS == 404 && $NEXT -ge 0 ]]
  do
    echo Fetch Chromium version: ${NEXT}
    STATUS=$(curl "${CHROMIUM_LINK}" -s -w %{http_code} --create-dirs -o $FILE) || true
    NEXT=$[$NEXT-1]
  done

  unzip $FILE -d $CHROMIUM_DIR
  rm $FILE
  echo $CHROMIUM_VERSION > $CHROMIUM_VERSION_FILE
fi


