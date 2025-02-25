Ext.define("MainHub.model.requests.Request", {
  extend: "MainHub.model.Base",

  fields: [
    {
      type: "int",
      name: "id"
    },
    {
      type: "string",
      name: "name"
    },
    {
      type: "int",
      name: "user"
    },
    {
      type: "string",
      name: "user_full_name"
    },
    {
      type: "int",
      name: "cost_unit",
      allowNull: true
    },
    {
      type: "auto",
      name: "cost_units"
    },
    {
      type: "date",
      name: "create_time"
    },
    {
      type: "string",
      name: "description"
    },
    {
      type: "int",
      name: "bioinformatician",
    },
    {
      type: "string",
      name: "bioinformatician_name",
    },
    {
      type: "int",
      name: "handler",
    },
    {
      type: "string",
      name: "handler_name",
    },
    {
      type: "int",
      name: "pool_size_user",
    },
    {
      type: "string",
      name: "pool_size_user_name",
    },
    {
      type: "bool",
      name: "pooled_libraries",
    },
    {
      type: "float",
      name: "pooled_libraries_concentration_user",
    },
    {
      type: "float",
      name: "pooled_libraries_volume_user",
    },
    {
      type: "int",
      name: "pooled_libraries_fragment_size_user",
    },
    {
      type: "bool",
      name: "restrict_permissions"
    },
    {
      type: "bool",
      name: "completed"
    },
    {
      type: "string",
      name: "deep_seq_request_name"
    },
    {
      type: "string",
      name: "deep_seq_request_path"
    },
    {
      type: "string",
      name: "approval_user_name",
    },
    {
      type: "string",
      name: "approval_time",
    },
    {
      type: "string",
      name: "invoice_date",
    },
    {
      type: "float",
      name: "total_sequencing_depth"
    },
    {
      type: "auto",
      name: "files"
    },
    {
      type: "int",
      name: "number_of_samples"
    }
  ]
});
