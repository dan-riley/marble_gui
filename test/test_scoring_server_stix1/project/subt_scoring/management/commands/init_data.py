#!/usr/bin/env python

# in Django 1.8 this changes to argparse
import os
from optparse import make_option
import json

from django.core.management.base import BaseCommand, CommandError
from django.core import management
from django.contrib.auth.models import User
from subt_scoring.models import Token



class Command(BaseCommand):
    def handle(self, *args, **options):
        # User
        user = User.objects.get_or_create(username="subt", password="subt")
        subt_user_token = Token.objects.create(user=user[0])
