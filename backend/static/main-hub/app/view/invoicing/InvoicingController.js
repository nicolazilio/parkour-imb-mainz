Ext.define("MainHub.view.invoicing.InvoicingController", {
  extend: "Ext.app.ViewController",
  alias: "controller.invoicing",

  requires: [
    "Ext.ux.FileUploadWindow",
    "MainHub.view.invoicing.UploadReportsWindow",
    "MainHub.view.invoicing.ViewUploadedReportsWindow",
  ],

  config: {
    control: {
      "#": {
        activate: "activateView",
      },
      // parkourmonthpicker: {
      //   select: "selectMonth"
      // },
      "#invoicing-billing-period-combobox": {
        select: "selectBillingPeriod",
      },
      "#invoicing-organization-combobox": {
        select: "selectOrganization",
      },
      "#invoicing-grid": {
        resize: "resize",
      },
      "#download-report": {
        click: "downloadReport",
      },
      "#upload-report": {
        click: "uploadReports",
      },
      "#view-uploaded-reports": {
        click: "viewUploadedReports",
      },
      "#fixed-costs-grid,#preparation-costs-grid,#sequencing-costs-grid": {
        edit: "editPrice",
      },
    },
  },

  activateView: function (view) {
    view.down("#invoicing-organization-combobox").getStore().reload();
    view.down("#invoicing-billing-period-combobox").getStore().reload();
  },

  resize: function (el) {
    el.setHeight(Ext.Element.getViewportHeight() - 64);
  },

  selectBillingPeriod: function (cb, record) {
    cb.up("grid").down("#download-report").enable();

    var organizationId = cb.up().down("#invoicing-organization-combobox").value;
    var start = new Date(record.get("value")[0], record.get("value")[1] - 1);
    var end = new Date(start.getTime());
    end.setMonth(end.getMonth() + 2);

    var invoicingStore = Ext.getStore("Invoicing");
    invoicingStore.getProxy().extraParams.start = Ext.Date.format(start, "Y-m");
    invoicingStore.getProxy().extraParams.end = Ext.Date.format(end, "Y-m");

    if (organizationId) {
      invoicingStore.reload();
    }
  },

  selectOrganization: function (cb, record) {
    // Reload organization-specific cost stores
    Ext.getStore("FixedCosts").reload({
      params: {
        organization: cb.value,
      },
    });
    Ext.getStore("LibraryPreparationCosts").reload({
      params: {
        organization: cb.value,
      },
    });
    Ext.getStore("SequencingCosts").reload({
      params: {
        organization: cb.value,
      },
    });

    var invoicingStore = Ext.getStore("Invoicing");
    invoicingStore.getProxy().extraParams.organization = cb.value;

    var billingPeriod = cb
      .up()
      .down("#invoicing-billing-period-combobox").value;
    if (billingPeriod) {
      invoicingStore.reload();
    }
  },

  editPrice: function (editor, context) {
    var store = editor.grid.getStore();
    var proxy = store.getProxy();

    proxy.api.update = Ext.String.format(
      "{0}{1}/",
      proxy.api.read,
      context.record.get("id")
    );

    store.sync({
      params: {
        organization: Ext.ComponentQuery.query(
          "#invoicing-organization-combobox"
        )[0].getValue(),
      },
      success: function (batch) {
        Ext.getCmp("invoicing-grid").getStore().reload();
        new Noty({ text: "Changes have been saved successfully." }).show();
      },
    });
  },

  downloadReport: function (btn) {
    var grid = btn.up("grid");
    var billingPeriodCb = grid.down("#invoicing-billing-period-combobox");
    var organizationCb = btn
      .up("grid")
      .down("#invoicing-organization-combobox");

    if (!billingPeriodCb.getValue()) {
      new Noty({
        text: "Please select a billing period.",
        type: "warning",
      }).show();
    }
    if (!organizationCb.getValue()) {
      new Noty({
        text: "Please select an organization.",
        type: "warning",
      }).show();
    }

    if (!billingPeriodCb.getValue() || !organizationCb.getValue()) {
      return;
    }

    var start = new Date(
      billingPeriodCb.getValue()[0],
      billingPeriodCb.getValue()[1] - 1
    );
    var end = new Date(start.getTime());
    end.setMonth(end.getMonth() + 2);
    var form = Ext.create("Ext.form.Panel", { standardSubmit: true });

    form.submit({
      url: btn.downloadUrl,
      method: "GET",
      params: {
        start: Ext.Date.format(start, "Y-m"),
        end: Ext.Date.format(end, "Y-m"),
        organization: organizationCb.getValue(),
      },
    });
  },

  uploadReport: function (btn) {
    var billingPeriodCb = btn
      .up("grid")
      .down("#invoicing-billing-period-combobox");
    var value = billingPeriodCb.getValue();

    Ext.create("Ext.ux.FileUploadWindow", {
      fileFieldName: "report",

      onFileUpload: function () {
        var uploadWindow = this;
        var form = this.down("form").getForm();

        if (!form.isValid()) {
          new Noty({
            text: "You did not select any file.",
            type: "warning",
          }).show();
          return;
        }

        form.submit({
          url: btn.uploadUrl,
          method: "POST",
          waitMsg: "Uploading...",
          params: {
            month: value[0] + "-" + value[1],
            organization: btn
              .up("grid")
              .down("#invoicing-organization-combobox")
              .getValue(),
          },
          success: function (f, action) {
            new Noty({ text: "Report has been successfully uploaded." }).show();
            billingPeriodCb.getStore().reload();
            uploadWindow.close();
          },
        });
      },
    });
  },

  uploadReports: function (btn) {
    Ext.create("MainHub.view.invoicing.UploadReportsWindow");
  },

  viewUploadedReports: function (btn) {
    Ext.create("MainHub.view.invoicing.ViewUploadedReportsWindow");
  },

  gridCellTooltipRenderer: function (value, meta) {
    meta.tdAttr = Ext.String.format('data-qtip="{0}"', value);
    return value;
  },

  listRenderer: function (value, meta) {
    meta.tdAttr = Ext.String.format('data-qtip="{0}"', value.join("<br/>"));
    return value.join("; ");
  },

  sequencingKitRenderer: function (value, meta) {
    var items = value.map(function (item) {
      return Ext.String.format(
        "{0}: {1}",
        item.flowcell_id,
        item.pool_size_name
      );
    });
    meta.tdAttr = Ext.String.format('data-qtip="{0}"', items.join("<br/>"));
    return _.uniq(Ext.Array.pluck(value, "pool_size_name")).sort().join("; ");
  },

  percentageRenderer: function (value, meta) {
    var tpl = new Ext.XTemplate(
      "<ul>",
      '<tpl for=".">',
      "<li>{flowcell_id}",
      "<ul>",
      '<tpl for="pools">',
      "<li>{name}: {percentage}</li>",
      "</tpl>",
      "</ul>",
      "</li>",
      "</tpl>",
      "</ul>"
    );
    meta.tdAttr = Ext.String.format('data-qtip="{0}"', tpl.apply(value));

    return Ext.Array.pluck(value, "pools")
      .map(function (item) {
        return Ext.Array.pluck(item, "percentage").join(", ");
      })
      .join("; ");
  },

  readLengthRenderer: function (value, meta) {
    var store = Ext.getStore("readLengthsInvoicingStore");
    var items = value.map(function (id) {
      var record = store.findRecord("id", id, 0, false, true, true);
      return record.get("name");
    });
    return items.join("; ");
  },

  libraryProtocolRenderer: function (value, meta) {
    var record = Ext.getStore("libraryprotocolinvoicingStore").findRecord(
      "id",
      value,
      0,
      false,
      true,
      true
    );
    var name = record.get("name");
    meta.tdAttr = Ext.String.format('data-qtip="{0}"', name);
    return name;
  },
});
