Ext.define("MainHub.view.flowcell.FlowcellsController", {
  extend: "MainHub.components.BaseGridController",
  alias: "controller.flowcells",

  requires: [
    "MainHub.view.flowcell.FlowcellWindow",
    "MainHub.view.flowcell.PoolInfoWindow",
    "MainHub.view.flowcell.SampleSheetIlluminav2Window",
  ],

  mixins: ["MainHub.grid.SearchInputMixin"],

  config: {
    control: {
      "#": {
        activate: "activateView",
      },
      parkourmonthpicker: {
        select: "selectMonth",
      },
      "#flowcells-grid": {
        resize: "resize",
        itemcontextmenu: "showMenu",
        groupcontextmenu: "showGroupMenu",
        cellclick: "showPoolInfo",
        edit: "editRecord",
      },
      "#check-column": {
        beforecheckchange: "selectRecord",
      },
      "#load-button": {
        click: "onLoadBtnClick",
      },
      "#download-benchtop-protocol-button": {
        click: "downloadBenchtopProtocol",
      },
      "#download-sample-sheet-button": {
        click: "downloadSampleSheet",
      },
      "#search-field": {
        change: "changeFilter",
      },
      "#as-handler-flowcell-checkbox": {
        change: "toggleHandler",
      },
      "#cancel-button": {
        click: "cancel",
      },
      "#save-button": {
        click: "save",
      },
    },
  },

  qualityCheckSingle: function (record, result) {
    var me = this;
    var loadingConcentration = record.get('loading_concentration');
    var phixPercentage = record.get('phix');

    if (!loadingConcentration || !phixPercentage) {

      // Gently remind that entering Loading concentration and % PhiX
      // is useful
      // Ext.Msg.show({
      //   title: "Missing information",
      //   message: Ext.String.format(
      //     "Do you want to approve this lane without setting its loading " +
      //     "concentration and/or % PhiX?"
      //   ),
      //   buttons: Ext.Msg.YESNO,
      //   icon: Ext.Msg.QUESTION,
      //   fn: function (btn) {
      //     if (btn === "yes") {
      //       var store = record.store;
      //       record.set("quality_check", result);
      //       me.syncStore(store.getId(), true);
      //     }
      //   },
      // });

      // Temporarily (?) force Loading concentration and % PhiX
      // to be entered

      new Noty({
        text: 'Loading concentration and % PhiX must be set ' +
              'before marking the lane as complete.',
        type: "error",
      }).show();
      var gridView = Ext.getCmp('flowcells-grid').getView();
      var gridColumns = gridView.getGridColumns();

      ['loading_concentration', 'phix'].forEach(function (dataIndex) {
        if (!record.get(dataIndex)) {
          var column = gridColumns.find(function (c) { return c.dataIndex === dataIndex })
          var cell = gridView.getCell(record, column);
          cell.addCls(" invalid-record");
        }

      })

      return false;

    } else {
      var store = record.store;
      record.set("quality_check", result);
      me.syncStore(store.getId(), true);
    }
  },

  qualityCheckSelected: function (grid, groupId, result) {
    var me = this;
    var store = grid.getStore();

    // Check if for any of the selected lanes 
    // the loading concentration or % PhiX was
    // not set
    var missingInfoItems = store.getGroups().items
      .find(function (e) {
        return e.getGroupKey() == groupId
      }).items
      .filter(function (e) {
        return !e.get('loading_concentration') ||
          !e.get('phix')
      })

    if (missingInfoItems.length > 0) {
      // Ext.Msg.show({
      //   title: "Missing information",
      //   message: Ext.String.format(
      //     "Do you want to approve these lanes without setting the loading " +
      //     "concentration and/or % PhiX for one or more of them?"
      //   ),
      //   buttons: Ext.Msg.YESNO,
      //   icon: Ext.Msg.QUESTION,
      //   fn: function (btn) {
      //     if (btn === "yes") {
      //       store.each(function (item) {
      //         if (item.get(store.groupField) === groupId && item.get("selected")) {
      //           item.set("quality_check", result);
      //         }
      //       });

      //       me.syncStore(store.getId(), true);
      //     }
      //   },
      // });

      // Temporarily (?) force Loading concentration and % PhiX
      // to be entered

      new Noty({
        text: 'Loading concentration and % PhiX must be set ' +
          'before marking the lanes as complete.',
        type: "error",
      }).show();

      missingInfoItems.forEach(function (e) {
        ['loading_concentration', 'phix'].forEach(function (dataIndex) {
          if (!record.get(dataIndex)) {
            var column = gridColumns.find(function (c) { return c.dataIndex === dataIndex })
            var cell = gridView.getCell(record, column);
            cell.addCls(" invalid-record");
          }
        })
      })
      return false;

    } else {
      store.each(function (item) {
        if (item.get(store.groupField) === groupId && item.get("selected")) {
          item.set("quality_check", result);
        }
      });

      me.syncStore(store.getId(), true);
    }

  },

  activateView: function (view) {
    var startMonthPicker = view.down("#start-month-picker");
    var endMonthPicker = view.down("#end-month-picker");

    var currentDate = new Date();
    var defaultStartDate = Ext.Date.subtract(currentDate, Ext.Date.MONTH, 0);
    var defaultEndDate = currentDate;

    startMonthPicker.setValue(defaultStartDate);
    endMonthPicker.setValue(defaultEndDate);

    startMonthPicker.fireEvent("select", startMonthPicker);
    endMonthPicker.fireEvent("select", endMonthPicker);
  },

  selectMonth: function (df) {
    var grid = df.up("grid");
    var startMonthPicker = grid.down("#start-month-picker");
    var endMonthPicker = grid.down("#end-month-picker");

    var start = Ext.Date.format(startMonthPicker.getValue(), "Y-m");
    var end = Ext.Date.format(endMonthPicker.getValue(), "Y-m");

    var store = grid.getStore();
    store.getProxy().setExtraParam("start", start);
    store.getProxy().setExtraParam("end", end);

    store.reload({
      callback: function () {
        grid.getView().features[0].collapseAll();
      },
    });
  },

  selectRecord: function (cb, rowIndex, checked, record) {
    // Don't select lanes from a different flowcell
    var selectedLane = record.store.findRecord("selected", true);
    if (selectedLane) {
      if (record.get("flowcell") !== selectedLane.get("flowcell")) {
        new Noty({
          text: "You can only select lanes from the same flowcell.",
          type: "warning",
        }).show();
        return false;
      }
    }
  },

  selectUnselectAll: function (grid, groupId, selected) {
    var store = grid.getStore();
    var selectedRecords = this._getSelectedRecords(store);

    if (selectedRecords.length > 0 && selectedRecords[0].flowcell !== groupId) {
      new Noty({
        text: "You can only select lanes from the same flowcell.",
        type: "warning",
      }).show();
      return false;
    }

    store.each(function (item) {
      if (item.get(store.groupField) === groupId) {
        item.set("selected", selected);
      }
    });
  },

  editRecord: function (editor, context) {
    var store = editor.grid.getStore();
    this.syncStore(store.getId());
  },

  applyToAll: function (gridView, record, dataIndex) {
    var store = gridView.grid.getStore();
    var allowedColumns = ["loading_concentration", "phix"];

    if (dataIndex && allowedColumns.indexOf(dataIndex) !== -1) {
      store.each(function (item) {
        if (
          item.get(store.groupField) === record.get(store.groupField) &&
          item !== record
        ) {
          item.set(dataIndex, record.get(dataIndex));
        }
      });

      // Send the changes to the server
      this.syncStore(store.getId());
    } else {
      this._showEditableColumnsMessage(gridView, allowedColumns);
    }
  },

  onLoadBtnClick: function () {
    Ext.create("MainHub.view.flowcell.FlowcellWindow");
  },

  downloadBenchtopProtocol: function (btn) {
    var store = btn.up("grid").getStore();
    var selectedLanes = this._getSelectedRecords(store);

    if (selectedLanes.length === 0) {
      new Noty({
        text: "You did not select any lanes.",
        type: "warning",
      }).show();
      return;
    }

    var form = Ext.create("Ext.form.Panel", { standardSubmit: true });
    form.submit({
      url: "api/flowcells/download_benchtop_protocol/",
      params: {
        ids: Ext.JSON.encode(Ext.Array.pluck(selectedLanes, "pk")),
      },
    });
  },

  downloadSampleSheet: function (btn) {
    var store = btn.up("grid").getStore();
    var selectedLanes = this._getSelectedRecords(store);

    if (selectedLanes.length === 0) {
      new Noty({
        text: "You did not select any lanes.",
        type: "warning",
      }).show();
      return;
    }

    var form = Ext.create("Ext.form.Panel", { standardSubmit: true });
    form.submit({
      url: "api/flowcells/download_sample_sheet/",
      params: {
        ids: Ext.JSON.encode(Ext.Array.pluck(selectedLanes, "pk")),
        flowcell_id: selectedLanes[0].flowcell,
      },
      failure: function (response) {
        var responseText = response.responseText
          ? Ext.JSON.decode(response.responseText)
          : null;
        responseText = responseText.message
          ? responseText.message
          : "Unknown error.";
        responseText = response.statusText ? response.statusText : responseText;
        new Noty({ text: responseText, type: "error" }).show();
        console.error(response);
      },
    });
  },

  toggleHandler: function (checkbox, newValue, oldValue, eOpts) {
    var grid = checkbox.up("#flowcells-grid");
    var gridGrouping = grid.view.getFeature("flowcells-grid-grouping");
    grid.store.getProxy().extraParams.asHandler = newValue ? "True" : "False";
    grid.store.reload({
      callback: function (records, operation, success) {
        if (success) {
          newValue ? gridGrouping.expandAll() : gridGrouping.collapseAll();
        }
      },
    });
  },

  showPoolInfo: function (view, td, cellIndex, record, tr, rowIndex, e) {
    if (e.getTarget(".pool-name") !== null) {
      Ext.create("MainHub.view.flowcell.PoolInfoWindow", {
        title: record.get("pool_name"),
        pool: record.get("pool"),
      });
    }
  },

  _getSelectedRecords: function (store) {
    var records = [];

    store.each(function (item) {
      if (item.get("selected")) {
        records.push({
          pk: item.get("pk"),
          flowcell: item.get("flowcell"),
        });
      }
    });

    return records;
  },
});
