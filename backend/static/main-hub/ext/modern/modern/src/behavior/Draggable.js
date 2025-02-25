/**
 * @private
 */
Ext.define("Ext.behavior.Draggable", {
  extend: "Ext.behavior.Behavior",

  requires: ["Ext.util.Draggable"],

  setConfig: function (config) {
    var draggable = this.draggable,
      component = this.component,
      listeners = this.listeners;

    if (config) {
      if (!draggable) {
        component.setTranslatable(config.translatable);
        this.draggable = draggable = new Ext.util.Draggable(config);
        draggable.setTranslatable(component.getTranslatable());
        draggable.setElement(component.renderElement);
        draggable.on("destroy", "onDraggableDestroy", this);

        if (listeners) {
          component.on(listeners);
        }
      } else if (Ext.isObject(config)) {
        draggable.setConfig(config);
      }
    } else if (draggable) {
      draggable.destroy();
    }

    return this;
  },

  getDraggable: function () {
    return this.draggable;
  },

  onDraggableDestroy: function () {
    delete this.draggable;
  },

  onComponentDestroy: function () {
    var draggable = this.draggable;

    if (draggable) {
      draggable.destroy();
    }
  }
});
