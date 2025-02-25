/**
 * Handles mapping key events to handling functions for an element or a Component. One KeyMap can be used for multiple
 * actions.
 *
 * A KeyMap must be configured with a {@link #target} as an event source which may be an Element or a Component.
 *
 * If the target is an element, then the `keydown` event will trigger the invocation of {@link #binding}s.
 *
 * It is possible to configure the KeyMap with a custom {@link #eventName} to listen for. This may be useful when the
 * {@link #target} is a Component.
 *
 * The KeyMap's event handling requires that the first parameter passed is a key event. So if the Component's event
 * signature is different, specify a {@link #processEvent} configuration which accepts the event's parameters and
 * returns a key event.
 *
 * Functions specified in {@link #binding}s are called with this signature : `(String key, Ext.event.Event e)` (if the
 * match is a multi-key combination the callback will still be called only once). A KeyMap can also handle a string
 * representation of keys. By default KeyMap starts enabled.
 *
 * Usage:
 *
 *     // map one key by key code
 *     var map = new Ext.util.KeyMap({
 *         target: "my-element",
 *         key: 13, // or Ext.event.Event.ENTER
 *         fn: myHandler,
 *         scope: myObject
 *     });
 *
 *     // map multiple keys to one action by string
 *     var map = new Ext.util.KeyMap({
 *         target: "my-element",
 *         key: "a\r\n\t",
 *         fn: myHandler,
 *         scope: myObject
 *     });
 *
 *     // map multiple keys to multiple actions by strings and array of codes
 *     var map = new Ext.util.KeyMap({
 *         target: "my-element",
 *         binding: [{
 *             key: [10,13],
 *             fn: function(){ alert("Return was pressed"); }
 *         }, {
 *             key: "abc",
 *             fn: function(){ alert('a, b or c was pressed'); }
 *         }, {
 *             key: "\t",
 *             ctrl:true,
 *             shift:true,
 *             fn: function(){ alert('Control + shift + tab was pressed.'); }
 *         }]
 *     });
 *
 * Since 4.1.0, KeyMaps can bind to Components and process key-based events fired by Components.
 *
 * To bind to a Component, use the single parameter form of constructor and include the Component event name
 * to listen for, and a `processEvent` implementation which returns the key event for further processing by
 * the KeyMap:
 *
 *     var map = new Ext.util.KeyMap({
 *         target: myGridView,
 *         eventName: 'itemkeydown',
 *         processEvent: function(view, record, node, index, event) {
 *
 *             // Load the event with the extra information needed by the mappings
 *             event.view = view;
 *             event.store = view.getStore();
 *             event.record = record;
 *             event.index = index;
 *             return event;
 *         },
 *         binding: {
 *             key: Ext.event.Event.DELETE,
 *             fn: function(keyCode, e) {
 *                 e.store.remove(e.record);
 *
 *                 // Attempt to select the record that's now in its place
 *                 e.view.getSelectionModel().select(e.index);
 *                 e.view.el.focus();
 *             }
 *         }
 *     });
 */
Ext.define("Ext.util.KeyMap", {
  alternateClassName: "Ext.KeyMap",

  /**
   * @property {Ext.event.Event} lastKeyEvent
   * The last key event that this KeyMap handled.
   */

  /**
   * @cfg {Ext.Component/Ext.dom.Element/HTMLElement/String} target
   * The object on which to listen for the event specified by the {@link #eventName} config option.
   */

  /**
   * @cfg {Object/Object[][]} binding
   * Either a single object describing a handling function for s specified key (or set of keys), or
   * an array of such objects.
   * @cfg {String/String[]} binding.key A single keycode or an array of keycodes to handle, or a RegExp
   * which specifies characters to handle, eg `/[a-z]/`.
   * @cfg {Boolean}  binding.shift True to handle key only when shift is pressed, False to handle the
   *  key only when shift is not pressed (defaults to undefined)
   * @cfg {Boolean}  binding.ctrl True to handle key only when ctrl is pressed, False to handle the
   *  key only when ctrl is not pressed (defaults to undefined)
   * @cfg {Boolean}  binding.alt True to handle key only when alt is pressed, False to handle the key
   *  only when alt is not pressed (defaults to undefined)
   * @cfg {Function} binding.handler The function to call when KeyMap finds the expected key combination
   * @cfg {Function} binding.fn Alias of handler (for backwards-compatibility)
   * @cfg {Object}   binding.scope The scope (`this` context) in which the handler function is executed.
   * @cfg {String}   binding.defaultEventAction A default action to apply to the event *when the handler returns `true`*. Possible values
   *  are: stopEvent, stopPropagation, preventDefault. If no value is set no action is performed.
   */

  /**
   * @cfg {Object} [processEventScope=this]
   * The scope (`this` context) in which the {@link #processEvent} method is executed.
   */

  /**
   * @cfg {Boolean} [ignoreInputFields=false]
   * Configure this as `true` if there are any input fields within the {@link #target}, and this KeyNav
   * should not process events from input fields, (`&lt;input>, &lt;textarea> and elements with `contentEditable="true"`)
   */

  /**
   * @cfg {Number} [priority]
   * The priority to set on this KeyMap's listener. Listeners with a higher priority are fired before those with
   * lower priority.
   */

  /**
   * @cfg {String} eventName
   * The event to listen for to pick up key events.
   */
  eventName: "keydown",

  constructor: function (config) {
    var me = this;

    // Handle legacy arg list in which the first argument is the target.
    // TODO: Deprecate in V5
    if (
      arguments.length !== 1 ||
      typeof config === "string" ||
      config.dom ||
      config.tagName ||
      config === document ||
      config.isComponent
    ) {
      me.legacyConstructor.apply(me, arguments);
      return;
    }

    Ext.apply(me, config);
    me.bindings = [];

    if (!me.target.isComponent) {
      me.target = Ext.get(me.target);
    }

    if (me.binding) {
      me.addBinding(me.binding);
    } else if (config.key) {
      me.addBinding(config);
    }
    me.enable();
  },

  /**
   * @private
   * Old constructor signature
   * @param {String/HTMLElement/Ext.dom.Element/Ext.Component} el The element or its ID, or Component to bind to
   * @param {Object} binding The binding (see {@link #addBinding})
   * @param {String} [eventName="keydown"] The event to bind to
   */
  legacyConstructor: function (el, binding, eventName) {
    var me = this;

    Ext.apply(me, {
      target: Ext.get(el),
      eventName: eventName || me.eventName,
      bindings: []
    });
    if (binding) {
      me.addBinding(binding);
    }
    me.enable();
  },

  /**
   * Add a new binding to this KeyMap.
   *
   * Usage:
   *
   *     // Create a KeyMap
   *     var map = new Ext.util.KeyMap(document, {
   *         key: Ext.event.Event.ENTER,
   *         fn: handleKey,
   *         scope: this
   *     });
   *
   *     //Add a new binding to the existing KeyMap later
   *     map.addBinding({
   *         key: 'abc',
   *         shift: true,
   *         fn: handleKey,
   *         scope: this
   *     });
   *
   * @param {Object/Object[]} binding A single KeyMap config or an array of configs.
   * The following config object properties are supported:
   * @param {String/Array} binding.key A single keycode or an array of keycodes to handle, or a RegExp
   * which specifies characters to handle, eg `/[a-z]/`.
   * @param {Boolean} binding.shift True to handle key only when shift is pressed,
   * False to handle the keyonly when shift is not pressed (defaults to undefined).
   * @param {Boolean} binding.ctrl True to handle key only when ctrl is pressed,
   * False to handle the key only when ctrl is not pressed (defaults to undefined).
   * @param {Boolean} binding.alt True to handle key only when alt is pressed,
   * False to handle the key only when alt is not pressed (defaults to undefined).
   * @param {Function} binding.handler The function to call when KeyMap finds the
   * expected key combination.
   * @param {Function} binding.fn Alias of handler (for backwards-compatibility).
   * @param {Object} binding.scope The scope (`this` context) in which the handler function is executed.
   * @param {String} binding.defaultEventAction A default action to apply to the event *when the handler returns `true`*.
   * Possible values are: stopEvent, stopPropagation, preventDefault. If no value is
   * set no action is performed..
   */
  addBinding: function (binding) {
    var me = this,
      keyCode = binding.key,
      i,
      len;

    if (me.processing) {
      me.bindings = me.bindings.slice(0);
    }

    if (Ext.isArray(binding)) {
      for (i = 0, len = binding.length; i < len; i++) {
        me.addBinding(binding[i]);
      }
      return;
    }

    me.bindings.push(
      Ext.apply(
        {
          keyCode: me.processKeys(keyCode)
        },
        binding
      )
    );
  },

  /**
   * Remove a binding from this KeyMap.
   * @param {Object} binding See {@link #addBinding for options}
   */
  removeBinding: function (binding) {
    var me = this,
      bindings = me.bindings,
      len = bindings.length,
      i,
      item,
      keys;

    if (me.processing) {
      me.bindings = bindings.slice(0);
    }

    keys = me.processKeys(binding.key);
    for (i = 0; i < len; ++i) {
      item = bindings[i];
      if (
        (item.fn || item.handler) === (binding.fn || binding.handler) &&
        item.scope === binding.scope
      ) {
        if (
          binding.alt === item.alt &&
          binding.ctrl === item.ctrl &&
          binding.shift === item.shift
        ) {
          if (Ext.Array.equals(item.keyCode, keys)) {
            Ext.Array.erase(me.bindings, i, 1);
            return;
          }
        }
      }
    }
  },

  processKeys: function (keyCode) {
    var processed = false,
      key,
      keys,
      keyString,
      len,
      i;

    // A RegExp to match typed characters
    if (keyCode.test) {
      return keyCode;
    }

    // A String of characters to match
    if (Ext.isString(keyCode)) {
      keys = [];
      keyString = keyCode.toUpperCase();

      for (i = 0, len = keyString.length; i < len; ++i) {
        keys.push(keyString.charCodeAt(i));
      }
      keyCode = keys;
      processed = true;
    }

    // Numeric key code
    if (!Ext.isArray(keyCode)) {
      keyCode = [keyCode];
    }

    if (!processed) {
      for (i = 0, len = keyCode.length; i < len; ++i) {
        key = keyCode[i];
        if (Ext.isString(key)) {
          keyCode[i] = key.toUpperCase().charCodeAt(0);
        }
      }
    }
    return keyCode;
  },

  /**
   * Process the {@link #eventName event} from the {@link #target}.
   * @private
   * @param {Ext.event.Event} event
   */
  handleTargetEvent: function (event) {
    var me = this,
      bindings,
      i,
      len,
      result;

    if (me.enabled) {
      bindings = me.bindings;
      i = 0;
      len = bindings.length;

      // Process the event
      event = me.processEvent.apply(me.processEventScope || me, arguments);

      // A custom processEvent implementation may return falsy to stop the KeyMap's processing
      if (event) {
        me.lastKeyEvent = event;

        // Ignore events from input fields if configured to do so
        if (me.ignoreInputFields && Ext.fly(event.target).isInputField()) {
          return;
        }

        // If the processor does not return a keyEvent, we can't process it.
        // Allow them to return false to cancel processing of the event
        if (!event.getKey) {
          return event;
        }

        me.processing = true;

        for (; i < len; ++i) {
          result = me.processBinding(bindings[i], event);

          if (result === false) {
            me.processing = false;

            return result;
          }
        }

        me.processing = false;
      }
    }
  },

  /**
   * @cfg {Function} processEvent
   * An optional event processor function which accepts the argument list provided by the
   * {@link #eventName configured event} of the {@link #target}, and returns a keyEvent for processing by the KeyMap.
   *
   * This may be useful when the {@link #target} is a Component with a complex event signature, where the event is not
   * the first parameter. Extra information from the event arguments may be injected into the event for use by the handler
   * functions before returning it.
   *
   * If `null` is returned the KeyMap stops processing the event.
   */
  processEvent: Ext.identityFn,

  /**
   * Process a particular binding and fire the handler if necessary.
   * @private
   * @param {Object} binding The binding information
   * @param {Ext.event.Event} event
   */
  processBinding: function (binding, event) {
    if (this.checkModifiers(binding, event)) {
      var key = event.getKey(),
        handler = binding.fn || binding.handler,
        scope = binding.scope || this,
        keyCode = binding.keyCode,
        defaultEventAction = binding.defaultEventAction,
        i,
        len,
        result;

      // keyCode is a regExp specifying acceptable characters. eg /[a-z]/
      if (keyCode.test) {
        if (keyCode.test(String.fromCharCode(event.getCharCode()))) {
          result = handler.call(scope, key, event);

          if (result !== true && defaultEventAction) {
            event[defaultEventAction]();
          }

          if (result === false) {
            return result;
          }
        }
      }
      // Array of key codes
      else if (keyCode.length) {
        for (i = 0, len = keyCode.length; i < len; ++i) {
          if (key === keyCode[i]) {
            result = handler.call(scope, key, event);

            if (result !== true && defaultEventAction) {
              event[defaultEventAction]();
            }

            if (result === false) {
              return result;
            }

            break;
          }
        }
      }
    }
  },

  /**
   * Check if the modifiers on the event match those on the binding
   * @private
   * @param {Object} binding
   * @param {Ext.event.Event} event
   * @return {Boolean} True if the event matches the binding
   */
  checkModifiers: function (binding, event) {
    var keys = ["shift", "ctrl", "alt"],
      i = 0,
      len = keys.length,
      val,
      key;

    for (; i < len; ++i) {
      key = keys[i];
      val = binding[key];
      if (!(val === undefined || val === event[key + "Key"])) {
        return false;
      }
    }
    return true;
  },

  /**
   * Shorthand for adding a single key listener.
   *
   * @param {Number/Number[]/Object} key Either the numeric key code, array of key codes or an object with the
   * following options: `{key: (number or array), shift: (true/false), ctrl: (true/false), alt: (true/false)}`
   * @param {Function} fn The function to call
   * @param {Object} [scope] The scope (`this` reference) in which the function is executed.
   * Defaults to the browser window.
   */
  on: function (key, fn, scope) {
    var keyCode, shift, ctrl, alt;
    if (Ext.isObject(key) && !Ext.isArray(key)) {
      keyCode = key.key;
      shift = key.shift;
      ctrl = key.ctrl;
      alt = key.alt;
    } else {
      keyCode = key;
    }
    this.addBinding({
      key: keyCode,
      shift: shift,
      ctrl: ctrl,
      alt: alt,
      fn: fn,
      scope: scope
    });
  },

  /**
   * Shorthand for removing a single key listener.
   *
   * @param {Number/Number[]/Object} key Either the numeric key code, array of key codes or an object with the
   * following options: `{key: (number or array), shift: (true/false), ctrl: (true/false), alt: (true/false)}`
   * @param {Function} fn The function to call
   * @param {Object} [scope] The scope (`this` reference) in which the function is executed.
   * Defaults to the browser window.
   */
  un: function (key, fn, scope) {
    var keyCode, shift, ctrl, alt;
    if (Ext.isObject(key) && !Ext.isArray(key)) {
      keyCode = key.key;
      shift = key.shift;
      ctrl = key.ctrl;
      alt = key.alt;
    } else {
      keyCode = key;
    }
    this.removeBinding({
      key: keyCode,
      shift: shift,
      ctrl: ctrl,
      alt: alt,
      fn: fn,
      scope: scope
    });
  },

  /**
   * Returns true if this KeyMap is enabled
   * @return {Boolean}
   */
  isEnabled: function () {
    return this.enabled;
  },

  /**
   * Enables this KeyMap
   */
  enable: function () {
    var me = this;

    if (!me.enabled) {
      me.target.on(me.eventName, me.handleTargetEvent, me, {
        capture: me.capture,
        priority: me.priority
      });
      me.enabled = true;
    }
  },

  /**
   * Disable this KeyMap
   */
  disable: function () {
    var me = this;

    if (me.enabled) {
      me.target.removeListener(me.eventName, me.handleTargetEvent, me);
      me.enabled = false;
    }
  },

  /**
   * Convenience function for setting disabled/enabled by boolean.
   * @param {Boolean} disabled
   */
  setDisabled: function (disabled) {
    if (disabled) {
      this.disable();
    } else {
      this.enable();
    }
  },

  /**
   * Destroys the KeyMap instance and removes all handlers.
   * @param {Boolean} removeTarget True to also remove the {@link #target}
   */
  destroy: function (removeTarget) {
    var me = this,
      target = me.target;

    me.bindings = [];
    me.disable();
    if (removeTarget) {
      target.destroy();
    }
    delete me.target;
    me.callParent();
  }
});
