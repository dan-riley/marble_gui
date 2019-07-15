import subprocess
import os

import django
from django.core import management
from django_extensions.management.commands import reset_db


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "subt_scoring.settings")
    django.setup()
    management.call_command('reset_db', interactive=False)
    management.call_command('collectstatic', interactive=False)
    management.call_command('makemigrations', 'subt_scoring', interactive=False)
    management.call_command('migrate', interactive=False)
    management.call_command('init_data', interactive=False)
    subprocess.call(["gunicorn", "subt_scoring.wsgi", "--bind", ":8000", "--workers", "5"])