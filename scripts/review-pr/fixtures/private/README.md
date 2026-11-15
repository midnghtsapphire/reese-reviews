Put raw Gmail exports, mbox files, and unsanitized order-history CSVs here.

This folder is gitignored because raw exports can contain order numbers,
addresses, or full email bodies. The importer reads them locally and writes
only a sanitized snapshot (product name, ASIN, order date, image URL, $0 flag).
