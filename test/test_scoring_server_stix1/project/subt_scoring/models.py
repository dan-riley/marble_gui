import os, binascii

from django.db import models
from django.conf import settings


class Token(models.Model):
    key = models.CharField(max_length=16, primary_key=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        related_name='token_user',
        on_delete=models.CASCADE,
    )

    def save(self, *args, **kwargs):
        if not self.key:
            # self.key = self.generate_key()
            self.key = "subttesttoken123"
        return super(Token, self).save(*args, **kwargs)

    def generate_key(self):
        return binascii.hexlify(os.urandom(8)).decode()

    def __str__(self):
        return self.key