/**
 * This layout allows you to easily render content into an HTML table. The total number of columns can be specified, and
 * rowspan and colspan can be used to create complex layouts within the table. This class is intended to be extended or
 * created via the `layout: {type: 'table'}` {@link Ext.container.Container#layout} config, and should generally not
 * need to be created directly via the new keyword.
 *
 * Note that when creating a layout via config, the layout-specific config properties must be passed in via the {@link
 * Ext.container.Container#layout} object which will then be applied internally to the layout. In the case of
 * TableLayout, the only valid layout config properties are {@link #columns} and {@link #tableAttrs}. However, the items
 * added to a TableLayout can supply the following table-specific config properties:
 *
 *   - **rowspan** Applied to the table cell containing the item.
 *   - **colspan** Applied to the table cell containing the item.
 *   - **cellCls** A CSS class name added to the table cell containing the item.
 *
 * The basic concept of building up a TableLayout is conceptually very similar to building up a standard HTML table. You
 * simply add each panel (or "cell") that you want to include along with any span attributes specified as the special
 * config properties of rowspan and colspan which work exactly like their HTML counterparts. Rather than explicitly
 * creating and nesting rows and columns as you would in HTML, you simply specify the total column count in the
 * layout config and start adding panels in their natural order from left to right, top to bottom. The layout will
 * automatically figure out, based on the column count, rowspans and colspans, how to position each panel within the
 * table. Just like with HTML tables, your rowspans and colspans must add up correctly in your overall layout or you'll
 * end up with missing and/or extra cells! Example usage:
 *
 *     @example
 *     Ext.create('Ext.panel.Panel', {
 *         title: 'Table Layout',
 *         width: 300,
 *         height: 150,
 *         layout: {
 *             type: 'table',
 *             // The total column count must be specified here
 *             columns: 3
 *         },
 *         defaults: {
 *             // applied to each contained panel
 *             bodyStyle: 'padding:20px'
 *         },
 *         items: [{
 *             html: 'Cell A content',
 *             rowspan: 2
 *         },{
 *             html: 'Cell B content',
 *             colspan: 2
 *         },{
 *             html: 'Cell C content',
 *             cellCls: 'highlight'
 *         },{
 *             html: 'Cell D content'
 *         }],
 *         renderTo: Ext.getBody()
 *     });
 */
Ext.define("Ext.layout.container.Table", {
  /* Begin Definitions */

  alias: ["layout.table"],
  extend: "Ext.layout.container.Container",
  alternateClassName: "Ext.layout.TableLayout",

  /* End Definitions */

  /**
   * @cfg {Number} columns
   * The total number of columns to create in the table for this layout. If not specified, all Components added to
   * this layout will be rendered into a single row using one column per Component.
   */

  type: "table",

  createsInnerCt: true,

  targetCls: Ext.baseCSSPrefix + "table-layout-ct",
  tableCls: Ext.baseCSSPrefix + "table-layout",
  cellCls: Ext.baseCSSPrefix + "table-layout-cell",

  childEls: ["table", "tbody"],

  /**
   * @cfg {Object} tableAttrs
   * An object containing properties which are added to the {@link Ext.dom.Helper DomHelper} specification used to
   * create the layout's `<table>` element. Example:
   *
   *     {
   *         xtype: 'panel',
   *         layout: {
   *             type: 'table',
   *             columns: 3,
   *             tableAttrs: {
   *                 style: {
   *                     width: '100%'
   *                 }
   *             }
   *         }
   *     }
   */
  tableAttrs: null,

  /**
   * @cfg {Object} trAttrs
   * An object containing properties which are added to the {@link Ext.dom.Helper DomHelper} specification used to
   * create the layout's `<tr>` elements.
   */

  /**
   * @cfg {Object} tdAttrs
   * An object containing properties which are added to the {@link Ext.dom.Helper DomHelper} specification used to
   * create the layout's `<td>` elements.
   */

  getItemSizePolicy: function (item) {
    return this.autoSizePolicy;
  },

  initInheritedState: function (inheritedState, inheritedStateInner) {
    inheritedStateInner.inShrinkWrapTable = true;
  },

  getLayoutItems: function () {
    var me = this,
      result = [],
      items = me.callParent(),
      len = items.length,
      item,
      i;

    for (i = 0; i < len; i++) {
      item = items[i];
      if (!item.hidden) {
        result.push(item);
      }
    }
    return result;
  },

  getHiddenItems: function () {
    var result = [],
      items = this.owner.items.items,
      len = items.length,
      i,
      item;

    for (i = 0; i < len; ++i) {
      item = items[i];
      if (item.rendered && item.hidden) {
        result.push(item);
      }
    }
    return result;
  },

  /**
   * @private
   * Iterates over all passed items, ensuring they are rendered in a cell in the proper
   * location in the table structure.
   */
  renderChildren: function () {
    var me = this,
      items = me.getLayoutItems(),
      tbody = me.tbody.dom,
      rows = tbody.rows,
      len = items.length,
      hiddenItems = me.getHiddenItems(),
      cells,
      curCell,
      rowIdx,
      cellIdx,
      item,
      trEl,
      tdEl,
      i;

    // Calculate the correct cell structure for the current items
    cells = me.calculateCells(items);

    // Loop over each cell and compare to the current cells in the table, inserting/
    // removing/moving cells as needed, and making sure each item is rendered into
    // the correct cell.
    for (i = 0; i < len; i++) {
      curCell = cells[i];
      rowIdx = curCell.rowIdx;
      cellIdx = curCell.cellIdx;
      item = items[i];

      // If no row present, create and insert one
      trEl = rows[rowIdx];
      if (!trEl) {
        trEl = tbody.insertRow(rowIdx);
        if (me.trAttrs) {
          trEl.set(me.trAttrs);
        }
      }

      // If no cell present, create and insert one
      tdEl = Ext.get(trEl.cells[cellIdx] || trEl.insertCell(cellIdx));

      // Render or move the component into the cell
      if (!item.rendered) {
        me.renderItem(item, tdEl, 0);
      } else if (!me.isValidParent(item, tdEl, rowIdx, cellIdx, tbody)) {
        me.moveItem(item, tdEl, 0);
      }

      // Set the cell properties
      if (me.tdAttrs) {
        tdEl.set(me.tdAttrs);
      }
      if (item.tdAttrs) {
        tdEl.set(item.tdAttrs);
      }
      tdEl.set({
        colSpan: item.colspan || 1,
        rowSpan: item.rowspan || 1,
        cls: me.cellCls + " " + (item.cellCls || "")
      });

      // If at the end of a row, remove any extra cells
      if (!cells[i + 1] || cells[i + 1].rowIdx !== rowIdx) {
        cellIdx++;
        while (trEl.cells[cellIdx]) {
          trEl.deleteCell(cellIdx);
        }
      }
    }

    // Delete any extra rows
    rowIdx++;
    while (tbody.rows[rowIdx]) {
      tbody.deleteRow(rowIdx);
    }

    // Check if we've removed any cells that contain a component, we need to move
    // them so they don't get cleaned up by the gc
    for (i = 0, len = hiddenItems.length; i < len; ++i) {
      me.ensureInDocument(hiddenItems[i].getEl());
    }
  },

  ensureInDocument: function (el) {
    var dom = el.dom.parentNode;
    while (dom) {
      if (dom.tagName.toUpperCase() === "BODY") {
        return;
      }
      dom = dom.parentNode;
    }

    Ext.getDetachedBody().appendChild(el);
  },

  calculate: function (ownerContext) {
    if (!ownerContext.hasDomProp("containerChildrenSizeDone")) {
      this.done = false;
    } else {
      var targetContext = ownerContext.targetContext,
        widthShrinkWrap = ownerContext.widthModel.shrinkWrap,
        heightShrinkWrap = ownerContext.heightModel.shrinkWrap,
        shrinkWrap = heightShrinkWrap || widthShrinkWrap,
        table = shrinkWrap && this.table.dom,
        targetPadding = shrinkWrap && targetContext.getPaddingInfo();

      if (widthShrinkWrap) {
        ownerContext.setContentWidth(
          table.offsetWidth + targetPadding.width,
          true
        );
      }

      if (heightShrinkWrap) {
        ownerContext.setContentHeight(
          table.offsetHeight + targetPadding.height,
          true
        );
      }
    }
  },

  /**
   * @private
   * Determine the row and cell indexes for each component, taking into consideration
   * the number of columns and each item's configured colspan/rowspan values.
   * @param {Array} items The layout components
   * @return {Object[]} List of row and cell indexes for each of the components
   */
  calculateCells: function (items) {
    var cells = [],
      rowIdx = 0,
      colIdx = 0,
      cellIdx = 0,
      totalCols = this.columns || Infinity,
      rowspans = [], //rolling list of active rowspans for each column
      len = items.length,
      item,
      i,
      j;

    for (i = 0; i < len; i++) {
      item = items[i];

      // Find the first available row/col slot not taken up by a spanning cell
      while (colIdx >= totalCols || rowspans[colIdx] > 0) {
        if (colIdx >= totalCols) {
          // move down to next row
          colIdx = 0;
          cellIdx = 0;
          rowIdx++;

          // decrement all rowspans
          for (j = 0; j < totalCols; j++) {
            if (rowspans[j] > 0) {
              rowspans[j]--;
            }
          }
        } else {
          colIdx++;
        }
      }

      // Add the cell info to the list
      cells.push({
        rowIdx: rowIdx,
        cellIdx: cellIdx
      });

      // Increment
      for (j = item.colspan || 1; j; --j) {
        rowspans[colIdx] = item.rowspan || 1;
        ++colIdx;
      }
      ++cellIdx;
    }

    return cells;
  },

  getRenderTree: function () {
    var me = this,
      items = me.getLayoutItems(),
      rows = [],
      result = Ext.apply(
        {
          tag: "table",
          id: me.owner.id + "-table",
          "data-ref": "table",
          role: "presentation",
          cls: me.tableCls,
          cellspacing: 0,
          cellpadding: 0,
          cn: {
            tag: "tbody",
            id: me.owner.id + "-tbody",
            "data-ref": "tbody",
            role: "presentation",
            cn: rows
          }
        },
        me.tableAttrs
      ),
      tdAttrs = me.tdAttrs,
      i,
      len = items.length,
      item,
      curCell,
      tr,
      rowIdx,
      cellIdx,
      cell,
      cells;

    // Calculate the correct cell structure for the current items
    cells = me.calculateCells(items);

    for (i = 0; i < len; i++) {
      item = items[i];

      curCell = cells[i];
      rowIdx = curCell.rowIdx;
      cellIdx = curCell.cellIdx;

      // If no row present, create and insert one
      tr = rows[rowIdx];
      if (!tr) {
        tr = rows[rowIdx] = {
          tag: "tr",
          role: "presentation",
          cn: []
        };
        if (me.trAttrs) {
          Ext.apply(tr, me.trAttrs);
        }
      }

      // If no cell present, create and insert one
      cell = tr.cn[cellIdx] = {
        tag: "td",
        role: "presentation"
      };
      if (tdAttrs) {
        Ext.apply(cell, tdAttrs);
      }
      Ext.apply(cell, {
        colSpan: item.colspan || 1,
        rowSpan: item.rowspan || 1,
        cls: me.cellCls + " " + (item.cellCls || "")
      });

      me.configureItem(item);
      // The DomHelper config of the item is the cell's sole child
      cell.cn = item.getRenderTree();
    }
    return result;
  },

  isValidParent: function (item, target, rowIdx, cellIdx) {
    // If we were called with the 3 arg signature just check that the item is within our table,
    if (arguments.length === 3) {
      return this.table.isAncestor(item.el);
    }
    return (
      item.el.dom.parentNode === this.tbody.dom.rows[rowIdx].cells[cellIdx]
    );
  }
});
