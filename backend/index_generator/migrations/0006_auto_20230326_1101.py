# Generated by Django 3.2.16 on 2023-03-26 09:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('flowcell', '0005_remove_sequencer_lanes'),
        ('index_generator', '0005_auto_20230308_1753'),
    ]

    operations = [
        migrations.AddField(
            model_name='poolsize',
            name='lanes',
            field=models.PositiveSmallIntegerField(default=1, verbose_name='Number of Lanes'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='poolsize',
            name='size',
            field=models.PositiveSmallIntegerField(verbose_name='Size (in million reads)'),
        ),
        migrations.AddConstraint(
            model_name='poolsize',
            constraint=models.UniqueConstraint(fields=('sequencer', 'size', 'lanes', 'obsolete'), name='unique_pool_size'),
        ),
    ]
