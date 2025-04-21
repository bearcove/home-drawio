#!/bin/bash -eux

cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"

DRAWIO_REPO=~/bearcove/drawio
if [ ! -d "$DRAWIO_REPO" ]; then
  echo "Directory $DRAWIO_REPO does not exist. Please clone the repository first."
  exit 1
fi

rm -rf grapheditor mxgraph styles
cp -r "$DRAWIO_REPO/src/main/webapp/js/grapheditor" .
cp -r "$DRAWIO_REPO/src/main/webapp/mxgraph" .
cp -r "$DRAWIO_REPO/src/main/webapp/styles" .
