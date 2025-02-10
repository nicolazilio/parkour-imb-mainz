Ext.define("MainHub.view.requests.RequestWindowController", {
  extend: "Ext.app.ViewController",
  alias: "controller.requests-requestwindow",

  requires: ["Ext.ux.FileUploadWindow"],

  config: {
    control: {
      "#": {
        boxready: "onRequestWindowBoxready"
      },
      "#libraries-in-request-grid": {
        refresh: "refreshLibrariesInRequestGrid",
        itemcontextmenu: "showContextMenu",
        headercontextmenu: "showHeaderMenu"
      },
      "#check-column": {
        beforecheckchange: "selectItem",
        unselectall: "unselectAll"
      },
      "#save-button": {
        click: "save"
      },
      "#batch-add-button": {
        click: "showBatchAddWindow",
      },
      "#export-libraries-excel": {
        click: "exportLibrariesExcel",
      },
    },
  },

  refreshLibrariesInRequestGrid: function (grid) {
    var requestId = grid.up("window").record.get("pk");
    grid.getStore().reload({
      url: Ext.String.format("api/requests/{0}/get_records/", requestId)
    });
  },

  onRequestWindowBoxready: function (wnd) {
    var librariesInRequestGrid = wnd.down("#libraries-in-request-grid");
    var librariesInRequestStore = librariesInRequestGrid.getStore();
    librariesInRequestStore.addListener(
      "datachanged",
      this._togglePoolFields,
      librariesInRequestStore
    );
    var costUnitCb = wnd.down("#cost-unit-cb");
    var piCb = wnd.down("#pi-cb");
    var bioinfoCb = wnd.down("#bioinformatician-cb");
    var handlerCb = wnd.down("#handler-cb");
    var readLengthsCb = wnd.down("#pool-size-user-cb");
    var form = Ext.getCmp("request-form").getForm();
    var userId = USER.id;
    var request;

    Ext.getStore("requestFilesStore").removeAll();

    if (wnd.mode === "add") {
      librariesInRequestStore.removeAll();
      librariesInRequestGrid.getColumns()[0].hide();
    } else {
      request = wnd.record.data;
      userId = request.user;

      form.setValues(request);

      if (request.deep_seq_request_path !== "") {
        $("#approved-request-file")
          .html(
            '<span data-qtip="Download confirmation of approval">Approved by ' +
              request.approval_user_name +
              '<a href="javascript:void(0)" class="uploaded-request-link"><span class="fa fa-download fa-lg" style="padding-left:5px;"></span></a></span>'
          )
          .on("click", function () {
            var link = document.createElement("a");
            link.href = request.deep_seq_request_path;
            link.download = request.deep_seq_request_name;
            link.click();
          });
      }

      // Disable Request editing
      if (
        !(USER.is_staff || USER.member_of_bcf) &&
        request.restrict_permissions
      ) {
        this.disableButtonsAndMenus();
        costUnitCb.setReadOnly(true);
        piCb.setReadOnly(true);
        bioinfoCb.setReadOnly(true);
        readLengthsCb.setReadOnly(true);
        wnd.down("#request-description").setReadOnly(true);
        wnd.down("#pooled-libraries").setReadOnly(true);
        wnd.down("#pooled-libraries-concentration").setReadOnly(true);
        wnd.down("#pooled-libraries-volume").setReadOnly(true);
        wnd.down("#pooled-libraries-fragment-size").setReadOnly(true);
      }

      // Load all Libraries/Samples for current Request
      librariesInRequestGrid.fireEvent("refresh", librariesInRequestGrid);

      // Load files
      if (request.files.length > 0) {
        Ext.getStore("requestFilesStore").load({
          url: Ext.String.format("api/requests/{0}/get_files/", request.pk),
          params: {
            file_ids: Ext.JSON.encode(request.files)
          }
        });
      }
    }

    // Load PIs
    Ext.getStore("PrincipalInvestigators").reload({
      params: {
        request_pi: request ? request.pi : null,
      },
      callback: function (records, operation, success) {
        if (success && request) {
          piCb.setValue(request.pi);
        } else {
          if (
            !(USER.is_staff || USER.member_of_bcf) &&
            Ext.getStore("PrincipalInvestigators").getCount() === 1
          ) {
            piCb.setValue(Ext.getStore("PrincipalInvestigators").first());
          }
        }
      },
    });

    // Load Cost Units
    Ext.getStore("CostUnits").reload({
      params: {
        principal_investigator_id: request ? request.pi : null,
      },
      callback: function (records, operation, success) {
        if (success && request) {
          costUnitCb.setValue(request.cost_unit);
        }
      },
    });

    // Load bioinformaticians
    Ext.getStore("Bioinformaticians").reload({
      params: {
        request_user: request ? request.user : 0,
        request_bioinformatician: request ? request.bioinformatician : 0,
      },
      callback: function (records, operation, success) {
        if (success && request) {
          bioinfoCb.setValue(request.bioinformatician);
        }
      },
    });

    // Load staff members
    Ext.getStore("StaffMembers").reload({
      params: {
        request_handler: request ? request.handler : 0,
      },
      callback: function (records, operation, success) {
        if (success && request) {
          handlerCb.setValue(request.handler);
        }
      },
    });

    // Set invoice date, if it exists
    if (request && request.invoice_date) {
      var invoiceDate = new Date(request.invoice_date);
      var invoiceDateBox = wnd.down("#invoice-date");
      invoiceDateBox.setValue(invoiceDate);
    }

    // Reload Read Lengths for specific request
    Ext.getStore("readLengthsStore").reload({
      params: {
        pool_size_user: request ? request.pool_size_user : 0,
        request_id: request ? request.pk : 0,
      },
      callback: function (records, operation, success) {
        if (success && request) {
          readLengthsCb.setValue(request.pool_size_user);
        }
      },
    });

    this.initializeTooltips();
  },

  selectItem: function (cb, rowIndex, checked, record) {
    var selectedItems = this.getSelectedItems();

    if (selectedItems.length > 0) {
      if (record.get("record_type") !== selectedItems[0].record_type) {
        new Noty({
          text: "You can only select items of the same type.",
          type: "warning"
        }).show();
        return false;
      }
    }
  },

  showContextMenu: function (grid, record, itemEl, index, e) {
    var me = this;
    var wnd = grid.up("window");

    if (wnd.mode === "add") {
      return;
    }

    var recordId = wnd.record.get("pk");
    var selectedItems = this.getSelectedItems();
    var menuItems;

    if (selectedItems.length <= 1) {
      var selectedItem =
        selectedItems.length === 0 ? record.data : selectedItems[0];
      var selectedItemName = selectedItem.name;

      menuItems = [
        {
          text: Ext.String.format('Edit "{0}"', selectedItemName),
          handler: function () {
            me.editRecords(recordId, [selectedItem]);
          }
        },
        {
          text: Ext.String.format('Delete "{0}"', selectedItemName),
          handler: function () {
            Ext.Msg.show({
              title: "Delete record",
              message: Ext.String.format(
                'Are you sure that you want to delete "{0}"?',
                selectedItemName
              ),
              buttons: Ext.Msg.YESNO,
              icon: Ext.Msg.QUESTION,
              fn: function (btn) {
                if (btn === "yes") {
                  me.deleteRecord(selectedItem);
                }
              }
            });
          }
        }
      ];
    } else {
      menuItems = [
        {
          text: Ext.String.format("Edit {0} Items", selectedItems.length),
          handler: function () {
            me.editRecords(recordId, selectedItems);
          }
        }
      ];
    }

    e.stopEvent();
    Ext.create("Ext.menu.Menu", {
      plain: true,
      defaults: {
        margin: 5
      },
      items: menuItems
    }).showAt(e.getXY());
  },

  showHeaderMenu: function (ct, column, e) {
    var me = this;

    if (column.dataIndex !== "selected") {
      return;
    }

    e.stopEvent();

    // Simplify context menu for record selection based on whether
    // all records are either samples or libraries, while preserving
    // original functionality if records in request are or mixed type
    var records = column.up("#libraries-in-request-grid").store.getRange();
    var allRecordsLibraries = records.every(function (e) {
      return e.data.record_type === "Library";
    });
    var allRecordsSamples = records.every(function (e) {
      return e.data.record_type === "Sample";
    });
    var contextMenuItems = [
      "-",
      {
        text: "Unselect All",
        handler: function () {
          me.unselectAll();
        },
      },
    ];

    if (!allRecordsLibraries && !allRecordsSamples) {
      contextMenuItems.unshift(
        {
          text: "Select All Libraries",
          handler: function () {
            me.selectAll("Library");
          }
        },
        {
          text: "Select All Samples",
          handler: function () {
            me.selectAll("Sample");
          },
        }
      );
    } else {
      contextMenuItems.unshift({
        text: "Select All",
        handler: function () {
          me.selectAll(allRecordsLibraries ? "Library" : "Sample");
        },
      });
    }

    Ext.create("Ext.menu.Menu", {
      plain: true,
      defaults: {
        margin: 5,
      },
      items: contextMenuItems,
    }).showAt(e.getXY());
  },

  selectAll: function (recordType) {
    var store = Ext.getStore("librariesInRequestStore");
    var selectedItems = this.getSelectedItems();

    if (
      selectedItems.length > 0 &&
      selectedItems[0].record_type !== recordType
    ) {
      new Noty({
        text: "You can only select items of the same type.",
        type: "warning"
      }).show();
      return false;
    }

    store.each(function (item) {
      if (item.get("record_type") === recordType) {
        item.set("selected", true);
      }
    });
  },

  unselectAll: function () {
    var store = Ext.getStore("librariesInRequestStore");
    store.each(function (item) {
      item.set("selected", false);
    });
  },

  editRecords: function (requestId, records) {
    var type = records[0].record_type === "Library" ? "libraries" : "samples";
    var ids = Ext.Array.pluck(records, "pk");
    var url = Ext.String.format("api/{0}/", type);

    Ext.Ajax.request({
      url: url,
      method: "GET",
      scope: this,
      params: {
        request_id: requestId,
        ids: Ext.JSON.encode(ids)
      },

      success: function (response) {
        var obj = Ext.JSON.decode(response.responseText);

        if (obj.success) {
          if (obj.data.length === 0) {
            new Noty({ text: "No data.", type: "warning" }).show();
            return;
          }

          Ext.create("MainHub.view.libraries.BatchAddWindow", {
            mode: "edit",
            type: records[0].record_type,
            records: obj.data
          });
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
        responseText = response.statusText ? response.statusText : responseText;
        new Noty({ text: responseText, type: "error" }).show();
        console.error(response);
      }
    });
  },

  deleteRecord: function (record) {
    var url =
      record["record_type"] === "Library"
        ? "api/libraries/{0}/"
        : "api/samples/{0}/";

    Ext.Ajax.request({
      url: Ext.String.format(url, record["pk"]),
      method: "DELETE",
      scope: this,

      success: function (response) {
        var obj = Ext.JSON.decode(response.responseText);
        if (obj.success) {
          var grid = Ext.getCmp("libraries-in-request-grid");
          grid.fireEvent("refresh", grid);
          new Noty({ text: "The record has been deleted!" }).show();
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
        responseText = response.statusText ? response.statusText : responseText;
        new Noty({ text: responseText, type: "error" }).show();
        console.error(response);
      }
    });
  },

  save: function (btn) {
    var wnd = btn.up("window");
    var handlerCb = wnd.down("#handler-cb");
    var invoiceDateBox = wnd.down("#invoice-date");
    var form = Ext.getCmp("request-form");
    var store = Ext.getStore("librariesInRequestStore");
    var url;

    if (wnd.mode === "add") {
      url = "api/requests/";
    } else {
      url = Ext.String.format(
        "api/requests/{0}/edit/",
        wnd.autoSaveRequestId ? wnd.autoSaveRequestId : wnd.record.get("pk")
      );
    }

    if (!(USER.is_staff || USER.member_of_bcf) && store.getCount() === 0) {
      new Noty({
        text: 'No libraries/samples are added to the request.',
        type: 'warning'
      }).show();
      return;
    }

    // Set pool fields to required, if enabled just before saving,
    //  in order to triggers relevant errors during form validation
    [
      "#pooled-libraries",
      "#pooled-libraries-concentration",
      "#pooled-libraries-volume",
      "#pooled-libraries-fragment-size",
    ].map(function (fieldId) {
      var field = form.down(fieldId);
      if (!field.disabled) {
        field.allowBlank = false;
      }
    });

    if (!form.isValid()) {
      new Noty({
        text: "Please fill in all the required fields.",
        type: "warning"
      }).show();
      return;
    }

    var data = form.getForm().getFieldValues();

    wnd.setLoading("Saving...");
    Ext.Ajax.request({
      url: url,
      method: "POST",
      scope: this,

      params: {
        data: Ext.JSON.encode({
          name: data.name,
          pi: data.pi,
          cost_unit: data.cost_unit,
          bioinformatician: data.bioinformatician
            ? data.bioinformatician
            : null,
          handler: handlerCb.value ? handlerCb.value : null,
          invoice_date: invoiceDateBox.value
            ? new Date(
                invoiceDateBox.value.setTime(
                  invoiceDateBox.value.getTime() -
                    invoiceDateBox.value.getTimezoneOffset() * 60000
                )
              )
            : null,
          pool_size_user: data.pool_size_user ? data.pool_size_user : null,
          description: data.description,
          pooled_libraries: data.pooled_libraries,
          pooled_libraries_concentration_user:
            data.pooled_libraries_concentration_user,
          pooled_libraries_volume_user: data.pooled_libraries_volume_user,
          pooled_libraries_fragment_size_user:
            data.pooled_libraries_fragment_size_user,
          records: Ext.Array.pluck(store.data.items, "data"),
          files: form.down("requestfilegridfield").getValue(),
        }),
      },

      success: function (response) {
        var obj = Ext.JSON.decode(response.responseText);

        if (obj.success) {
          var message;

          if (wnd.mode === "add") {
            message = "The request has been saved successfully.";
          } else {
            message = "Changes have been saved successfully.";
          }

          new Noty({ text: message }).show();
          Ext.getStore("requestsStore").reload();
        } else {
          new Noty({ text: obj.message, type: "error" }).show();
          console.error(response);
        }

        wnd.close();
      },

      failure: function (response) {
        wnd.setLoading(false);
        var responseText = response.responseText
          ? Ext.JSON.decode(response.responseText)
          : null;
        responseText = responseText.message
          ? responseText.message
          : "Unknown error.";
        responseText = response.statusText ? response.statusText : responseText;
        new Noty({ text: responseText, type: "error" }).show();
        console.error(response);
      }
    });
  },

  onRequestWindowBeforeClose: function (wnd) {
    var librariesInRequestStore = Ext.getStore("librariesInRequestStore");
    if (librariesInRequestStore) {
      librariesInRequestStore.removeAll();
    }
    var librariesInRequestGrid = wnd.down("#libraries-in-request-grid");
    if (librariesInRequestGrid) {
      librariesInRequestGrid.getView().refresh();
    }
  },

  initializeTooltips: function () {
    $.each($(".request-field-tooltip"), function (idx, item) {
      Ext.create("Ext.tip.ToolTip", {
        title: "Help",
        target: item,
        html: $(item).attr("tooltip-text"),
        dismissDelay: 15000,
        maxWidth: 300
      });
    });
  },

  showBatchAddWindow: function () {
    var form = Ext.getCmp("request-form");

    // Set pool fields to optional, if enabled before opening
    // BatchAddWindow to avoid raising form validation errors
    // at this point
    [
      "#pooled-libraries",
      "#pooled-libraries-concentration",
      "#pooled-libraries-volume",
      "#pooled-libraries-fragment-size",
    ].map(function (e) {
      var field = form.down(e);
      if (!field.disabled) {
        field.allowBlank = true;
      }
    });

    if (form.isValid()) {
      var wnd = form.up("window");
      Ext.create("MainHub.view.libraries.BatchAddWindow", {
        mode: "add"
      });
    } else {
      new Noty({
        text:
          "Please fill in all the required fields for " +
          "a request before adding new libraries/samples.",
        type: "warning"
      }).show();
    }
  },

  disableButtonsAndMenus: function () {
    if (!(USER.is_staff || USER.member_of_bcf)) {
      var grid = Ext.getCmp("libraries-in-request-grid");
      // Don't add new records to a Request
      grid.down("#batch-add-button").disable();
      grid.suspendEvent("itemcontextmenu");
    }
  },

  getSelectedItems: function () {
    var store = Ext.getStore("librariesInRequestStore");
    var selectedItems = [];

    store.each(function (item) {
      if (item.get("selected")) {
        selectedItems.push({
          pk: item.get("pk"),
          name: item.get("name"),
          record_type: item.get("record_type")
        });
      }
    });

    return selectedItems;
  },

  _togglePoolFields: function (store) {
    // If all records are libraries show/hide all the fields realted a pool of libraries
    var records = store.getRange();
    var showPoolFields = store.data.length
      ? records.every(function (e) {
          return e.data.record_type === "Library";
        })
      : false;
    var requestGrid = Ext.getCmp("request-form");
    var pooledRequestCb = requestGrid.down("#pooled-libraries");
    var poolConcentrationBox = requestGrid.down(
      "#pooled-libraries-concentration"
    );
    var poolVolumeBox = requestGrid.down("#pooled-libraries-volume");
    var poolSizeBox = requestGrid.down("#pooled-libraries-fragment-size");
    var poolFields = [
      pooledRequestCb,
      poolConcentrationBox,
      poolVolumeBox,
      poolSizeBox,
    ];
    if (showPoolFields) {
      poolFields.map(function (e) {
        e.enable();
      });
      pooledRequestCb.setValue(true);
    } else {
      poolFields.map(function (e) {
        e.disable();
      });
      pooledRequestCb.setValue(false);
      poolConcentrationBox.setValue(null);
      poolVolumeBox.setValue(null);
      poolSizeBox.setValue(null);
    }
  },

  exportLibrariesExcel: function (btn) {
    var requestId = btn.up("window").record.get("pk");
    var url = Ext.String.format(
      "api/requests/{0}/download_libraries_excel/",
      requestId
    );
    var downloadForm = Ext.create("Ext.form.Panel", { standardSubmit: true });
    downloadForm.submit({ url: url, method: "GET" });
  },
});
