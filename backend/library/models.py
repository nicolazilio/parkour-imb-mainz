from django.db import models
from library_sample_shared.models import GenericLibrarySample
from simple_history.models import HistoricalRecords


class Library(GenericLibrarySample):
    mean_fragment_size = models.PositiveIntegerField(
        "Mean Fragment Size",
        null=True,
        blank=True,
    )

    qpcr_result = models.FloatField("qPCR Result", null=True, blank=True)

    # Quality Control
    qpcr_result_facility = models.FloatField(
        "qPCR Result (facility)",
        null=True,
        blank=True,
    )

    archived = models.BooleanField("Archived", default=False)

    history = HistoricalRecords()

    class Meta:
        verbose_name = "Library"
        verbose_name_plural = "Libraries"
