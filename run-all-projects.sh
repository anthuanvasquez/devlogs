#!/bin/bash

JSON_FILE="projects.json"

if [ ! -f "$JSON_FILE" ]; then
  echo "Error: $JSON_FILE not found."
  exit 1
fi

jq -r '.[]' "$JSON_FILE" | while read -r PROJ; do
  if [ -d "$PROJ/.git" ]; then
    cd "$PROJ"
    devlogs || true
  else
    echo "Warning: $PROJ is not a git repository or does not exist."
  fi
done