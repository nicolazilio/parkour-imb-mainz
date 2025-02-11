import datetime
import math

import pandas as pd
from dateutil.relativedelta import relativedelta
from django.apps import apps
from django.conf import settings
from django.db.models import Min, Prefetch, Q
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from month import Month
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from xlwt import Workbook, XFStyle

from common.models import Organization
from common.views import CsrfExemptSessionAuthentication

from .models import (
    FixedCosts,
    InvoicingReport,
    LibraryPreparationCosts,
    SequencingCosts,
)
from .serializers import (
    FixedCostsSerializer,
    InvoicingSerializer,
    LibraryPreparationCostsSerializer,
    SequencingCostsSerializer,
)

Request = apps.get_model("request", "Request")
ReadLength = apps.get_model("library_sample_shared", "ReadLength")
LibraryProtocol = apps.get_model("library_sample_shared", "LibraryProtocol")
Library = apps.get_model("library", "Library")
Sample = apps.get_model("sample", "Sample")
Flowcell = apps.get_model("flowcell", "Flowcell")


class InvoicingViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminUser]

    serializer_class = InvoicingSerializer

    def get_start_end_dates(self):
        today = timezone.datetime.today()

        default_start_date = today - relativedelta(months=0)
        default_end_date = today

        start_date_param = self.request.query_params.get(
            "start", default_start_date.strftime("%Y-%m")
        )
        end_date_param = self.request.query_params.get(
            "end", default_end_date.strftime("%Y-%m")
        )

        start_date = timezone.datetime.strptime(start_date_param, "%Y-%m")
        end_date = timezone.datetime.strptime(end_date_param, "%Y-%m")

        start_date = start_date.replace(day=1)
        end_date = end_date.replace(day=1) + relativedelta(months=1, seconds=-1)

        return start_date, end_date

    def get_serializer_context(self):
        start_date, end_date = self.get_start_end_dates()
        today = timezone.datetime.today()
        organization_id = self.request.query_params.get("organization", 0)
        ctx = {"start_date": start_date, "end_date": end_date,
               "today": today, "organization_id": organization_id}
        return ctx

    def get_queryset(self):
        start_date, end_date = self.get_start_end_dates()
        organization_id = self.request.query_params.get("organization", None)

        flowcell_qs = (Flowcell.objects.select_related(
            "pool_size",
        )
        .filter(archived=False)
        .order_by("flowcell_id"))

        libraries_qs = (
            Library.objects.filter(~Q(pool=None))
            .select_related(
                "read_length",
                "library_protocol",
            )
            .only("read_length", "library_protocol__name")
        )

        samples_qs = (
            Sample.objects.filter(~Q(pool=None) & ~Q(status=-1))
            .select_related(
                "read_length",
                "library_protocol",
            )
            .only("read_length", "library_protocol__name")
        )

        queryset = (
            Request.objects.filter(
                invoice_date__gte=start_date,
                invoice_date__lte=end_date,
                sequenced=True,
                archived=False,
                cost_unit__organization__id=organization_id
            )
            .select_related(
                "cost_unit",
            )
            .prefetch_related(
                Prefetch("flowcell", queryset=flowcell_qs),
                Prefetch("libraries", queryset=libraries_qs),
                Prefetch("samples", queryset=samples_qs),
            )
            .distinct()
            .annotate(sequencing_date=Min("flowcell__create_time"))
            .only(
                "name",
                "cost_unit__name",
            )
            .order_by("sequencing_date", "pk")
        )

        return queryset

    def list(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)

        return Response(serializer.data)

    @action(methods=["get"], detail=False)
    def billing_periods(self, request):
        requests = Request.objects.all().filter(
            invoice_date__isnull=False, archived=False
        )
        data = []

        if requests.count() == 0:
            return Response(data)

        start_date = requests.first().invoice_date
        end_date = requests.last().invoice_date

        # Create quarters
        start_date = start_date.replace(
            month=int(start_date.month / 3) * 3 - 1,
            day=1,
        )
        end_date = end_date.replace(month=math.ceil(end_date.month / 3) * 3 + 1, day=1)
        dates = pd.date_range(
            start_date.date(), end_date.date(), inclusive="both", freq="Q"
        )

        for start_dt, end_dt in reversed(list(zip(dates, dates[1:]))):
            start_dt = start_dt + datetime.timedelta(days=1)
            try:
                report_urls = []
                reports = InvoicingReport.objects.filter(
                    month=start_dt.strftime("%Y-%m")
                )
                for r in reports:
                    report_urls.append(
                        {
                            "organization_id": r.organization.id,
                            "url": settings.MEDIA_URL + r.report.name,
                        }
                    )
            except InvoicingReport.DoesNotExist:
                report_urls = []
            data.append(
                {
                    "name": f"{start_dt.strftime('%b')} - {end_dt.strftime('%b %Y')}",
                    "value": [start_dt.year, start_dt.month],
                    "report_urls": report_urls,
                }
            )

        return Response(data)

    @action(
        methods=["post"],
        detail=False,
        authentication_classes=[CsrfExemptSessionAuthentication],
    )
    def upload(self, request):
        """Upload Invoicing Report."""
        month = timezone.datetime.strptime(
            request.data.get("month", None), "%Y-%m"
        ).strftime("%Y-%m")
        report = request.data.get("report", None)
        organization_id = request.data.get("organization", None)

        if not month or not report or not organization_id:
            return Response(
                {
                    "success": False,
                    "error": "Month, report or organization is not set.",
                },
                400,
            )

        try:
            report = InvoicingReport.objects.get(month=month, organization__id=organization_id)
            report.report = request.data.get("report")
        except InvoicingReport.DoesNotExist:
            report = InvoicingReport(
                month=Month.from_string(month),
                report=request.data.get("report"),
                organization_id=organization_id
            )
        finally:
            report.save()

        return JsonResponse({"success": True})

    @action(methods=["get"], detail=False)
    def download(self, request):
        """Download Invoicing Report."""

        start_date, end_date = self.get_start_end_dates()
        start_date = start_date.strftime("%b")
        end_date = end_date.strftime("%b%Y")
        organization = Organization.objects.get(
            id=self.request.query_params.get("organization", 0)
        )

        filename = f"Invoicing_Report_{'_'.join(str(organization).split())}_{start_date}{end_date}.xls"
        response = HttpResponse(content_type="application/ms-excel")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        queryset = self.filter_queryset(self.get_queryset())
        data = self.get_serializer(queryset, many=True).data

        wb = Workbook(encoding="utf-8")

        font_style = XFStyle()
        font_style.alignment.wrap = 1
        font_style_bold = XFStyle()
        font_style_bold.font.bold = True

        def write_header(ws, row_num, header):
            for i, column in enumerate(header):
                ws.write(row_num, i, column, font_style_bold)
                ws.col(i).width = 8000

        def write_row(ws, row_num, row):
            for i in range(len(row)):
                ws.write(row_num, i, row[i], font_style)

        # First sheet
        ws = wb.add_sheet("Invoicing")
        row_num = 0
        header = [
            "Request ID",
            "Cost Unit",
            "Sequencing kit",
            "Date + Flowcell ID",
            "Pool ID",
            "% of Lanes",
            "Read Length",
            "# of Libraries/Samples",
            "Library Preparation Protocol",
            "Fixed Costs",
            "Sequencing Costs",
            "Preparation Costs",
            "Variable Costs",
            "Total Costs",
        ]
        write_header(ws, row_num, header)

        for item in data:
            row_num += 1

            # cost_units = '; '.join(sorted(item['cost_unit']))
            pool_sizes = "; ".join(
                sorted(list({x["pool_size_name"] for x in item["pool_size"]}))
            )
            flowcells = "; ".join(item["flowcell"])
            pools = "; ".join(item["pool"])

            percentage = "; ".join(
                list(
                    map(
                        lambda x: ", ".join([y["percentage"] for y in x["pools"]]),
                        item["percentage"],
                    )
                )
            )

            read_lengths = "; ".join(
                ReadLength.objects.filter(archived=False, pk__in=item["read_length"])
                .order_by("name")
                .values_list("name", flat=True)
            )

            protocol = LibraryProtocol.objects.filter(archived=False).get(
                pk=item["library_protocol"]
            )

            row = [
                item["request"],
                item["cost_unit"],
                pool_sizes,
                flowcells,
                pools,
                percentage,
                read_lengths,
                item["num_libraries_samples"],
                protocol.name,
                item["fixed_costs"],
                item["sequencing_costs"],
                item["preparation_costs"],
                item["variable_costs"],
                item["total_costs"],
            ]
            write_row(ws, row_num, row)

        # Second sheet
        ws = wb.add_sheet("Fixed Costs")
        row_num = 0
        header = ["Sequencer", "Price"]
        write_header(ws, row_num, header)
        for item in FixedCosts.objects.filter(archived=False, fixedprice__organization=organization):
            row_num += 1
            row = [item.sequencer.name, item.fixedprice_set.get(organization=organization).price]
            write_row(ws, row_num, row)

        # Third sheet
        ws = wb.add_sheet("Preparation Costs")
        row_num = 0
        header = ["Library Protocol", "Price"]
        write_header(ws, row_num, header)
        for item in LibraryPreparationCosts.objects.filter(archived=False, librarypreparationprice__organization=organization):
            row_num += 1
            row = [item.library_protocol.name, item.librarypreparationprice_set.get(organization=organization).price]
            write_row(ws, row_num, row)

        # Fourth sheet
        ws = wb.add_sheet("Sequencing Costs")
        row_num = 0
        header = ["Sequencing Kit", "Price"]
        write_header(ws, row_num, header)
        for item in SequencingCosts.objects.filter(archived=False, sequencingprice__organization=organization):
            row_num += 1
            row = [
                str(item.pool_size),
                item.sequencingprice_set.get(organization=organization).price,
            ]
            write_row(ws, row_num, row)

        wb.save(response)
        return response


class FixedCostsViewSet(mixins.UpdateModelMixin, viewsets.ReadOnlyModelViewSet):
    """Get the list of Fixed Costs."""

    permission_classes = [IsAdminUser]
    serializer_class = FixedCostsSerializer

    def get_queryset(self):
        organization = self.request.query_params.get("organization", 0)
        if organization:
            return FixedCosts.objects.filter(
            sequencer__archived=False,
            fixedprice__organization__id=organization
            )
        else:
            return FixedCosts.objects.none()

    def get_serializer_context(self):
        organization_id = self.request.query_params.get("organization", 0)
        ctx = {'organization_id': organization_id}
        return ctx


class LibraryPreparationCostsViewSet(
    mixins.UpdateModelMixin, viewsets.ReadOnlyModelViewSet
):
    """Get the list of Library Preparation Costs."""

    permission_classes = [IsAdminUser]
    serializer_class = LibraryPreparationCostsSerializer

    def get_queryset(self):
        organization = self.request.query_params.get("organization", 0)
        if organization:
            return LibraryPreparationCosts.objects.filter(
            archived=False, library_protocol__archived=False,
            librarypreparationprice__organization__id=organization
            )
        else:
            return LibraryPreparationCosts.objects.none()

    def get_serializer_context(self):
        organization_id = self.request.query_params.get("organization", 0)
        ctx = {'organization_id': organization_id}
        return ctx

    def update(self, request, *args, **kwargs):

        return super().update(request, *args, **kwargs)


class SequencingCostsViewSet(mixins.UpdateModelMixin, viewsets.ReadOnlyModelViewSet):
    """Get the list of Sequencing Costs."""

    permission_classes = [IsAdminUser]
    serializer_class = SequencingCostsSerializer

    def get_queryset(self):
        organization = self.request.query_params.get("organization", 0)
        if organization:
            return SequencingCosts.objects.filter(
            pool_size__sequencer__archived=False,
            sequencingprice__organization__id=organization
            )
        else:
            return SequencingCosts.objects.none()

    def get_serializer_context(self):
        organization_id = self.request.query_params.get("organization", 0)
        ctx = {'organization_id': organization_id}
        return ctx
