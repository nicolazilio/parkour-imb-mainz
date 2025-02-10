import json
import logging

from common.mixins import MultiEditMixin
from common.views import CsrfExemptSessionAuthentication
from django.apps import apps
from django.db.models import Q, Count
from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action

# from rest_framework.decorators import authentication_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from xlwt import Formula, Workbook, XFStyle

from .models import LibraryPreparation
from .serializers import LibraryPreparationSerializer

Request = apps.get_model("request", "Request")
IndexType = apps.get_model("library_sample_shared", "IndexType")
IndexPair = apps.get_model("library_sample_shared", "IndexPair")
IndexI7 = apps.get_model("library_sample_shared", "IndexI7")
IndexI5 = apps.get_model("library_sample_shared", "IndexI5")
Pool = apps.get_model("index_generator", "Pool")
Sample = apps.get_model("sample", "Sample")

logger = logging.getLogger("db")


class LibraryPreparationViewSet(MultiEditMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminUser]
    # authentication_classes = [CsrfExemptSessionAuthentication]
    serializer_class = LibraryPreparationSerializer

    def get_queryset(self):
        return (
            LibraryPreparation.objects.select_related(
                "sample",
                "sample__index_type",
                "sample__library_protocol",
            )
            .prefetch_related(
                "sample__index_type__indices_i7",
                "sample__index_type__indices_i5",
            )
            .annotate(pool_count=Count("sample__pool"))
            .filter(
                # Only show if exactly one pool is associated with a sample
                # The assumption (right?) that any sample that is assigned
                # to more than one pool and has a status of 2 represents a 
                # re-pooling event 
                Q(sample__status=2) | Q(sample__status=-2),
                archived=False,
                pool_count=1
            )
        )

    def get_context(self, queryset):
        sample_ids = queryset.values_list("sample", flat=True)

        # Get Requests
        requests = (
            Request.objects.filter(archived=False, samples__pk__in=sample_ids)
            .distinct()
            .values("name", "samples")
        )
        requests_map = {x["samples"]: x["name"] for x in requests}

        # Get Pools
        pools = (
            Pool.objects.filter(archived=False, samples__pk__in=sample_ids)
            .distinct()
            .values_list("name", "samples")
        )
        pools_map = {}
        for key, val in pools:
            pools_map.setdefault(val, []).append(key)
        pools_map = {k: ', '.join(v) for k, v in pools_map.items()}

        # Get coordinates
        index_types = {x.sample.index_type.pk for x in queryset if x.sample.index_type}
        index_pairs = (
            IndexPair.objects.filter(
                archived=False,
                index_type__pk__in=index_types,
            )
            .select_related("index_type", "index1", "index2")
            .distinct()
        )
        coordinates_map = {
            (
                ip.index_type.pk,
                ip.index1.index_id,
                ip.index2.index_id if ip.index2 else "",
            ): ip.coordinate
            for ip in index_pairs
        }

        return {
            "requests": requests_map,
            "pools": pools_map,
            "coordinates": coordinates_map,
        }

    def list(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        if request.GET.get("asHandler") == "True":
            queryset = queryset.filter(sample__request__handler=request.user)
        serializer = LibraryPreparationSerializer(
            queryset, many=True, context=self.get_context(queryset)
        )
        data = sorted(serializer.data, key=lambda x: x["barcode"][3:])
        return Response(data)

    @action(
        methods=["post"],
        detail=False,
        authentication_classes=[CsrfExemptSessionAuthentication],
    )
    # @authentication_classes((CsrfExemptSessionAuthentication))
    def download_benchtop_protocol(self, request):
        """Generate Benchtop Protocol as XLS file for selected samples."""
        ids = json.loads(request.data.get("ids", "[]"))
        response = HttpResponse(content_type="application/ms-excel")
        request_ids = set()

        queryset = self.filter_queryset(self.get_queryset()).filter(pk__in=ids)
        serializer = LibraryPreparationSerializer(
            queryset, many=True, context=self.get_context(queryset)
        )
        data = sorted(serializer.data, key=lambda x: x["barcode"][3:])

        font_style = XFStyle()
        font_style.alignment.wrap = 1
        font_style_bold = XFStyle()
        font_style_bold.font.bold = True

        wb = Workbook(encoding="utf-8")
        ws = wb.add_sheet("Benchtop Protocol")

        header = [
            "Request ID",
            "Pool ID",
            "Sample",
            "Barcode",
            "Protocol",
            "Concentration Sample (ng/µl)",
            "Starting Amount (ng)",
            "Starting Volume (µl)",
            "Spike-in Description",
            "Spike-in Volume (µl)",
            "µl Sample",
            "µl Buffer",
            "Coordinate",
            "Index I7 ID",
            "Index I5 ID",
        ]

        row_num = 0

        for i, column in enumerate(header):
            ws.write(row_num, i, column, font_style_bold)
            ws.col(i).width = 8000

        for item in data:
            row_num += 1
            row_idx = str(row_num + 1)
            library_preparation_object = (
                LibraryPreparation.objects.filter(archived=False, id=item["pk"])
                .only("starting_amount", "spike_in_description")
                .first()
            )

            request_ids.add(int(item["request_name"].split("_")[0]))

            row = [
                item["request_name"],
                item["pool_name"],
                item["name"],
                item["barcode"],
                item["library_protocol_name"],
                item["concentration_sample"],
                library_preparation_object.starting_amount,
                "",
                library_preparation_object.spike_in_description,
                "",
            ]

            # µl Sample = Starting Amount / Concentration Sample
            formula = f"G{row_idx}/F{row_idx}"
            row.append(Formula(formula))

            # µl Buffer = Starting Volume - Spike-in Volume - µl Sample
            formula = f"H{row_idx}-J{row_idx}-K{row_idx}"
            row.append(Formula(formula))

            row.extend(
                [
                    item["coordinate"],
                    item["index_i7_id"],
                    item["index_i5_id"],
                ]
            )

            for i in range(len(row)):
                ws.write(row_num, i, row[i], font_style)

        request_ids_string = "_".join(str(id) for id in request_ids)
        filename = f"{request_ids_string}_Library_Preparation_Benchtop_Protocol.xls"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        wb.save(response)
        return response
