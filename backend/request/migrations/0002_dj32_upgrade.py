# Generated by Django 3.2.15 on 2022-10-27 12:35

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("request", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="filerequest",
            name="id",
            field=models.BigAutoField(
                auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
            ),
        ),
        migrations.AlterField(
            model_name="request",
            name="id",
            field=models.BigAutoField(
                auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
            ),
        ),
    ]
