/**
 * This class provides a container DD instance that allows dragging of multiple child source nodes.
 *
 * This class does not move the drag target nodes, but a proxy element which may contain any DOM structure you wish. The
 * DOM element to show in the proxy is provided by either a provided implementation of {@link #getDragData}, or by
 * registered draggables registered with {@link Ext.dd.Registry}
 *
 * If you wish to provide draggability for an arbitrary number of DOM nodes, each of which represent some application
 * object (For example nodes in a {@link Ext.view.View DataView}) then use of this class is the most efficient way to
 * "activate" those nodes.
 *
 * By default, this class requires that draggable child nodes are registered with {@link Ext.dd.Registry}. However a
 * simpler way to allow a DragZone to manage any number of draggable elements is to configure the DragZone with an
 * implementation of the {@link #getDragData} method which interrogates the passed mouse event to see if it has taken
 * place within an element, or class of elements. This is easily done by using the event's {@link
 * Ext.event.Event#getTarget getTarget} method to identify a node based on a CSS selector. For example,
 * to make the nodes of a DataView draggable, use the following technique. Knowledge of the use of the DataView is
 * required:
 *
 *     myDataView.on('render', function(v) {
 *         myDataView.dragZone = new Ext.dd.DragZone(v.getEl(), {
 *
 *     //      On receipt of a mousedown event, see if it is within a DataView node.
 *     //      Return a drag data object if so.
 *             getDragData: function(e) {
 *
 *     //          Use the DataView's own itemSelector (a mandatory property) to
 *     //          test if the mousedown is within one of the DataView's nodes.
 *                 var sourceEl = e.getTarget(v.itemSelector, 10);
 *
 *     //          If the mousedown is within a DataView node, clone the node to produce
 *     //          a ddel element for use by the drag proxy. Also add application data
 *     //          to the returned data object.
 *                 if (sourceEl) {
 *                     d = sourceEl.cloneNode(true);
 *                     d.id = Ext.id();
 *                     return {
 *                         ddel: d,
 *                         sourceEl: sourceEl,
 *                         repairXY: Ext.fly(sourceEl).getXY(),
 *                         sourceStore: v.store,
 *                         draggedRecord: v.getRecord(sourceEl)
 *                     }
 *                 }
 *             },
 *
 *     //      Provide coordinates for the proxy to slide back to on failed drag.
 *     //      This is the original XY coordinates of the draggable element captured
 *     //      in the getDragData method.
 *             getRepairXY: function() {
 *                 return this.dragData.repairXY;
 *             }
 *         });
 *     });
 *
 * See the {@link Ext.dd.DropZone DropZone} documentation for details about building a DropZone which cooperates with
 * this DragZone.
 */
Ext.define("Ext.dd.DragZone", {
  extend: "Ext.dd.DragSource",

  /**
   * Creates new DragZone.
   * @param {String/HTMLElement/Ext.dom.Element} el The container element or ID of it.
   * @param {Object} config
   */
  constructor: function (el, config) {
    var me = this,
      scroll;

    me.callParent([el, config]);

    scroll = me.containerScroll;

    if (scroll) {
      el = me.scrollEl || el;
      el = Ext.get(el);
      if (Ext.isObject(scroll)) {
        el.ddScrollConfig = scroll;
      }
      Ext.dd.ScrollManager.register(el);
    }
  },

  /**
   * @cfg {Object/Boolean} containerScroll
   * True to register this container with the Scrollmanager for auto scrolling during drag operations.
   * A {@link Ext.dd.ScrollManager} configuration may also be passed.
   */

  /**
   * @cfg {String/HTMLElement/Ext.dom.Element} scrollEl
   * An element to register with the ScrollManager if {@link #containerScroll}
   * is set. Defaults to the drag element.
   */

  /**
   * Called when a mousedown occurs in this container. Looks in {@link Ext.dd.Registry} for a valid target to drag
   * based on the mouse down. Override this method to provide your own lookup logic (e.g. finding a child by class
   * name). Make sure your returned object has a "ddel" attribute (with an HTML Element) for other functions to work.
   * @param {Event} e The mouse down event
   * @return {Object} The dragData
   */
  getDragData: function (e) {
    return Ext.dd.Registry.getHandleFromEvent(e);
  },

  /**
   * Called once drag threshold has been reached to initialize the proxy element. By default, it clones the
   * this.dragData.ddel
   * @param {Number} x The x position of the click on the dragged object
   * @param {Number} y The y position of the click on the dragged object
   * @return {Boolean} true to continue the drag, false to cancel
   * @template
   */
  onInitDrag: function (x, y) {
    this.proxy.update(this.dragData.ddel.cloneNode(true));
    this.onStartDrag(x, y);
    return true;
  },

  /**
   * Called before a repair of an invalid drop to get the XY to animate to. By default returns the XY of
   * this.dragData.ddel
   * @param {Event} e The mouse up event
   * @return {Number[]} The xy location (e.g. `[100, 200]`)
   * @template
   */
  getRepairXY: function (e) {
    return Ext.fly(this.dragData.ddel).getXY();
  },

  destroy: function () {
    if (this.containerScroll) {
      Ext.dd.ScrollManager.unregister(this.scrollEl || this.el);
    }

    this.callParent();
  }
});
