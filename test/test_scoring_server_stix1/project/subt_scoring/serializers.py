from rest_framework import serializers
from django.contrib.auth.models import User

import models as dcm

class TokenSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = dcm.Token
        fields = ('user', 'key')


class UserBasicSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('url', 'id', 'username', 'password')
        write_only_fields = ('password',)