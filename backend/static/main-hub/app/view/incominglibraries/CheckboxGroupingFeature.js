Ext.define("MainHub.view.incominglibraries.CheckboxGroupingFeature", {
  extend: "Ext.grid.feature.Grouping",
  alias: "feature.checkboxgrouping",

  onGroupClick: function (grid, node, group, event) {
    if (event && grid) {
      var target = event.getTarget(".group-checkbox");
      var groupRecord = this.getRecordGroup(event.record);
      if (target && groupRecord) {
        var checked = target.checked;

        Ext.Ajax.request({
          url: Ext.String.format("api/requests/{0}/samples_submitted/", group),
          method: "POST",
          scope: this,
          params: {
            data: Ext.JSON.encode({ result: checked })
          },

          success: function (response) {
            var obj = Ext.JSON.decode(response.responseText);
            if (obj.success) {
              new Noty({
                text: "Changes have been saved successfully."
              }).show();
              this.updateCheckbox(groupRecord, checked);
            } else {
              new Noty({ text: obj.message, type: "error" }).show();
            }
          },

          failure: function (response) {
            var responseText = response.responseText
              ? Ext.JSON.decode(response.responseText)
              : null;
            responseText = responseText.message
              ? responseText.message
              : "Unknown error.";
            responseText = response.statusText
              ? response.statusText
              : responseText;
            new Noty({ text: responseText, type: "error" }).show();
            console.error(response);
          }
        });
      } else {
        this.callParent(arguments);
      }
    }
  },

  updateCheckbox: function (groupRecord, checked) {
    groupRecord.items[0].set("samples_submitted", checked);
    this.view.refreshView();
  }
});
