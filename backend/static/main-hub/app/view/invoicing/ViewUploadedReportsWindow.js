Ext.define("MainHub.view.invoicing.ViewUploadedReportsWindow", {
  extend: "Ext.window.Window",

  title: "View Uploaded Reports",
  height: 150,
  width: 580,

  modal: true,
  resizable: false,
  autoShow: true,
  layout: "fit",

  items: [
    {
      xtype: "fieldcontainer",
      layout: "hbox",
      items: [
        {
          xtype: "combobox",
          itemId: "organization-view-invoicing-report-combobox",
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
          itemId: "billing-period-view-invoicing-report-combobox",
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
  ],

  dockedItems: [
    {
      xtype: "toolbar",
      dock: "bottom",
      items: [
        "->",
        {
          xtype: "button",
          itemId: "view-button",
          text: "View",
          width: 80,
          handler: function () {
            var window = this.up("window");

            var billingPeriodCb = window.down(
              "#billing-period-view-invoicing-report-combobox"
            );
            var organizationCb = window.down(
              "#organization-view-invoicing-report-combobox"
            );

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

            var month = new Date(
              billingPeriodCb.getValue()[0],
              billingPeriodCb.getValue()[1] - 1
            );
            var organization = organizationCb.getValue();

            Ext.Ajax.request({
              url: "/api/invoicing/billing_periods/",
              disableCaching: false,
              method: "GET",
              success: function (response) {
                var responseData = Ext.decode(response.responseText);
                var reportUrl = "";

                Ext.Array.each(responseData, function (item) {
                  if (
                    item.value[0] == month.getFullYear() &&
                    item.value[1] == month.getMonth() + 1
                  ) {
                    Ext.Array.each(item.report_urls, function (report) {
                      if (report.organization_id == organization) {
                        reportUrl = report.url;
                        return false;
                      }
                    });
                  }
                });

                if (reportUrl) {
                  var link = document.createElement("a");
                  link.href = reportUrl;
                  link.download = reportUrl.substr(
                    reportUrl.lastIndexOf("/") + 1
                  );
                  link.click();
                  new Noty({
                    text: "Report is downloaded successfully.",
                    type: "success",
                  }).show();
                } else {
                  new Noty({
                    text: "No report found.",
                    type: "warning",
                  }).show();
                }
              },
              failure: function (response) {
                new Noty({
                  text: "Error occurred while fetching report data.",
                  type: "error",
                }).show();
              },
            });
          },
        },
        {
          xtype: "button",
          itemId: "cancel-button",
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
