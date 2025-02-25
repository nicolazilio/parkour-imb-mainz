/**
 * This class creates a multiline text field, which can be used as a direct replacement for traditional
 * textarea fields. In addition, it supports automatically {@link #grow growing} the height of the textarea to
 * fit its content.
 *
 * All of the configuration options from {@link Ext.form.field.Text} can be used on TextArea.
 *
 * Example usage:
 *
 *     @example
 *     Ext.create('Ext.form.FormPanel', {
 *         title      : 'Sample TextArea',
 *         width      : 400,
 *         bodyPadding: 10,
 *         renderTo   : Ext.getBody(),
 *         items: [{
 *             xtype     : 'textareafield',
 *             grow      : true,
 *             name      : 'message',
 *             fieldLabel: 'Message',
 *             anchor    : '100%'
 *         }]
 *     });
 *
 * Some other useful configuration options when using {@link #grow} are {@link #growMin} and {@link #growMax}.
 * These allow you to set the minimum and maximum grow heights for the textarea.
 *
 * **NOTE:** In some browsers, carriage returns ('\r', not to be confused with new lines)
 * will be automatically stripped out the value is set to the textarea. Since we cannot
 * use any reasonable method to attempt to re-insert these, they will automatically be
 * stripped out to ensure the behaviour is consistent across browser.
 */
Ext.define("Ext.form.field.TextArea", {
  extend: "Ext.form.field.Text",
  alias: ["widget.textareafield", "widget.textarea"],
  alternateClassName: "Ext.form.TextArea",
  requires: ["Ext.XTemplate", "Ext.util.DelayedTask"],

  // This template includes a `\n` after `<textarea>` opening tag so that an
  // initial value starting with `\n` does not lose its first character when
  // the markup is parsed. Both textareas below have the same value:
  //
  //     <textarea>initial value</textarea>
  //
  //     <textarea>
  //     initial value
  //     </textarea>
  //
  fieldSubTpl: [
    '<textarea id="{id}" data-ref="inputEl" {inputAttrTpl}',
    '<tpl if="name"> name="{name}"</tpl>',
    '<tpl if="placeholder"> placeholder="{placeholder}"</tpl>',
    '<tpl if="maxLength !== undefined"> maxlength="{maxLength}"</tpl>',
    '<tpl if="readOnly"> readonly="readonly"</tpl>',
    '<tpl if="disabled"> disabled="disabled"</tpl>',
    '<tpl if="tabIdx != null"> tabindex="{tabIdx}"</tpl>',
    ' class="{fieldCls} {typeCls} {typeCls}-{ui} {inputCls}" ',
    '<tpl if="fieldStyle"> style="{fieldStyle}"</tpl>',
    '<tpl foreach="ariaElAttributes"> {$}="{.}"</tpl>',
    '<tpl foreach="inputElAriaAttributes"> {$}="{.}"</tpl>',
    ' autocomplete="off">\n',
    '<tpl if="value">{[Ext.util.Format.htmlEncode(values.value)]}</tpl>',
    "</textarea>",
    {
      disableFormats: true
    }
  ],

  /**
   * @cfg {Number} growMin
   * The minimum height to allow when {@link #grow}=true
   */
  growMin: 60,

  /**
   * @cfg {Number} growMax
   * The maximum height to allow when {@link #grow}=true
   */
  growMax: 1000,

  /**
   * @cfg {String} growAppend
   * A string that will be appended to the field's current value for the purposes of calculating the target field
   * size. Only used when the {@link #grow} config is true. Defaults to a newline for TextArea to ensure there is
   * always a space below the current line.
   */
  growAppend: "\n-",

  /**
   * @cfg {Boolean} enterIsSpecial
   * True if you want the ENTER key to be classed as a special key and the {@link #specialkey} event to be fired
   * when ENTER is pressed.
   */
  enterIsSpecial: false,

  /**
   * @cfg {Boolean} preventScrollbars
   * true to prevent scrollbars from appearing regardless of how much text is in the field. This option is only
   * relevant when {@link #grow} is true. Equivalent to setting overflow: hidden.
   */
  preventScrollbars: false,

  returnRe: /\r/g,

  inputCls: Ext.baseCSSPrefix + "form-textarea",

  extraFieldBodyCls: Ext.baseCSSPrefix + "form-textarea-body",

  ariaAttributes: {
    "aria-multiline": true
  },

  //<debug>
  constructor: function (config) {
    this.callParent([config]);
    if (this.cols) {
      Ext.log.warn(
        'Ext.form.field.TextArea "cols" config was removed in Ext 5.0. Please specify a "width" or use a layout instead.'
      );
    }

    if (this.rows) {
      Ext.log.warn(
        'Ext.form.field.TextArea "rows" config was removed in Ext 5.0. Please specify a "height" or use a layout instead.'
      );
    }
  },
  //</debug>

  getSubTplData: function (fieldData) {
    var me = this,
      fieldStyle = me.getFieldStyle(),
      ret = me.callParent(arguments);

    if (me.grow) {
      if (me.preventScrollbars) {
        ret.fieldStyle =
          (fieldStyle || "") + ";overflow:hidden;height:" + me.growMin + "px";
      }
    }

    return ret;
  },

  afterRender: function () {
    var me = this;

    me.callParent(arguments);

    me.needsMaxCheck =
      me.enforceMaxLength &&
      me.maxLength !== Number.MAX_VALUE &&
      !Ext.supports.TextAreaMaxLength;
    if (me.needsMaxCheck) {
      me.inputEl.on("paste", me.onPaste, me);
    }
  },

  // The following overrides deal with an issue whereby some browsers
  // will strip carriage returns from the textarea input, while others
  // will not. Since there's no way to be sure where to insert returns,
  // the best solution is to strip them out in all cases to ensure that
  // the behaviour is consistent in a cross browser fashion. As such,
  // we override in all cases when setting the value to control this.
  transformRawValue: function (value) {
    return this.stripReturns(value);
  },

  getValue: function () {
    return this.stripReturns(this.callParent());
  },

  valueToRaw: function (value) {
    value = this.stripReturns(value);
    return this.callParent([value]);
  },

  stripReturns: function (value) {
    if (value && typeof value === "string") {
      value = value.replace(this.returnRe, "");
    }
    return value;
  },

  onPaste: function () {
    var me = this;
    if (!me.pasteTask) {
      me.pasteTask = new Ext.util.DelayedTask(me.pasteCheck, me);
    }
    // since we can't get the paste data, we'll give the area a chance to populate
    me.pasteTask.delay(1);
  },

  pasteCheck: function () {
    var me = this,
      value = me.getValue(),
      max = me.maxLength;

    if (value.length > max) {
      value = value.substr(0, max);
      me.setValue(value);
    }
  },

  /**
   * @private
   */
  fireKey: function (e) {
    var me = this,
      key = e.getKey(),
      value;

    if (
      e.isSpecialKey() &&
      (me.enterIsSpecial || key !== e.ENTER || e.hasModifier())
    ) {
      me.fireEvent("specialkey", me, e);
    }

    // Enter key must not bubble up where it can trigger defaultButton action
    if (key === e.ENTER) {
      e.stopPropagation();
    }

    if (
      me.needsMaxCheck &&
      key !== e.BACKSPACE &&
      key !== e.DELETE &&
      !e.isNavKeyPress() &&
      !me.isCutCopyPasteSelectAll(e, key)
    ) {
      value = me.getValue();
      if (value.length >= me.maxLength) {
        e.stopEvent();
      }
    }
  },

  isCutCopyPasteSelectAll: function (e, key) {
    if (e.ctrlKey) {
      return key === e.A || key === e.C || key === e.V || key === e.X;
    }
    return false;
  },

  /**
   * Automatically grows the field to accomodate the height of the text up to the maximum
   * field height allowed. This only takes effect if {@link #grow} = true, and fires the
   * {@link #autosize} event if the height changes.
   */
  autoSize: function () {
    var me = this,
      inputEl,
      height,
      curWidth,
      value;

    if (me.grow && me.rendered && me.getSizeModel().height.auto) {
      inputEl = me.inputEl;
      //subtract border/padding to get the available width for the text
      curWidth = inputEl.getWidth(true);

      value = Ext.util.Format.htmlEncode(inputEl.dom.value) || "&#160;";
      value += me.growAppend;

      // Translate newlines to <br> tags
      value = value.replace(/\n/g, "<br/>");

      height =
        Ext.util.TextMetrics.measure(inputEl, value, curWidth).height +
        inputEl.getPadding("tb") +
        // The element that has the border depends on theme - inputWrap (classic)
        // or triggerWrap (neptune)
        me.inputWrap.getBorderWidth("tb") +
        me.triggerWrap.getBorderWidth("tb");

      height = Math.min(Math.max(height, me.growMin), me.growMax);

      me.bodyEl.setHeight(height);

      me.updateLayout();

      me.fireEvent("autosize", me, height);
    }
  },

  doDestroy: function () {
    var task = this.pasteTask;

    if (task) {
      task.cancel();
    }

    this.callParent();
  }
});
