#!/bin/bash
# Send email via Outlook MCP CLI
# Usage: ./send-email.sh /path/to/input.json

INPUT_FILE="$1"

if [ ! -f "$INPUT_FILE" ]; then
  echo "ERROR: Input file not found: $INPUT_FILE"
  exit 1
fi

INPUT_JSON=$(cat "$INPUT_FILE")
manus-mcp-cli tool call outlook_send_messages --server outlook-mail --input "$INPUT_JSON"
EXIT_CODE=$?

# Clean up the input file
rm -f "$INPUT_FILE"

exit $EXIT_CODE
