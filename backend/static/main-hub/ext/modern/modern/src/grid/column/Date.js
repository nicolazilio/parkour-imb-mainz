/**
 * A Column definition class which renders a passed date according to the default locale, or a configured
 * {@link #format}.
 *
 *     @example
 *     var store = Ext.create('Ext.data.Store', {
 *         fields:[
 *             { name: 'symbol', type: 'string' },
 *             { name: 'date',   type: 'date' },
 *             { name: 'change', type: 'number' },
 *             { name: 'volume', type: 'number' },
 *             { name: 'topday', type: 'date' }
 *         ],
 *         data:[
 *             { symbol: "msft",   date: '2011/04/22', change: 2.43, volume: 61606325, topday: '04/01/2010' },
 *             { symbol: "goog",   date: '2011/04/22', change: 0.81, volume: 3053782,  topday: '04/11/2010' },
 *             { symbol: "apple",  date: '2011/04/22', change: 1.35, volume: 24484858, topday: '04/28/2010' },
 *             { symbol: "sencha", date: '2011/04/22', change: 8.85, volume: 5556351,  topday: '04/22/2010' }
 *         ]
 *     });
 *
 *     Ext.create('Ext.grid.Grid', {
 *         title: 'Date Column Demo',
 *         store: store,
 *         columns: [
 *             { text: 'Symbol',   dataIndex: 'symbol', flex: 1 },
 *             { text: 'Date',     dataIndex: 'date',   xtype: 'datecolumn',   format:'Y-m-d' },
 *             { text: 'Change',   dataIndex: 'change', xtype: 'numbercolumn', format:'0.00' },
 *             { text: 'Volume',   dataIndex: 'volume', xtype: 'numbercolumn', format:'0,000' },
 *             { text: 'Top Day',  dataIndex: 'topday', xtype: 'datecolumn',   format:'l' }
 *         ],
 *         height: 200,
 *         width: 450
 *     });
 */
Ext.define("Ext.grid.column.Date", {
  extend: "Ext.grid.column.Column",

  requires: ["Ext.Date", "Ext.grid.cell.Date"],

  xtype: "datecolumn",

  config: {
    /**
     * @cfg {String} format (required)
     * A format string as used by {@link Ext.Date#format} to format values for this
     * column.
     */
    format: null,

    defaultEditor: {
      xtype: "datepickerfield"
    },

    cell: {
      xtype: "datecell"
    }
  }
});
