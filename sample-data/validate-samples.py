#!/usr/bin/env python3
"""
Validate all sample data files for common issues
"""
import csv
import os
from datetime import datetime
from pathlib import Path

# Valid item types
VALID_TYPES = {'task', 'milestone', 'release', 'meeting'}

# Date formats to try
DATE_FORMATS = [
    '%Y-%m-%d',      # ISO: 2025-06-01
    '%m/%d/%Y',      # US slash: 6/1/2025
    '%m-%d-%Y',      # US dash: 6-1-2025
    '%-m/%-d/%Y',    # US slash no padding: 6/1/2025
    '%m/%d/%Y',      # US slash padded: 06/01/2025
]

def validate_date(date_str):
    """Try to parse a date string"""
    if not date_str or date_str.strip() == '':
        return True, None  # Empty is OK for optional fields

    for fmt in DATE_FORMATS:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            return True, dt
        except ValueError:
            continue

    return False, None

def validate_csv_file(filepath):
    """Validate a single CSV file"""
    errors = []
    warnings = []
    row_count = 0

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames

            if not headers:
                errors.append("No headers found")
                return errors, warnings, 0

            for idx, row in enumerate(reader, start=2):  # Start at 2 (header is 1)
                row_count += 1

                # Check for 'type' field if present
                if 'type' in row or 'Type' in row:
                    type_field = row.get('type', row.get('Type', '')).strip().lower()
                    if type_field and type_field not in VALID_TYPES:
                        errors.append(f"Row {idx}: Invalid type '{type_field}' (must be task/milestone/release/meeting)")

                # Check date fields
                date_fields = [
                    ('start_date', 'Start Date', 'Start', 'start'),
                    ('end_date', 'End Date', 'Finish', 'end', 'Due Date'),
                    ('Date', 'date')
                ]

                for date_field_options in date_fields:
                    for field_name in date_field_options:
                        if field_name in row:
                            date_val = row[field_name]
                            if date_val and date_val.strip():
                                is_valid, parsed = validate_date(date_val)
                                if not is_valid:
                                    errors.append(f"Row {idx}: Invalid date format '{date_val}' in column '{field_name}'")
                            break  # Only check first matching field

    except csv.Error as e:
        errors.append(f"CSV parsing error: {e}")
    except Exception as e:
        errors.append(f"Unexpected error: {e}")

    return errors, warnings, row_count

def main():
    """Validate all CSV files in sample-data directory"""
    sample_data_dir = Path(__file__).parent

    print("🔍 Validating Sample Data Files\n")
    print("=" * 70)

    total_files = 0
    total_errors = 0
    total_warnings = 0
    total_rows = 0

    # Find all CSV files recursively
    csv_files = sorted(sample_data_dir.rglob('*.csv'))

    for csv_file in csv_files:
        rel_path = csv_file.relative_to(sample_data_dir)
        total_files += 1

        errors, warnings, row_count = validate_csv_file(csv_file)
        total_rows += row_count

        if errors or warnings:
            print(f"\n📄 {rel_path}")
            print(f"   Rows: {row_count}")

            if errors:
                total_errors += len(errors)
                print(f"   ❌ Errors ({len(errors)}):")
                for error in errors:
                    print(f"      - {error}")

            if warnings:
                total_warnings += len(warnings)
                print(f"   ⚠️  Warnings ({len(warnings)}):")
                for warning in warnings:
                    print(f"      - {warning}")
        else:
            print(f"✅ {str(rel_path):<50} ({row_count:>3} rows)")

    print("\n" + "=" * 70)
    print(f"\n📊 Summary:")
    print(f"   Files validated:  {total_files}")
    print(f"   Total data rows:  {total_rows}")
    print(f"   Total errors:     {total_errors}")
    print(f"   Total warnings:   {total_warnings}")

    if total_errors == 0:
        print(f"\n✨ All sample data files are valid!\n")
        return 0
    else:
        print(f"\n❌ Validation failed with {total_errors} errors\n")
        return 1

if __name__ == '__main__':
    exit(main())
