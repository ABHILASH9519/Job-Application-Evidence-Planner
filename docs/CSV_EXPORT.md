# CSV export

The workspace provides a spreadsheet-friendly CSV download in addition to the versioned JSON backup.

## Columns

The export contains a `record_type` discriminator and a stable header row. Application rows include company, role, posting URL, dates, pipeline stage, next step, and notes. Evidence rows include their requirement, evidence title, URL, contribution, context, status, and linked application ID.

For linked evidence, the export also includes the linked application's company and role as convenient context. General evidence leaves those fields empty.

## Interoperability and safety

- The file uses UTF-8 with a byte-order mark to improve compatibility with spreadsheet applications.
- Rows use CRLF line endings.
- Fields are quoted, and embedded quotes are doubled according to CSV conventions.
- Text beginning with spreadsheet formula triggers (=, +, -, or @), including triggers after leading whitespace, is prefixed with an apostrophe to reduce formula-injection risk.
- CSV is intended for analysis and sharing. Use the JSON backup to restore records because CSV does not preserve the complete typed record structure or timestamps.

## Privacy

The file is generated in the browser from the current IndexedDB records only after the user selects Export CSV. It is not uploaded to a server.
