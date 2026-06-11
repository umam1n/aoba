"""
AOBA PII Field Encryption

Provides Fernet-based symmetric encryption for sensitive employee fields
(full_name, email, current_salary) to comply with UU PDP (Law No. 27/2022).

Uses Django's FIELD_ENCRYPTION_KEY setting as the Fernet key.
"""
import base64
import logging

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.db import models

logger = logging.getLogger(__name__)


def _get_fernet():
    """Get Fernet instance from settings key."""
    key = settings.FIELD_ENCRYPTION_KEY
    if not key:
        logger.warning(
            "FIELD_ENCRYPTION_KEY not set — encrypted fields will store plaintext. "
            "This is only acceptable in local development."
        )
        return None
    # Ensure key is valid Fernet key (44-char base64)
    try:
        return Fernet(key.encode() if isinstance(key, str) else key)
    except Exception as e:
        logger.error(f"Invalid FIELD_ENCRYPTION_KEY: {e}")
        return None


class EncryptedCharField(models.CharField):
    """
    CharField that transparently encrypts data at rest using Fernet.
    Data is encrypted before saving and decrypted on retrieval.

    Usage:
        full_name = EncryptedCharField(max_length=255)
    """

    def __init__(self, *args, **kwargs):
        # Encrypted data is longer than plaintext — ensure max_length is sufficient
        kwargs['max_length'] = kwargs.get('max_length', 255) + 200
        super().__init__(*args, **kwargs)

    def get_prep_value(self, value):
        """Encrypt before saving to database."""
        if value is None or value == '':
            return value
        fernet = _get_fernet()
        if fernet is None:
            return value  # Fallback: store plaintext in dev
        try:
            encrypted = fernet.encrypt(value.encode('utf-8'))
            return encrypted.decode('utf-8')
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            return value

    def from_db_value(self, value, expression, connection):
        """Decrypt after reading from database."""
        if value is None or value == '':
            return value
        fernet = _get_fernet()
        if fernet is None:
            return value
        try:
            decrypted = fernet.decrypt(value.encode('utf-8'))
            return decrypted.decode('utf-8')
        except InvalidToken:
            # Value might be plaintext (from before encryption was enabled)
            return value
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return value

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        # Adjust max_length back for migrations
        if 'max_length' in kwargs:
            kwargs['max_length'] = kwargs['max_length'] - 200
        return name, path, args, kwargs


class EncryptedEmailField(EncryptedCharField):
    """
    EmailField variant with Fernet encryption at rest.
    Validates as email in forms but stores encrypted in DB.
    """

    def formfield(self, **kwargs):
        from django.forms import EmailField as EmailFormField
        return super().formfield(**{
            'form_class': EmailFormField,
            **kwargs,
        })


class EncryptedDecimalField(models.DecimalField):
    """
    DecimalField that stores encrypted values as text.
    Used for salary fields to comply with PII protection requirements.
    """

    def get_prep_value(self, value):
        if value is None:
            return value
        fernet = _get_fernet()
        if fernet is None:
            return str(value)
        try:
            encrypted = fernet.encrypt(str(value).encode('utf-8'))
            return encrypted.decode('utf-8')
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            return str(value)

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        fernet = _get_fernet()
        if fernet is None:
            try:
                from decimal import Decimal
                return Decimal(value)
            except Exception:
                return value
        try:
            decrypted = fernet.decrypt(value.encode('utf-8')).decode('utf-8')
            from decimal import Decimal
            return Decimal(decrypted)
        except InvalidToken:
            from decimal import Decimal
            try:
                return Decimal(value)
            except Exception:
                return value
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return value

    def get_internal_type(self):
        # Store as text in DB since encrypted data is a string
        return 'TextField'
