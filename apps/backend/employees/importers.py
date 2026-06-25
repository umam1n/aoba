"""
AOBA CSV Import Engine

Handles bulk ingestion of employee data from CSV files with:
- Schema validation (required columns, data type checks)
- Duplicate detection via employee_code per company
- Row-level error collection stored in IngestionLog
- Support for 4 CSV types: employees, compensation_history, role_history, leave_records
"""
import csv
import hashlib
import io
import logging
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from django.db import transaction

from employees.models import (
    Employee,
    CompensationHistory,
    RoleHistory,
    LeaveRecord,
)

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────
# Schema definitions per CSV type
# ──────────────────────────────────────────────────────────────

CSV_SCHEMAS = {
    'employees': {
        'required': [
            'employee_code', 'full_name', 'department', 'role_title',
            'role_level', 'hire_date',
        ],
        'optional': [
            'email', 'division', 'manager_code', 'exit_date', 'exit_type',
            'current_salary', 'employment_status',
        ],
    },
    'compensation_history': {
        'required': ['employee_code', 'salary', 'effective_date'],
        'optional': ['change_reason'],
    },
    'role_history': {
        'required': ['employee_code', 'role_title', 'role_level', 'effective_date', 'change_type'],
        'optional': [],
    },
    'leave_records': {
        'required': ['employee_code', 'leave_type', 'start_date', 'end_date', 'days_count'],
        'optional': [],
    },
}


def compute_file_hash(file_content: bytes) -> str:
    """Compute SHA-256 hash of file content for deduplication."""
    return hashlib.sha256(file_content).hexdigest()


def _parse_date(value: str, field_name: str) -> date:
    """
    Parse a date string, trying ISO 8601 first then common formats.
    Raises ValueError with a descriptive message on failure.
    """
    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y'):
        try:
            return datetime.strptime(value.strip(), fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Invalid date format for '{field_name}': '{value}'. Use YYYY-MM-DD.")


def _parse_decimal(value: str, field_name: str) -> Decimal:
    """Parse a decimal string, stripping currency symbols and commas."""
    cleaned = value.strip().replace(',', '').replace('$', '').replace('Rp', '').replace('.', '', value.count('.') - 1 if value.count('.') > 1 else 0)
    try:
        return Decimal(cleaned)
    except (InvalidOperation, ValueError):
        raise ValueError(f"Invalid number for '{field_name}': '{value}'")


def _parse_int(value: str, field_name: str) -> int:
    """Parse an integer string."""
    try:
        return int(value.strip())
    except ValueError:
        raise ValueError(f"Invalid integer for '{field_name}': '{value}'")


def validate_schema(headers: list, file_type: str) -> list:
    """
    Validate CSV headers against the expected schema.
    Returns list of error messages (empty = valid).
    """
    schema = CSV_SCHEMAS.get(file_type)
    if not schema:
        return [f"Unknown file_type: '{file_type}'. Must be one of: {list(CSV_SCHEMAS.keys())}"]

    errors = []
    normalised_headers = [h.strip().lower() for h in headers]
    required = schema['required']

    for col in required:
        if col not in normalised_headers:
            errors.append(f"Missing required column: '{col}'")

    return errors


def import_employees_csv(company, file_content: bytes, ingestion_log):
    """
    Import employee records from CSV content.

    Duplicate detection: if an employee_code already exists for this company,
    the row is updated (upsert) rather than creating a duplicate.

    Args:
        company: Company instance (tenant)
        file_content: Raw CSV bytes
        ingestion_log: IngestionLog instance to record progress/errors

    Returns:
        dict with 'imported', 'skipped', 'errors' counts
    """
    errors = []
    imported = 0
    skipped = 0

    try:
        text = file_content.decode('utf-8-sig')  # Handle BOM
    except UnicodeDecodeError:
        text = file_content.decode('latin-1')

    reader = csv.DictReader(io.StringIO(text))
    headers = reader.fieldnames or []

    # Validate schema
    schema_errors = validate_schema(headers, 'employees')
    if schema_errors:
        ingestion_log.errors = [{'row': 0, 'errors': schema_errors}]
        ingestion_log.status = 'failed'
        ingestion_log.save()
        return {'imported': 0, 'skipped': 0, 'errors': schema_errors}

    # Normalise headers
    reader.fieldnames = [h.strip().lower() for h in headers]

    # Pre-fetch existing employees for duplicate detection
    existing_codes = set(
        Employee.objects.filter(company=company)
        .values_list('employee_code', flat=True)
    )

    rows = list(reader)
    ingestion_log.rows_total = len(rows)
    ingestion_log.status = 'processing'
    ingestion_log.save()

    for row_num, row in enumerate(rows, start=2):  # Row 1 is header
        row_errors = []

        # Required field presence
        employee_code = row.get('employee_code', '').strip()
        if not employee_code:
            row_errors.append("Missing employee_code")
            errors.append({'row': row_num, 'errors': row_errors})
            skipped += 1
            continue

        # Parse dates
        try:
            hire_date = _parse_date(row.get('hire_date', ''), 'hire_date')
        except ValueError as e:
            row_errors.append(str(e))
            hire_date = None

        exit_date = None
        if row.get('exit_date', '').strip():
            try:
                exit_date = _parse_date(row['exit_date'], 'exit_date')
            except ValueError as e:
                row_errors.append(str(e))

        # Parse salary
        current_salary = None
        if row.get('current_salary', '').strip():
            try:
                current_salary = _parse_decimal(row['current_salary'], 'current_salary')
            except ValueError as e:
                row_errors.append(str(e))

        if row_errors:
            errors.append({'row': row_num, 'errors': row_errors})
            skipped += 1
            continue

        # Build employee data
        employee_data = {
            'full_name': row.get('full_name', '').strip(),
            'email': row.get('email', '').strip(),
            'department': row.get('department', '').strip(),
            'division': row.get('division', '').strip(),
            'role_title': row.get('role_title', '').strip(),
            'role_level': row.get('role_level', '').strip(),
            'hire_date': hire_date,
            'exit_date': exit_date,
            'exit_type': row.get('exit_type', '').strip(),
            'current_salary': current_salary,
            'employment_status': row.get('employment_status', 'active').strip() or 'active',
        }

        try:
            if employee_code in existing_codes:
                # Update existing record
                Employee.objects.filter(
                    company=company, employee_code=employee_code,
                ).update(**employee_data)
            else:
                Employee.objects.create(
                    company=company,
                    employee_code=employee_code,
                    **employee_data,
                )
                existing_codes.add(employee_code)
            imported += 1
        except Exception as e:
            row_errors.append(f"Database error: {str(e)}")
            errors.append({'row': row_num, 'errors': row_errors})
            skipped += 1

    # Resolve manager references in a second pass
    _resolve_manager_references(company, rows)

    return {'imported': imported, 'skipped': skipped, 'errors': errors}


def _resolve_manager_references(company, rows):
    """
    Second pass: resolve manager_code fields to actual Employee FKs.
    Runs after all employees are created to handle forward references.
    """
    employee_map = {
        emp.employee_code: emp
        for emp in Employee.objects.filter(company=company)
    }

    for row in rows:
        manager_code = row.get('manager_code', '').strip()
        employee_code = row.get('employee_code', '').strip()

        if manager_code and employee_code in employee_map and manager_code in employee_map:
            employee = employee_map[employee_code]
            manager = employee_map[manager_code]
            if employee.manager_id != manager.pk:
                employee.manager = manager
                employee.save(update_fields=['manager'])


def import_compensation_history_csv(company, file_content: bytes, ingestion_log):
    """Import compensation history records from CSV."""
    errors = []
    imported = 0
    skipped = 0

    try:
        text = file_content.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = file_content.decode('latin-1')

    reader = csv.DictReader(io.StringIO(text))
    headers = reader.fieldnames or []

    schema_errors = validate_schema(headers, 'compensation_history')
    if schema_errors:
        ingestion_log.errors = [{'row': 0, 'errors': schema_errors}]
        ingestion_log.status = 'failed'
        ingestion_log.save()
        return {'imported': 0, 'skipped': 0, 'errors': schema_errors}

    reader.fieldnames = [h.strip().lower() for h in headers]

    # Pre-fetch employee code → ID map
    employee_map = dict(
        Employee.objects.filter(company=company)
        .values_list('employee_code', 'pk')
    )

    rows = list(reader)
    ingestion_log.rows_total = len(rows)
    ingestion_log.status = 'processing'
    ingestion_log.save()

    batch = []

    for row_num, row in enumerate(rows, start=2):
        row_errors = []
        employee_code = row.get('employee_code', '').strip()

        if employee_code not in employee_map:
            row_errors.append(f"Employee not found: '{employee_code}'")
            errors.append({'row': row_num, 'errors': row_errors})
            skipped += 1
            continue

        try:
            salary = _parse_decimal(row.get('salary', ''), 'salary')
        except ValueError as e:
            row_errors.append(str(e))

        try:
            effective_date = _parse_date(row.get('effective_date', ''), 'effective_date')
        except ValueError as e:
            row_errors.append(str(e))

        if row_errors:
            errors.append({'row': row_num, 'errors': row_errors})
            skipped += 1
            continue

        batch.append(CompensationHistory(
            employee_id=employee_map[employee_code],
            company=company,
            salary=salary,
            effective_date=effective_date,
            change_reason=row.get('change_reason', '').strip(),
        ))
        imported += 1

    if batch:
        CompensationHistory.objects.bulk_create(batch, batch_size=500)

    return {'imported': imported, 'skipped': skipped, 'errors': errors}


def import_role_history_csv(company, file_content: bytes, ingestion_log):
    """Import role history records from CSV."""
    errors = []
    imported = 0
    skipped = 0

    try:
        text = file_content.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = file_content.decode('latin-1')

    reader = csv.DictReader(io.StringIO(text))
    headers = reader.fieldnames or []

    schema_errors = validate_schema(headers, 'role_history')
    if schema_errors:
        ingestion_log.errors = [{'row': 0, 'errors': schema_errors}]
        ingestion_log.status = 'failed'
        ingestion_log.save()
        return {'imported': 0, 'skipped': 0, 'errors': schema_errors}

    reader.fieldnames = [h.strip().lower() for h in headers]

    employee_map = dict(
        Employee.objects.filter(company=company)
        .values_list('employee_code', 'pk')
    )

    rows = list(reader)
    ingestion_log.rows_total = len(rows)
    ingestion_log.status = 'processing'
    ingestion_log.save()

    valid_change_types = {'promotion', 'lateral', 'demotion', 'hire'}
    batch = []

    for row_num, row in enumerate(rows, start=2):
        row_errors = []
        employee_code = row.get('employee_code', '').strip()

        if employee_code not in employee_map:
            row_errors.append(f"Employee not found: '{employee_code}'")
            errors.append({'row': row_num, 'errors': row_errors})
            skipped += 1
            continue

        change_type = row.get('change_type', '').strip().lower()
        if change_type not in valid_change_types:
            row_errors.append(
                f"Invalid change_type: '{change_type}'. "
                f"Must be one of: {valid_change_types}"
            )

        try:
            effective_date = _parse_date(row.get('effective_date', ''), 'effective_date')
        except ValueError as e:
            row_errors.append(str(e))

        if row_errors:
            errors.append({'row': row_num, 'errors': row_errors})
            skipped += 1
            continue

        batch.append(RoleHistory(
            employee_id=employee_map[employee_code],
            company=company,
            role_title=row.get('role_title', '').strip(),
            role_level=row.get('role_level', '').strip(),
            effective_date=effective_date,
            change_type=change_type,
        ))
        imported += 1

    if batch:
        RoleHistory.objects.bulk_create(batch, batch_size=500)

    return {'imported': imported, 'skipped': skipped, 'errors': errors}


def import_leave_records_csv(company, file_content: bytes, ingestion_log):
    """Import leave records from CSV."""
    errors = []
    imported = 0
    skipped = 0

    try:
        text = file_content.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = file_content.decode('latin-1')

    reader = csv.DictReader(io.StringIO(text))
    headers = reader.fieldnames or []

    schema_errors = validate_schema(headers, 'leave_records')
    if schema_errors:
        ingestion_log.errors = [{'row': 0, 'errors': schema_errors}]
        ingestion_log.status = 'failed'
        ingestion_log.save()
        return {'imported': 0, 'skipped': 0, 'errors': schema_errors}

    reader.fieldnames = [h.strip().lower() for h in headers]

    employee_map = dict(
        Employee.objects.filter(company=company)
        .values_list('employee_code', 'pk')
    )

    rows = list(reader)
    ingestion_log.rows_total = len(rows)
    ingestion_log.status = 'processing'
    ingestion_log.save()

    valid_leave_types = {'sick', 'personal', 'annual', 'unpaid'}
    batch = []

    for row_num, row in enumerate(rows, start=2):
        row_errors = []
        employee_code = row.get('employee_code', '').strip()

        if employee_code not in employee_map:
            row_errors.append(f"Employee not found: '{employee_code}'")
            errors.append({'row': row_num, 'errors': row_errors})
            skipped += 1
            continue

        leave_type = row.get('leave_type', '').strip().lower()
        if leave_type not in valid_leave_types:
            row_errors.append(
                f"Invalid leave_type: '{leave_type}'. "
                f"Must be one of: {valid_leave_types}"
            )

        try:
            start_date = _parse_date(row.get('start_date', ''), 'start_date')
        except ValueError as e:
            row_errors.append(str(e))

        try:
            end_date = _parse_date(row.get('end_date', ''), 'end_date')
        except ValueError as e:
            row_errors.append(str(e))

        try:
            days_count = _parse_int(row.get('days_count', ''), 'days_count')
        except ValueError as e:
            row_errors.append(str(e))

        if row_errors:
            errors.append({'row': row_num, 'errors': row_errors})
            skipped += 1
            continue

        batch.append(LeaveRecord(
            employee_id=employee_map[employee_code],
            company=company,
            leave_type=leave_type,
            start_date=start_date,
            end_date=end_date,
            days_count=days_count,
        ))
        imported += 1

    if batch:
        LeaveRecord.objects.bulk_create(batch, batch_size=500)

    return {'imported': imported, 'skipped': skipped, 'errors': errors}


# ──────────────────────────────────────────────────────────────
# Dispatcher
# ──────────────────────────────────────────────────────────────

IMPORT_HANDLERS = {
    'employees': import_employees_csv,
    'compensation_history': import_compensation_history_csv,
    'role_history': import_role_history_csv,
    'leave_records': import_leave_records_csv,
}


def run_import(company, file_type: str, file_content: bytes, ingestion_log):
    """
    Main entry point for CSV imports. Dispatches to the correct
    handler based on file_type and updates the IngestionLog.

    Args:
        company: Company instance
        file_type: One of 'employees', 'compensation_history', 'role_history', 'leave_records'
        file_content: Raw CSV bytes
        ingestion_log: IngestionLog instance

    Returns:
        dict with import results
    """
    handler = IMPORT_HANDLERS.get(file_type)
    if not handler:
        ingestion_log.status = 'failed'
        ingestion_log.errors = [
            {'row': 0, 'errors': [f"Unknown file_type: '{file_type}'"]}
        ]
        ingestion_log.save()
        return {'imported': 0, 'skipped': 0, 'errors': ingestion_log.errors}

    try:
        with transaction.atomic():
            result = handler(company, file_content, ingestion_log)
    except Exception as e:
        logger.exception(f"Import failed for {file_type}: {e}")
        ingestion_log.status = 'failed'
        ingestion_log.errors = [{'row': 0, 'errors': [f"Import failed: {str(e)}"]}]
        ingestion_log.save()
        return {'imported': 0, 'skipped': 0, 'errors': ingestion_log.errors}

    # Update ingestion log with results
    from django.utils import timezone

    ingestion_log.rows_imported = result['imported']
    ingestion_log.rows_skipped = result['skipped']
    ingestion_log.errors = result['errors']
    ingestion_log.status = 'completed' if not result['errors'] else 'completed_with_errors'
    ingestion_log.completed_at = timezone.now()
    ingestion_log.save()

    return result
