Ext.define("MainHub.view.invoicing.UploadReportsWindow", {
  extend: "Ext.window.Window",

  title: "Upload Reports",
  height: 190,
  width: 580,

  modal: true,
  resizable: false,
  autoShow: true,
  layout: "fit",

  items: [
    {
      layout: {
        type: "vbox",
        align: "stretch",
      },
      items: [
        {
          xtype: "fieldcontainer",
          layout: "hbox",
          items: [
            {
              xtype: "combobox",
              itemId: "organization-upload-invoicing-report-combobox",
              fieldLabel: "Organization",
              store: "Organizations",
              queryMode: "local",
              valueField: "id",
              displayField: "name",
              forceSelection: true,
              labelWidth: 85,
              margin: "8px 10px 0 10px",
            },
            {
              xtype: "combobox",
              itemId: "billing-period-upload-invoicing-report-combobox",
              fieldLabel: "Billing Period",
              store: "BillingPeriods",
              queryMode: "local",
              valueField: "value",
              displayField: "name",
              forceSelection: true,
              labelWidth: 85,
              margin: "8px 10px 0 10px",
            },
          ],
        },
        {
          xtype: "filefield",
          itemId: "upload-invoicing-report-file-field",
          fieldLabel: "Report",
          labelWidth: 85,
          msgTarget: "side",
          buttonText: "Select",
          margin: "5px 10px 10px 10px",
          allowBlank: false,
        },
      ],
    },
  ],

  dockedItems: [
    {
      xtype: "toolbar",
      dock: "bottom",
      items: [
        "->",
        {
          xtype: "button",
          itemId: "upload-invoicing-report-upload-button",
          text: "Upload",
          width: 80,
          handler: function () {
            var window = this.up("window");
            var fileField = window.down("#upload-invoicing-report-file-field");
            var billingPeriodCb = window.down(
              "#billing-period-upload-invoicing-report-combobox"
            );
            var organizationCb = window.down(
              "#organization-upload-invoicing-report-combobox"
            );

            if (!fileField.getValue()) {
              new Noty({
                text: "Please select a report file.",
                type: "warning",
              }).show();
            }
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
            if (
              !fileField.getValue() ||
              !billingPeriodCb.getValue() ||
              !organizationCb.getValue()
            ) {
              return;
            }

            var month = new Date(
              billingPeriodCb.getValue()[0],
              billingPeriodCb.getValue()[1] - 1
            );
            var reportPayload = new FormData();
            reportPayload.append("report", fileField.fileInputEl.dom.files[0]);
            reportPayload.append("month", Ext.Date.format(month, "Y-m"));
            reportPayload.append("organization", organizationCb.getValue());

            Ext.Ajax.request({
              url: "api/invoicing/upload/",
              method: "POST",
              rawData: reportPayload,
              headers: {
                "Content-Type": null,
              },
              success: function (response) {
                window.close();
                new Noty({
                  text: "Report has been successfully uploaded.",
                  type: "success",
                }).show();
              },
              failure: function (response) {
                window.close();
                new Noty({
                  text: "Error while uploading the report.",
                  type: "error",
                }).show();
              },
            });
          },
        },
        {
          xtype: "button",
          itemId: "upload-invoicing-report-cancel-button",
          text: "Cancel",
          width: 80,
          handler: function () {
            var window = this.up("window");
            window.close();
          },
        },
      ],
    },
  ],
});
