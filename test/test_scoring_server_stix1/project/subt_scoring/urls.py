"""subt_scoring URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken import views as rest_auth_views

from subt_scoring import views

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'tokens', views.TokenViewSet)
router.register(r'users', views.UserViewSet)
urlpatterns = [
    #url(r'^admin/', admin.site.urls),
    url(r'^api/', include(router.urls)),
    url(r'api/status/$', views.StatusView.as_view(), name="status"),
    url(r'api/artifact_reports/$', views.ArtifactReportView.as_view(), name="artifact_report"),
    url(r'^state/update/$', views.StateUpdateView.as_view()),
    url(r'^map/update/$', views.MapUpdateView.as_view()),
    url(r'^api-token-auth/', rest_auth_views.obtain_auth_token),
]
