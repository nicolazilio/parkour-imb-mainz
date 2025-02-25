# Generated by Django 3.2.16 on 2023-10-13 12:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sample', '0007_auto_20230929_1053'),
    ]

    operations = [
        migrations.AlterField(
            model_name='nucleicacidtype',
            name='type',
            field=models.CharField(choices=[('DNA', 'DNA'), ('RNA', 'RNA')], default='DNA', help_text='Does not apply if single cell is selected', max_length=3, verbose_name='Type'),
        ),
    ]
