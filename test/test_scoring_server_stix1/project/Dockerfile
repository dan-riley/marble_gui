FROM python:2.7

RUN apt update && apt install -y gunicorn redis-server binutils libproj-dev gdal-bin postgresql-client

# RUN mkdir tmp
ADD requirements.txt /tmp/

RUN pip install -r /tmp/requirements.txt
ENV C_FORCE_ROOT=true

