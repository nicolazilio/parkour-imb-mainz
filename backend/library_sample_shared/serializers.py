from rest_framework.serializers import (
    ListSerializer,
    ModelSerializer,
    SerializerMethodField,
)

from .models import (
    ConcentrationMethod,
    IndexI5,
    IndexI7,
    IndexType,
    LibraryProtocol,
    LibraryType,
    Organism,
    ReadLength,
    IndexPair,
)


class OrganismSerializer(ModelSerializer):
    class Meta:
        model = Organism
        fields = ("id", "name", "scientific_name", "taxon_id")


class ReadLengthSerializer(ModelSerializer):
    class Meta:
        model = ReadLength
        fields = ("id", "name", "archived")


class ConcentrationMethodSerializer(ModelSerializer):
    class Meta:
        model = ConcentrationMethod
        fields = ("id", "name")


class IndexTypeSerializer(ModelSerializer):
    index_reads = SerializerMethodField()
    index_length = SerializerMethodField()

    class Meta:
        model = IndexType
        fields = (
            "id",
            "name",
            "index_reads",
            "is_dual",
            "format",
            "index_length",
            "archived",
            "read_type",
        )

    def get_index_reads(self, obj):
        return 2 if obj.is_dual else 1

    def get_index_length(self, obj):
        return int(obj.get_index_length_display())

class IndexPairSerialzer(ModelSerializer):
    class Meta:
        model = IndexPair
        fields = (
            "index_type",
            "index1_id",
            "index2_id",
            "char_coord",
            "num_coord",
            "archived"
        )

class IndexBaseSerializer(ModelSerializer):
    name = SerializerMethodField()

    class Meta:
        fields = (
            "id",
            "name",
            "prefix",
            "number",
            "index_id",
            "index",
        )

    def get_name(self, obj):
        return f"{obj.index_id} - {obj.index}"


class IndexI7Serializer(IndexBaseSerializer):
    class Meta(IndexBaseSerializer.Meta):
        model = IndexI7


class IndexI5Serializer(IndexBaseSerializer):
    class Meta(IndexBaseSerializer.Meta):
        model = IndexI5


class LibraryProtocolSerializer(ModelSerializer):
    library_type = SerializerMethodField()

    class Meta:
        model = LibraryProtocol
        fields = (
            'id',
            'name',
            'type',
            'nucleic_acid_types',
            'library_type',
            'provider',
            'catalog',
            'explanation',
            'input_requirements',
            'typical_application',
            'comments'
        )

    def get_library_type(self, obj):
        return obj.librarytype_set.all().distinct().values_list(
            "id", flat=True
        )

class LibraryTypeSerializer(ModelSerializer):
    library_protocol = SerializerMethodField()
    nucleic_acid_type = SerializerMethodField()

    class Meta:
        model = LibraryType
        fields = ("id", "name", "library_protocol", "nucleic_acid_type")

    def get_library_protocol(self, obj):
        return LibraryType.objects.filter(archived=False, pk=obj.pk).values_list(
            "library_protocol__id", flat=True
        )

    def get_nucleic_acid_type(self, obj):
        return LibraryType.objects.filter(pk=obj.pk).distinct().values_list(
            "library_protocol__nucleic_acid_types__id", flat=True
        )

class LibrarySampleBaseListSerializer(ListSerializer):
    def update(self, instance, validated_data):
        # Maps for id->instance and id->data item.
        object_mapping = {obj.pk: obj for obj in instance}
        data_mapping = {item["pk"]: item for item in validated_data}

        # Perform updates
        ret = []
        for obj_id, data in data_mapping.items():
            obj = object_mapping.get(obj_id, None)
            if obj is not None:
                ret.append(self.child.update(obj, data))
        return ret

    # def delete(self, instance):
    #     pass


class LibrarySampleBaseSerializer(ModelSerializer):
    request_id = SerializerMethodField()
    request_name = SerializerMethodField()
    library_protocol_name = SerializerMethodField()
    library_type_name = SerializerMethodField()
    concentration_method_name = SerializerMethodField()
    read_length_name = SerializerMethodField()
    organism_name = SerializerMethodField()

    class Meta:
        list_serializer_class = LibrarySampleBaseListSerializer
        fields = (
            "request_id",
            "request_name",
            "name",
            "barcode",
            "status",
            "create_time",
            "library_protocol",
            "library_protocol_name",
            "library_type",
            "library_type_name",
            "organism",
            "source",
            "equal_representation_nucleotides",
            "sample_volume_user",
            "concentration",
            "concentration_method",
            "read_length",
            "read_length_name",
            "sequencing_depth",
            "comments",
            "amplification_cycles",
            "organism_name",
        )
        extra_kwargs = {"barcode": {"required": False}}

    def get_request_id(self, obj):
        return obj.request.get().pk

    def get_request_name(self, obj):
        return obj.request.get().name

    def get_library_protocol_name(self, obj):
        return obj.library_protocol.name

    def get_library_type_name(self, obj):
        return obj.library_type.name

    def get_concentration_method_name(self, obj):
        return obj.concentration_method.name

    def get_read_length_name(self, obj):
        return obj.read_length.name

    def get_organism_name(self, obj):
        return obj.organism.name
