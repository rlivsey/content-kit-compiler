#!/bin/bash

if [ ! -d ./dist ]; then
  echo "CKC Building for prepublish"
  npm run build
else
  echo "CKC Skipping prepublish build because ./dist exists"
fi
