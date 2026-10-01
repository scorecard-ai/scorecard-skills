# Import test cases from files

## Convert to `testcases.jsonl`

Convert the user's file to `scorecard/testcases.jsonl`, one flat JSON object per line, then use the normal test set script. This keeps one upload path and makes the data reviewable in git.

| Source | How |
|---|---|
| CSV / TSV | Python `csv.DictReader` (use `delimiter="\t"` for TSV), or `papaparse` in TS. Keep the header names as field names. |
| JSON array | One line per element. |
| JSONL | Use as is, after checking field names. |
| Excel / Google Sheets | Ask the user to export CSV. |
| Logged conversations | Pull the user message into the input field and the good reply (if known) into the expected field. Drop personal data. |

Then:

1. Map columns to schema fields. Rename columns to match the agent's input names.
2. Drop rows with an empty required field, and tell the user how many you dropped.
3. Convert numbers and booleans from strings when the schema says so.
4. Remove exact duplicates.

## Upload in the UI instead

The Scorecard UI imports CSV, TSV, JSON, and JSONL files directly: open the test set, then **Import**. Columns are matched to fields automatically. Rows with an existing test case ID update that case instead of adding a copy. Suggest this when the user prefers not to keep test data in the repo.
