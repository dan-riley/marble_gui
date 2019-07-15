import cbor2
from rest_framework.parsers import BaseParser
from django.conf import settings


class CBORParser(BaseParser):
    """
    CBOR parser.
    """
    media_type = 'application/cbor'

    def parse(self, stream, media_type=None, parser_context=None):
        """
        Parses the incoming bytestream as CBOR and returns the resulting data.
        """
        return cbor2.load(stream)
