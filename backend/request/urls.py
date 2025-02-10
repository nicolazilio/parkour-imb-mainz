from django.urls import path
from request.views import approve_request_redirect, export_request, import_request

urlpatterns = [
    path(
        "approve_request_redirect",
        approve_request_redirect,
        name="approve_request_redirect",
    ),
    path("export_request/", export_request, name="export_request"),
    path("import_request/", import_request, name="import_request"),
]
