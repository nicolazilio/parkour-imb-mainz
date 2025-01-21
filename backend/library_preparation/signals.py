from django.db.models import F, Func, Value
from django.db.models.signals import m2m_changed
from django.dispatch import receiver

from index_generator.models import Pool
from pooling.models import Pooling

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
        # I assume that this represents a re-pooling event (?),
        # therefore push them through to the pooling stage and create
        # a new Pooling object
        existing_samples = instance.samples.filter(librarypreparation__isnull=False)
        existing_samples.update(status=3)
        Pooling.objects.bulk_create(
            [
                Pooling(sample=sample, pool=instance)
                for sample in existing_samples.exclude(pooling__pool=instance)
            ]
        )

        # For samples that do not have a LibraryPreparation object, it
        # should be the first time they go through Parkour, therefore
        # create a LibraryPreparation object
        LibraryPreparation.objects.bulk_create(
            [
                LibraryPreparation(sample=sample)
                for sample in instance.samples.filter(librarypreparation__isnull=True)
            ]
        )
