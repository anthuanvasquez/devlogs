#!/bin/bash

# Define the JSON file path
JSON_FILE="projects.json"

# Check if the JSON file exists
if [ ! -f "$JSON_FILE" ]; then
  echo "Error: $JSON_FILE not found."
  exit 1
fi

# Read projects from JSON using jq and iterate
jq -r '.[]' "$JSON_FILE" | while read -r PROJ; do
  if [ -d "$PROJ/.git" ]; then
    cd "$PROJ"
    # Execute global command (silencing errors if no commits)
    devlogs || true
  else
    echo "Warning: $PROJ is not a git repository or does not exist."
  fi
done