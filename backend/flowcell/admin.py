from django.http import HttpRequest
from django.http.response import HttpResponse
from common.admin import ArchivedFilter
from django.conf import settings
from django.templatetags.static import static
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.contrib import admin
from flowcell.models import Flowcell, Sequencer, Lane
from index_generator.models import PoolSize


class LaneInline(admin.TabularInline):
    model = Flowcell.lanes.through
    verbose_name = "Lane"
    verbose_name_plural = "Lanes"
    # readonly_fields = ('lane',)
    can_delete = False
    extra = 0

    fields = (
        "name",
        "pool",
        "loading_concentration",
        "phix",
        "completed",
        "edit_link",
    )
    readonly_fields = (
        "name",
        "pool",
        "loading_concentration",
        "phix",
        "completed",
        "edit_link",
    )

    @admin.display(description="Name")
    def name(self, instance):
        return instance.lane.name

    @admin.display(description="Pool")
    def pool(self, instance):
        return instance.lane.pool.name

    @admin.display(description="Loading Concentration")
    def loading_concentration(self, instance):
        return instance.lane.loading_concentration

    @admin.display(description="PhiX %")
    def phix(self, instance):
        return instance.lane.phix

    @admin.display(
        description="Completed",
        boolean=True,
    )
    def completed(self, instance):
        return instance.lane.completed

    @admin.display(description="")
    def edit_link(self, instance):

        lane = instance.lane
        url = reverse(f'admin:{lane._meta.app_label}_{lane._meta.model_name}_change', args=[lane.id]) + \
              '?_to_field=id&_popup=1'
        icon_changelink_url = static("admin/img/icon-changelink.svg")
        return mark_safe(f'<a id="lane-{lane.id}" class="related-widget-wrapper-link '
                         f'add-related" data-popup="yes" href="{url}"><img src='
                         f'{icon_changelink_url} alt="Change"></a>')

    def has_add_permission(self, request, obj=None):
        return False


class PoolSizeInline(admin.TabularInline):
    model = PoolSize
    fields = ('short_name', 'lanes', 'size', 'cycles', 'read_lengths', 'archived',)
    ordering = ('lanes', 'size', 'cycles',)
    autocomplete_fields = ('read_lengths',)
    extra = 1
    verbose_name = 'Sequencing kit' # PoolSize as Sequencing kit
    verbose_name_plural = 'Sequencing kits'

@admin.register(Sequencer)
class SequencerAdmin(admin.ModelAdmin):
    list_display = ("name", "archived")

    list_filter = (ArchivedFilter,)

    actions = (
        "mark_as_archived",
        "mark_as_non_archived",
    )
    inlines = [PoolSizeInline]

    @admin.action(description="Mark as archived")
    def mark_as_archived(self, request, queryset):
        queryset.update(archived=True)

    @admin.action(description="Mark as non-archived")
    def mark_as_non_archived(self, request, queryset):
        queryset.update(archived=False)


@admin.register(Flowcell)
class FlowcellAdmin(admin.ModelAdmin):
    list_display = (
        "flowcell_id",
        "pool_size",
        "archived"
    )
    list_filter = ("pool_size", ArchivedFilter)
    exclude = (
        "lanes",
        "requests",
    )
    inlines = [LaneInline]

    actions = (
        "mark_as_archived",
        "mark_as_non_archived",
    )

    @admin.action(description="Mark as archived")
    def mark_as_archived(self, request, queryset):
        queryset.update(archived=True)

    @admin.action(description="Mark as non-archived")
    def mark_as_non_archived(self, request, queryset):
        queryset.update(archived=False)


@admin.register(Lane)
class LaneAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "pool",
        "loading_concentration",
        "phix",
        "completed",
    )

    fields = (
        "name",
        "pool",
        "loading_concentration",
        "phix",
        "completed",
    )

    readonly_fields = ('name', 'pool',)

    def has_module_permission(self, request):
        return False
