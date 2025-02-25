Ext.define("Ext.ux.dd.PanelFieldDragZone", {
  extend: "Ext.dd.DragZone",
  alias: "plugin.ux-panelfielddragzone",

  scroll: false,

  constructor: function (cfg) {
    if (cfg) {
      if (cfg.ddGroup) {
        this.ddGroup = cfg.ddGroup;
      }
    }
  },

  init: function (panel) {
    var el;

    // Call the DragZone's constructor. The Panel must have been rendered.
    // Panel is an HtmlElement
    if (panel.nodeType) {
      // Called via dragzone::init
      Ext.ux.dd.PanelFieldDragZone.superclass.init.apply(this, arguments);
    }
    // Panel is a Component - need the el
    else {
      // Called via plugin::init
      if (panel.rendered) {
        el = panel.getEl();
        el.unselectable();
        Ext.ux.dd.PanelFieldDragZone.superclass.constructor.call(this, el);
      } else {
        panel.on("afterrender", this.init, this, { single: true });
      }
    }
  },

  getDragData: function (e) {
    // On mousedown, we ascertain whether it is on one of our draggable Fields.
    // If so, we collect data about the draggable object, and return a drag data
    // object which contains our own data, plus a "ddel" property which is a DOM
    // node which provides a "view" of the dragged data.
    var targetLabel = e.getTarget("label", null, true),
      text,
      oldMark,
      field,
      dragEl;

    if (targetLabel) {
      // Get the data we are dragging: the Field
      // create a ddel for the drag proxy to display
      field = Ext.getCmp(
        targetLabel.up("." + Ext.form.Labelable.prototype.formItemCls).id
      );
      // Temporary prevent marking the field as invalid, since it causes changes
      // to the underlying dom element which can cause problems in IE
      oldMark = field.preventMark;
      field.preventMark = true;

      if (field.isValid()) {
        field.preventMark = oldMark;
        dragEl = document.createElement("div");
        dragEl.className = Ext.baseCSSPrefix + "form-text";
        text = field.getRawValue();
        dragEl.innerHTML = Ext.isEmpty(text) ? "&#160;" : text;

        Ext.fly(dragEl).setWidth(field.getEl().getWidth());

        return {
          field: field,
          ddel: dragEl
        };
      }

      e.stopEvent();
      field.preventMark = oldMark;
    }
  },

  getRepairXY: function () {
    // The coordinates to slide the drag proxy back to on failed drop.
    return this.dragData.field.getEl().getXY();
  }
});
