/**
 * Plugin to add header resizing functionality to a HeaderContainer.
 * Always resizing header to the left of the splitter you are resizing.
 */
Ext.define("Ext.grid.plugin.HeaderResizer", {
  extend: "Ext.plugin.Abstract",
  requires: ["Ext.dd.DragTracker", "Ext.util.Region"],
  alias: "plugin.gridheaderresizer",

  disabled: false,

  config: {
    /**
     * @cfg {Boolean} dynamic
     * True to resize on the fly rather than using a proxy marker.
     * @accessor
     */
    dynamic: false
  },

  colHeaderCls: Ext.baseCSSPrefix + "column-header",

  minColWidth: 40,
  maxColWidth: 1000,
  eResizeCursor: "col-resize",

  init: function (headerCt) {
    var me = this;

    me.headerCt = headerCt;
    headerCt.on("render", me.afterHeaderRender, me, { single: me });

    // Pull minColWidth from the minWidth in the Column prototype
    if (!me.minColWidth) {
      me.self.prototype.minColWidth = Ext.grid.column.Column.prototype.minWidth;
    }
  },

  destroy: function () {
    var me = this,
      tracker = me.tracker;

    if (tracker) {
      tracker.destroy();
      me.tracker = null;
    }

    // The grid may happen to never render
    me.headerCt.un("render", me.afterHeaderRender, me);
    me.headerCt = null;

    me.callParent();
  },

  afterHeaderRender: function () {
    var me = this,
      headerCt = me.headerCt,
      el = headerCt.el;

    headerCt.mon(el, "mousemove", me.onHeaderCtMouseMove, me);
    me.markerOwner = me.ownerGrid = me.headerCt.up("tablepanel").ownerGrid;

    me.tracker = new Ext.dd.DragTracker({
      disabled: me.disabled,
      onBeforeStart: me.onBeforeStart.bind(me),
      onStart: me.onStart.bind(me),
      onDrag: me.onDrag.bind(me),
      onEnd: me.onEnd.bind(me),
      onCancel: me.onCancel.bind(me),
      tolerance: 3,
      autoStart: 300,
      el: el
    });

    headerCt.setTouchAction({ panX: false });
  },

  // As we mouse over individual headers, change the cursor to indicate
  // that resizing is available, and cache the resize target header for use
  // if/when they mousedown.
  onHeaderCtMouseMove: function (e) {
    var me = this;

    if (me.headerCt.dragging || me.disabled) {
      if (me.activeHd) {
        me.activeHd.el.dom.style.cursor = "";
        delete me.activeHd;
      }
    } else if (e.pointerType !== "touch") {
      me.findActiveHeader(e);
    }
  },

  findActiveHeader: function (e) {
    var me = this,
      headerCt = me.headerCt,
      headerEl = e.getTarget("." + me.colHeaderCls, headerCt.el, true),
      ownerGrid = me.ownerGrid,
      ownerLockable = ownerGrid.ownerLockable,
      overHeader,
      resizeHeader,
      headers,
      header;

    me.activeHd = null;
    if (headerEl) {
      overHeader = Ext.getCmp(headerEl.id);

      // If near the right edge, we're resizing the column we are over.
      if (overHeader.isAtEndEdge(e)) {
        // Cannot resize the only column in a forceFit grid.
        if (
          headerCt.visibleColumnManager.getColumns().length === 1 &&
          headerCt.forceFit
        ) {
          return;
        }

        resizeHeader = overHeader;
      }
      // Else... we might be near the right edge
      else if (overHeader.isAtStartEdge(e)) {
        // Extract previous visible leaf header
        headers = headerCt.visibleColumnManager.getColumns();
        header = overHeader.isGroupHeader
          ? overHeader.getGridColumns()[0]
          : overHeader;
        resizeHeader = headers[Ext.Array.indexOf(headers, header) - 1];

        // If there wasn't one, and we are the normal side of a lockable assembly then
        // use the last visible leaf header of the locked side.
        if (!resizeHeader && ownerLockable && !ownerGrid.isLocked) {
          headers =
            ownerLockable.lockedGrid.headerCt.visibleColumnManager.getColumns();
          resizeHeader = headers[headers.length - 1];
        }
      }
      // We *are* resizing
      if (resizeHeader) {
        // If we're attempting to resize a group header, that cannot be resized,
        // so find its last visible leaf header; Group headers are sized
        // by the size of their child headers.
        if (resizeHeader.isGroupHeader) {
          headers = resizeHeader.getGridColumns();
          resizeHeader = headers[headers.length - 1];
        }

        // Check if the header is resizable. Continue checking the old "fixed" property, bug also
        // check whether the resizable property is set to false.
        if (
          resizeHeader &&
          !(resizeHeader.fixed || resizeHeader.resizable === false)
        ) {
          me.activeHd = resizeHeader;
          overHeader.el.dom.style.cursor = me.eResizeCursor;
          if (overHeader.triggerEl) {
            overHeader.triggerEl.dom.style.cursor = me.eResizeCursor;
          }
        }
        // reset
      } else {
        overHeader.el.dom.style.cursor = "";
        if (overHeader.triggerEl) {
          overHeader.triggerEl.dom.style.cursor = "";
        }
      }
    }
    return me.activeHd;
  },

  // only start when there is an activeHd
  onBeforeStart: function (e) {
    var me = this;

    // If on touch, we will have received no mouseover, so we have to
    // decide whether the touchstart is in a resize zone, and if so, which header is to be sized.
    // Cache any activeHd because it will be cleared on subsequent mousemoves outside the resize zone.
    me.dragHd =
      me.activeHd || (e.pointerType === "touch" && me.findActiveHeader(e));

    if (me.dragHd && !me.headerCt.dragging) {
      // Prevent drag and longpress gestures being triggered by this mousedown
      e.claimGesture();

      // Calculate how far off the right marker line the mouse pointer is.
      // This will be the xDelta during the following drag operation.
      me.xDelta =
        me.dragHd.getX() + me.dragHd.getWidth() - me.tracker.getXY()[0];
      me.tracker.constrainTo = me.getConstrainRegion();
      return true;
    } else {
      me.headerCt.dragging = false;
      return false;
    }
  },

  // When mouseup and we have not begun dragging.
  // The setup done in onbeforeStart must be cleared.
  onCancel: function (e) {
    this.dragHd = this.activeHd = null;
    this.headerCt.dragging = false;
  },

  // get the region to constrain to, takes into account max and min col widths
  getConstrainRegion: function () {
    var me = this,
      dragHdEl = me.dragHd.el,
      nextHd,
      ownerGrid = me.ownerGrid,
      widthModel = ownerGrid.getSizeModel().width,
      maxColWidth = widthModel.shrinkWrap
        ? me.headerCt.getWidth() -
          me.headerCt.visibleColumnManager.getColumns().length * me.minColWidth
        : me.maxColWidth,
      result;

    // If forceFit, then right constraint is based upon not being able to force the next header
    // beyond the minColWidth. If there is no next header, then the header may not be expanded.
    if (me.headerCt.forceFit) {
      nextHd = me.dragHd.nextNode(
        "gridcolumn:not([hidden]):not([isGroupHeader])"
      );
      if (nextHd && me.headerInSameGrid(nextHd)) {
        maxColWidth =
          dragHdEl.getWidth() + (nextHd.getWidth() - me.minColWidth);
      }
    }

    // If resize header is in a locked grid, the maxWidth has to be 30px within the available locking grid's width
    // But only if the locked grid shrinkwraps its columns
    else if (ownerGrid.isLocked && widthModel.shrinkWrap) {
      maxColWidth =
        me.dragHd.up("[scrollerOwner]").getTargetEl().getWidth(true) -
        ownerGrid.getWidth() -
        (ownerGrid.ownerLockable.normalGrid.visibleColumnManager.getColumns()
          .length *
          me.minColWidth +
          Ext.getScrollbarSize().width);
    }

    result = me.adjustConstrainRegion(
      dragHdEl.getRegion(),
      0,
      0,
      0,
      me.minColWidth
    );
    result.right = dragHdEl.getX() + maxColWidth;
    return result;
  },

  // initialize the left and right hand side markers around
  // the header that we are resizing
  onStart: function (e) {
    var me = this,
      dragHd = me.dragHd,
      width = dragHd.el.getWidth(),
      headerCt = dragHd.getRootHeaderCt(),
      x,
      y,
      markerOwner,
      lhsMarker,
      rhsMarker,
      markerHeight;

    me.headerCt.dragging = true;
    me.origWidth = width;

    // setup marker proxies
    if (!me.dynamic) {
      markerOwner = me.markerOwner;

      // https://sencha.jira.com/browse/EXTJSIV-11299
      // In Neptune (and other themes with wide frame borders), resize handles are embedded in borders,
      // *outside* of the outer element's content area, therefore the outer element is set to overflow:visible.
      // During column resize, we should not see the resize markers outside the grid, so set to overflow:hidden.
      if (markerOwner.frame && markerOwner.resizable) {
        me.gridOverflowSetting = markerOwner.el.dom.style.overflow;
        markerOwner.el.dom.style.overflow = "hidden";
      }
      x = me.getLeftMarkerX(markerOwner);
      lhsMarker = markerOwner.getLhsMarker();
      rhsMarker = markerOwner.getRhsMarker();
      markerHeight = me.ownerGrid.body.getHeight() + headerCt.getHeight();
      y =
        headerCt.getOffsetsTo(markerOwner)[1] -
        markerOwner.el.getBorderWidth("t");

      // Ensure the markers have the correct cursor in case the cursor is *exactly* over
      // this single pixel line, not just within the active resize zone
      lhsMarker.dom.style.cursor = me.eResizeCursor;
      rhsMarker.dom.style.cursor = me.eResizeCursor;

      lhsMarker.setLocalY(y);
      rhsMarker.setLocalY(y);
      lhsMarker.setHeight(markerHeight);
      rhsMarker.setHeight(markerHeight);
      me.setMarkerX(lhsMarker, x);
      me.setMarkerX(rhsMarker, x + width);
    }
  },

  // synchronize the rhsMarker with the mouse movement
  onDrag: function (e) {
    var me = this;

    if (me.dynamic) {
      me.doResize();
    } else {
      me.setMarkerX(
        me.getMovingMarker(me.markerOwner),
        me.calculateDragX(me.markerOwner)
      );
    }
  },

  getMovingMarker: function (markerOwner) {
    return markerOwner.getRhsMarker();
  },

  onEnd: function (e) {
    var me = this,
      markerOwner = me.markerOwner;

    me.headerCt.dragging = false;
    if (me.dragHd) {
      if (!me.dynamic) {
        // If we had saved the gridOverflowSetting, restore it
        if ("gridOverflowSetting" in me) {
          markerOwner.el.dom.style.overflow = me.gridOverflowSetting;
        }

        // hide markers
        me.setMarkerX(markerOwner.getLhsMarker(), -9999);
        me.setMarkerX(markerOwner.getRhsMarker(), -9999);
      }
      me.doResize();

      // On mouseup (a real mouseup), we must be ready to start dragging again immediately -
      // Leave the activeHd active.
      if (e.pointerType !== "touch") {
        me.dragHd = null;
        me.activeHd.el.dom.style.cursor = me.eResizeCursor;
      } else {
        me.dragHd = me.activeHd = null;
      }
    }

    // Do not process the upcoming click after this mouseup. It's not a click gesture
    me.headerCt.blockNextEvent();
  },

  doResize: function () {
    var me = this,
      dragHd = me.dragHd,
      nextHd,
      offset = me.tracker.getOffset("point");

    // Only resize if we have dragged any distance in the X dimension...
    if (dragHd && offset[0]) {
      // resize the dragHd
      if (dragHd.flex) {
        delete dragHd.flex;
      }

      Ext.suspendLayouts();

      // Set the new column width.
      // Adjusted for the offset from the actual column border that the mousedownb too place at.
      me.adjustColumnWidth(offset[0] - me.xDelta);

      // In the case of forceFit, change the following Header width.
      // Constraining so that neither neighbour can be sized to below minWidth is handled in getConstrainRegion
      if (me.headerCt.forceFit) {
        nextHd = dragHd.nextNode(
          "gridcolumn:not([hidden]):not([isGroupHeader])"
        );
        if (nextHd && !me.headerInSameGrid(nextHd)) {
          nextHd = null;
        }
        if (nextHd) {
          delete nextHd.flex;
          nextHd.setWidth(nextHd.getWidth() - offset[0]);
        }
      }

      // Apply the two width changes by laying out the owning HeaderContainer
      Ext.resumeLayouts(true);
    }
  },

  // nextNode can traverse out of this grid, possibly to others on the page, so limit it here
  headerInSameGrid: function (header) {
    var grid = this.dragHd.up("tablepanel");

    return !!header.up(grid);
  },

  disable: function () {
    var tracker = this.tracker;
    this.disabled = true;
    if (tracker) {
      tracker.disable();
    }
  },

  enable: function () {
    var tracker = this.tracker;
    this.disabled = false;
    if (tracker) {
      tracker.enable();
    }
  },

  calculateDragX: function (markerOwner) {
    return (
      this.tracker.getXY("point")[0] +
      this.xDelta -
      markerOwner.getX() -
      markerOwner.el.getBorderWidth("l")
    );
  },

  getLeftMarkerX: function (markerOwner) {
    return (
      this.dragHd.getX() -
      markerOwner.getX() -
      markerOwner.el.getBorderWidth("l") -
      1
    );
  },

  setMarkerX: function (marker, x) {
    marker.setLocalX(x);
  },

  adjustConstrainRegion: function (region, t, r, b, l) {
    return region.adjust(t, r, b, l);
  },

  adjustColumnWidth: function (offsetX) {
    this.dragHd.setWidth(this.origWidth + offsetX);
  }
});
