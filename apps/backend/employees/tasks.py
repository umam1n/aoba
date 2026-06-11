"""
AOBA Employee Celery Tasks

Async tasks for large CSV imports that would exceed HTTP timeout.
"""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=1,
    default_retry_delay=30,
    acks_late=True,
    name='employees.tasks.async_csv_import',
)
def async_csv_import(self, company_id: str, file_type: str, file_content_b64: str, ingestion_log_id: str):
    """
    Celery task for async CSV import of large files.

    Args:
        company_id: UUID string of the Company
        file_type: CSV type ('employees', 'compensation_history', etc.)
        file_content_b64: Base64-encoded file content
        ingestion_log_id: UUID string of the IngestionLog to update
    """
    import base64

    from companies.models import Company
    from analytics.models import IngestionLog
    from employees.importers import run_import

    try:
        company = Company.objects.get(id=company_id)
        ingestion_log = IngestionLog.objects.get(id=ingestion_log_id)

        file_content = base64.b64decode(file_content_b64)

        result = run_import(company, file_type, file_content, ingestion_log)

        logger.info(
            f"Async import completed for company={company_id}, "
            f"type={file_type}: {result['imported']} imported, "
            f"{result['skipped']} skipped"
        )

        return {
            'status': 'completed',
            'imported': result['imported'],
            'skipped': result['skipped'],
            'error_count': len(result['errors']),
        }

    except Company.DoesNotExist:
        logger.error(f"Async import: Company {company_id} not found")
        return {'status': 'failed', 'error': 'Company not found'}

    except IngestionLog.DoesNotExist:
        logger.error(f"Async import: IngestionLog {ingestion_log_id} not found")
        return {'status': 'failed', 'error': 'IngestionLog not found'}

    except Exception as e:
        logger.exception(f"Async import failed: {e}")

        # Update ingestion log on failure
        try:
            ingestion_log = IngestionLog.objects.get(id=ingestion_log_id)
            ingestion_log.status = 'failed'
            ingestion_log.errors = [{'row': 0, 'errors': [str(e)]}]
            ingestion_log.save()
        except Exception:
            pass

        raise self.retry(exc=e)
