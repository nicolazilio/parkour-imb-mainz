from django.db.models import F, Func, Value
from django.db.models.signals import m2m_changed
from django.dispatch import receiver

from index_generator.models import Pool

from .models import LibraryPreparation


@receiver(m2m_changed, sender=Pool.samples.through)
def update_samples(sender, instance, action, **kwargs):
    """
    When a sample is added to a pool, set its is_pooled and is_converted
    to True, update the barcode, and for each sample in the pool create a
    LibraryPreparation object.
    """
    if action == "post_add":
        instance.samples.all().update(
            is_pooled=True,
            is_converted=True,
            barcode=Func(
                F("barcode"),
                Value("S"),
                Value("L"),
                function="replace",
            ),
        )

        # For samples that already have a LibraryPreparation object,
        # push them through to the pooling stage, this should be a
        # re-pooling event (?)
        instance.samples.filter(librarypreparation__isnull=False).update(status=3)

        # Only create a LibraryPreparation object for a sample if it does
        # not already have one attached to it
        LibraryPreparation.objects.bulk_create(
            [
                LibraryPreparation(sample=sample)
                for sample in instance.samples.filter(librarypreparation__isnull=True)
            ]
        )
