# Generated by Django 3.2.16 on 2023-02-26 10:45

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('request', '0004_auto_20230226_0952'),
    ]

    operations = [
        migrations.AddField(
            model_name='request',
            name='bioinformatician',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='request_bioinformatician', to=settings.AUTH_USER_MODEL, verbose_name='Bioinformatician'),
        ),
    ]
