/**
 * Small helper class to create an {@link Ext.data.Store} configured with an {@link Ext.data.proxy.Direct}
 * and {@link Ext.data.reader.Json} to make interacting with an {@link Ext.direct.Manager} server-side
 * {@link Ext.direct.Provider Provider} easier. To create a different proxy/reader combination create a basic
 * {@link Ext.data.Store} configured as needed.
 *
 * **Note:** Although they are not listed, this class inherits all of the config options of:
 *
 * - **{@link Ext.data.Store Store}**
 *
 * - **{@link Ext.data.reader.Json JsonReader}**
 *
 *   - **{@link Ext.data.reader.Json#cfg-rootProperty rootProperty}**
 *   - **{@link Ext.data.reader.Json#totalProperty totalProperty}**
 *
 * - **{@link Ext.data.proxy.Direct DirectProxy}**
 *
 *   - **{@link Ext.data.proxy.Direct#directFn directFn}**
 *   - **{@link Ext.data.proxy.Direct#paramOrder paramOrder}**
 *   - **{@link Ext.data.proxy.Direct#paramsAsHash paramsAsHash}**
 *
 */
Ext.define("Ext.data.DirectStore", {
  /* Begin Definitions */

  extend: "Ext.data.Store",

  alias: "store.direct",

  requires: ["Ext.data.proxy.Direct"],

  /* End Definitions */

  constructor: function (config) {
    config = Ext.apply({}, config);
    if (!config.proxy) {
      var proxy = {
        type: "direct",
        reader: {
          type: "json"
        }
      };
      Ext.copyTo(
        proxy,
        config,
        "paramOrder,paramsAsHash,directFn,api,simpleSortMode,extraParams"
      );
      Ext.copyTo(
        proxy.reader,
        config,
        "totalProperty,root,rootProperty,idProperty"
      );
      config.proxy = proxy;
    }
    this.callParent([config]);
  }
});
