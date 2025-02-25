Ext.define("Ext.draw.ContainerBase", {
  extend: "Ext.panel.Panel",
  requires: ["Ext.window.Window"],
  previewTitleText: "Chart Preview",
  previewAltText: "Chart preview",
  layout: "container",
  addElementListener: function () {
    var b = this,
      a = arguments;
    if (b.rendered) {
      b.el.on.apply(b.el, a);
    } else {
      b.on("render", function () {
        b.el.on.apply(b.el, a);
      });
    }
  },
  removeElementListener: function () {
    var b = this,
      a = arguments;
    if (b.rendered) {
      b.el.un.apply(b.el, a);
    }
  },
  afterRender: function () {
    this.callParent(arguments);
    this.initAnimator();
  },
  getItems: function () {
    var b = this,
      a = b.items;
    if (!a || !a.isMixedCollection) {
      b.initItems();
    }
    return b.items;
  },
  onRender: function () {
    this.callParent(arguments);
    this.element = this.el;
    this.innerElement = this.body;
  },
  setItems: function (a) {
    this.items = a;
    return a;
  },
  setSurfaceSize: function (b, a) {
    this.resizeHandler({ width: b, height: a });
    this.renderFrame();
  },
  onResize: function (c, a, b, e) {
    var d = this;
    d.callParent([c, a, b, e]);
    d.handleResize({ width: c, height: a });
  },
  preview: function () {
    var b = this.getImage(),
      a;
    if (Ext.isIE8) {
      return false;
    }
    if (b.type === "svg-markup") {
      a = { xtype: "container", html: b.data };
    } else {
      a = {
        xtype: "image",
        mode: "img",
        cls: Ext.baseCSSPrefix + "chart-image",
        alt: this.previewAltText,
        src: b.data,
        listeners: {
          afterrender: function () {
            var f = this,
              c = f.imgEl.dom,
              e = b.type === "svg" ? 1 : window.devicePixelRatio || 1,
              d;
            if (!c.naturalWidth || !c.naturalHeight) {
              c.onload = function () {
                var h = c.naturalWidth,
                  g = c.naturalHeight;
                f.setWidth(Math.floor(h / e));
                f.setHeight(Math.floor(g / e));
              };
            } else {
              d = f.getSize();
              f.setWidth(Math.floor(d.width / e));
              f.setHeight(Math.floor(d.height / e));
            }
          }
        }
      };
    }
    new Ext.window.Window({
      title: this.previewTitleText,
      closeable: true,
      renderTo: Ext.getBody(),
      autoShow: true,
      maximizeable: true,
      maximized: true,
      border: true,
      layout: { type: "hbox", pack: "center", align: "middle" },
      items: { xtype: "container", items: a }
    });
  },
  privates: {
    getTargetEl: function () {
      return this.innerElement;
    },
    reattachToBody: function () {
      var a = this;
      if (a.pendingDetachSize) {
        a.handleResize();
      }
      a.pendingDetachSize = false;
      a.callParent();
    }
  }
});
Ext.define("Ext.draw.SurfaceBase", {
  extend: "Ext.Widget",
  getOwnerBody: function () {
    return this.ownerCt.body;
  }
});
Ext.define("Ext.draw.sprite.AnimationParser", function () {
  function a(d, c, b) {
    return d + (c - d) * b;
  }
  return {
    singleton: true,
    attributeRe: /^url\(#([a-zA-Z\-]+)\)$/,
    requires: ["Ext.draw.Color"],
    color: {
      parseInitial: function (c, b) {
        if (Ext.isString(c)) {
          c = Ext.util.Color.create(c);
        }
        if (Ext.isString(b)) {
          b = Ext.util.Color.create(b);
        }
        if (c && c.isColor && b && b.isColor) {
          return [
            [c.r, c.g, c.b, c.a],
            [b.r, b.g, b.b, b.a]
          ];
        } else {
          return [c || b, b || c];
        }
      },
      compute: function (d, c, b) {
        if (!Ext.isArray(d) || !Ext.isArray(c)) {
          return c || d;
        } else {
          return [
            a(d[0], c[0], b),
            a(d[1], c[1], b),
            a(d[2], c[2], b),
            a(d[3], c[3], b)
          ];
        }
      },
      serve: function (c) {
        var b = Ext.util.Color.fly(c[0], c[1], c[2], c[3]);
        return b.toString();
      }
    },
    number: {
      parse: function (b) {
        return b === null ? null : +b;
      },
      compute: function (d, c, b) {
        if (!Ext.isNumber(d) || !Ext.isNumber(c)) {
          return c || d;
        } else {
          return a(d, c, b);
        }
      }
    },
    angle: {
      parseInitial: function (c, b) {
        if (b - c > Math.PI) {
          b -= Math.PI * 2;
        } else {
          if (b - c < -Math.PI) {
            b += Math.PI * 2;
          }
        }
        return [c, b];
      },
      compute: function (d, c, b) {
        if (!Ext.isNumber(d) || !Ext.isNumber(c)) {
          return c || d;
        } else {
          return a(d, c, b);
        }
      }
    },
    path: {
      parseInitial: function (m, n) {
        var c = m.toStripes(),
          o = n.toStripes(),
          e,
          d,
          k = c.length,
          p = o.length,
          h,
          f,
          b,
          g = o[p - 1],
          l = [g[g.length - 2], g[g.length - 1]];
        for (e = k; e < p; e++) {
          c.push(c[k - 1].slice(0));
        }
        for (e = p; e < k; e++) {
          o.push(l.slice(0));
        }
        b = c.length;
        o.path = n;
        o.temp = new Ext.draw.Path();
        for (e = 0; e < b; e++) {
          h = c[e];
          f = o[e];
          k = h.length;
          p = f.length;
          o.temp.commands.push("M");
          for (d = p; d < k; d += 6) {
            f.push(l[0], l[1], l[0], l[1], l[0], l[1]);
          }
          g = o[o.length - 1];
          l = [g[g.length - 2], g[g.length - 1]];
          for (d = k; d < p; d += 6) {
            h.push(l[0], l[1], l[0], l[1], l[0], l[1]);
          }
          for (e = 0; e < f.length; e++) {
            f[e] -= h[e];
          }
          for (e = 2; e < f.length; e += 6) {
            o.temp.commands.push("C");
          }
        }
        return [c, o];
      },
      compute: function (c, l, m) {
        if (m >= 1) {
          return l.path;
        }
        var e = 0,
          f = c.length,
          d = 0,
          b,
          k,
          h,
          n = l.temp.params,
          g = 0;
        for (; e < f; e++) {
          k = c[e];
          h = l[e];
          b = k.length;
          for (d = 0; d < b; d++) {
            n[g++] = h[d] * m + k[d];
          }
        }
        return l.temp;
      }
    },
    data: {
      compute: function (h, j, k, g) {
        var m = h.length - 1,
          b = j.length - 1,
          e = Math.max(m, b),
          d,
          l,
          c;
        if (!g || g === h) {
          g = [];
        }
        g.length = e + 1;
        for (c = 0; c <= e; c++) {
          d = h[Math.min(c, m)];
          l = j[Math.min(c, b)];
          if (Ext.isNumber(d)) {
            if (!Ext.isNumber(l)) {
              l = 0;
            }
            g[c] = (l - d) * k + d;
          } else {
            g[c] = l;
          }
        }
        return g;
      }
    },
    text: {
      compute: function (d, c, b) {
        return (
          d.substr(0, Math.round(d.length * (1 - b))) +
          c.substr(Math.round(c.length * (1 - b)))
        );
      }
    },
    limited: "number",
    limited01: "number"
  };
});
(function () {
  if (!Ext.global.Float32Array) {
    var a = function (d) {
      if (typeof d === "number") {
        this.length = d;
      } else {
        if ("length" in d) {
          this.length = d.length;
          for (var c = 0, b = d.length; c < b; c++) {
            this[c] = +d[c];
          }
        }
      }
    };
    a.prototype = [];
    Ext.global.Float32Array = a;
  }
})();
Ext.define("Ext.draw.Draw", {
  singleton: true,
  radian: Math.PI / 180,
  pi2: Math.PI * 2,
  reflectFn: function (b) {
    return b;
  },
  rad: function (a) {
    return (a % 360) * this.radian;
  },
  degrees: function (a) {
    return (a / this.radian) % 360;
  },
  isBBoxIntersect: function (b, a, c) {
    c = c || 0;
    return (
      Math.max(b.x, a.x) - c > Math.min(b.x + b.width, a.x + a.width) ||
      Math.max(b.y, a.y) - c > Math.min(b.y + b.height, a.y + a.height)
    );
  },
  isPointInBBox: function (a, c, b) {
    return (
      !!b && a >= b.x && a <= b.x + b.width && c >= b.y && c <= b.y + b.height
    );
  },
  spline: function (m) {
    var e,
      c,
      k = m.length,
      b,
      h,
      l,
      f,
      a = 0,
      g = new Float32Array(m.length),
      n = new Float32Array(m.length * 3 - 2);
    g[0] = 0;
    g[k - 1] = 0;
    for (e = 1; e < k - 1; e++) {
      g[e] = m[e + 1] + m[e - 1] - 2 * m[e] - g[e - 1];
      a = 1 / (4 - a);
      g[e] *= a;
    }
    for (e = k - 2; e > 0; e--) {
      a =
        3.732050807568877 +
        48.248711305964385 /
          (-13.928203230275537 + Math.pow(0.07179676972449123, e));
      g[e] -= g[e + 1] * a;
    }
    f = m[0];
    b = f - g[0];
    for (e = 0, c = 0; e < k - 1; c += 3) {
      l = f;
      h = b;
      e++;
      f = m[e];
      b = f - g[e];
      n[c] = l;
      n[c + 1] = (b + 2 * h) / 3;
      n[c + 2] = (b * 2 + h) / 3;
    }
    n[c] = f;
    return n;
  },
  getAnchors: function (e, d, i, h, t, s, o) {
    o = o || 4;
    var n = Math.PI,
      p = n / 2,
      k = Math.abs,
      a = Math.sin,
      b = Math.cos,
      f = Math.atan,
      r,
      q,
      g,
      j,
      m,
      l,
      v,
      u,
      c;
    r = (i - e) / o;
    q = (t - i) / o;
    if ((h >= d && h >= s) || (h <= d && h <= s)) {
      g = j = p;
    } else {
      g = f((i - e) / k(h - d));
      if (d < h) {
        g = n - g;
      }
      j = f((t - i) / k(h - s));
      if (s < h) {
        j = n - j;
      }
    }
    c = p - ((g + j) % (n * 2)) / 2;
    if (c > p) {
      c -= n;
    }
    g += c;
    j += c;
    m = i - r * a(g);
    l = h + r * b(g);
    v = i + q * a(j);
    u = h + q * b(j);
    if ((h > d && l < d) || (h < d && l > d)) {
      m += (k(d - l) * (m - i)) / (l - h);
      l = d;
    }
    if ((h > s && u < s) || (h < s && u > s)) {
      v -= (k(s - u) * (v - i)) / (u - h);
      u = s;
    }
    return { x1: m, y1: l, x2: v, y2: u };
  },
  smooth: function (l, j, o) {
    var k = l.length,
      h,
      g,
      c,
      b,
      q,
      p,
      n,
      m,
      f = [],
      e = [],
      d,
      a;
    for (d = 0; d < k - 1; d++) {
      h = l[d];
      g = j[d];
      if (d === 0) {
        n = h;
        m = g;
        f.push(n);
        e.push(m);
        if (k === 1) {
          break;
        }
      }
      c = l[d + 1];
      b = j[d + 1];
      q = l[d + 2];
      p = j[d + 2];
      if (!(Ext.isNumber(q) && Ext.isNumber(p))) {
        f.push(n, c, c);
        e.push(m, b, b);
        break;
      }
      a = this.getAnchors(h, g, c, b, q, p, o);
      f.push(n, a.x1, c);
      e.push(m, a.y1, b);
      n = a.x2;
      m = a.y2;
    }
    return { smoothX: f, smoothY: e };
  },
  beginUpdateIOS: Ext.os.is.iOS
    ? function () {
        this.iosUpdateEl = Ext.getBody().createChild({
          style:
            "position: absolute; top: 0px; bottom: 0px; left: 0px; right: 0px; background: rgba(0,0,0,0.001); z-index: 100000"
        });
      }
    : Ext.emptyFn,
  endUpdateIOS: function () {
    this.iosUpdateEl = Ext.destroy(this.iosUpdateEl);
  }
});
Ext.define("Ext.draw.gradient.Gradient", {
  requires: ["Ext.draw.Color"],
  isGradient: true,
  config: { stops: [] },
  applyStops: function (f) {
    var e = [],
      d = f.length,
      c,
      b,
      a;
    for (c = 0; c < d; c++) {
      b = f[c];
      a = b.color;
      if (!(a && a.isColor)) {
        a = Ext.util.Color.fly(a || Ext.util.Color.NONE);
      }
      e.push({
        offset: Math.min(
          1,
          Math.max(0, "offset" in b ? b.offset : b.position || 0)
        ),
        color: a.toString()
      });
    }
    e.sort(function (h, g) {
      return h.offset - g.offset;
    });
    return e;
  },
  onClassExtended: function (a, b) {
    if (!b.alias && b.type) {
      b.alias = "gradient." + b.type;
    }
  },
  constructor: function (a) {
    this.initConfig(a);
  },
  generateGradient: Ext.emptyFn
});
Ext.define("Ext.draw.gradient.GradientDefinition", {
  singleton: true,
  urlStringRe: /^url\(#([\w\-]+)\)$/,
  gradients: {},
  add: function (a) {
    var b = this.gradients,
      c,
      e,
      d;
    for (c = 0, e = a.length; c < e; c++) {
      d = a[c];
      if (Ext.isString(d.id)) {
        b[d.id] = d;
      }
    }
  },
  get: function (d) {
    var a = this.gradients,
      b = d.match(this.urlStringRe),
      c;
    if (b && b[1] && (c = a[b[1]])) {
      return c || d;
    }
    return d;
  }
});
Ext.define("Ext.draw.sprite.AttributeParser", {
  singleton: true,
  attributeRe: /^url\(#([a-zA-Z\-]+)\)$/,
  requires: ["Ext.draw.Color", "Ext.draw.gradient.GradientDefinition"],
  default: Ext.identityFn,
  string: function (a) {
    return String(a);
  },
  number: function (a) {
    if (Ext.isNumber(+a)) {
      return a;
    }
  },
  angle: function (a) {
    if (Ext.isNumber(a)) {
      a %= Math.PI * 2;
      if (a < -Math.PI) {
        a += Math.PI * 2;
      } else {
        if (a >= Math.PI) {
          a -= Math.PI * 2;
        }
      }
      return a;
    }
  },
  data: function (a) {
    if (Ext.isArray(a)) {
      return a.slice();
    } else {
      if (a instanceof Float32Array) {
        return new Float32Array(a);
      }
    }
  },
  bool: function (a) {
    return !!a;
  },
  color: function (a) {
    if (a && a.isColor) {
      return a.toString();
    } else {
      if (a && a.isGradient) {
        return a;
      } else {
        if (!a) {
          return Ext.util.Color.NONE;
        } else {
          if (Ext.isString(a)) {
            if (a.substr(0, 3) === "url") {
              a = Ext.draw.gradient.GradientDefinition.get(a);
              if (Ext.isString(a)) {
                return a;
              }
            } else {
              return Ext.util.Color.fly(a).toString();
            }
          }
        }
      }
    }
    if (a.type === "linear") {
      return Ext.create("Ext.draw.gradient.Linear", a);
    } else {
      if (a.type === "radial") {
        return Ext.create("Ext.draw.gradient.Radial", a);
      } else {
        if (a.type === "pattern") {
          return Ext.create("Ext.draw.gradient.Pattern", a);
        } else {
          return Ext.util.Color.NONE;
        }
      }
    }
  },
  limited: function (a, b) {
    return function (c) {
      c = +c;
      return Ext.isNumber(c) ? Math.min(Math.max(c, a), b) : undefined;
    };
  },
  limited01: function (a) {
    a = +a;
    return Ext.isNumber(a) ? Math.min(Math.max(a, 0), 1) : undefined;
  },
  enums: function () {
    var d = {},
      a = Array.prototype.slice.call(arguments, 0),
      b,
      c;
    for (b = 0, c = a.length; b < c; b++) {
      d[a[b]] = true;
    }
    return function (e) {
      return e in d ? e : undefined;
    };
  }
});
Ext.define("Ext.draw.sprite.AttributeDefinition", {
  requires: [
    "Ext.draw.sprite.AttributeParser",
    "Ext.draw.sprite.AnimationParser"
  ],
  config: {
    defaults: { $value: {}, lazy: true },
    aliases: {},
    animationProcessors: {},
    processors: { $value: {}, lazy: true },
    dirtyTriggers: {},
    triggers: {},
    updaters: {}
  },
  inheritableStatics: { processorFactoryRe: /^(\w+)\(([\w\-,]*)\)$/ },
  spriteClass: null,
  constructor: function (a) {
    var b = this;
    b.initConfig(a);
  },
  applyDefaults: function (b, a) {
    a = Ext.apply(a || {}, this.normalize(b));
    return a;
  },
  applyAliases: function (b, a) {
    return Ext.apply(a || {}, b);
  },
  applyProcessors: function (e, i) {
    this.getAnimationProcessors();
    var j = i || {},
      h = Ext.draw.sprite.AttributeParser,
      a = this.self.processorFactoryRe,
      g = {},
      d,
      b,
      c,
      f;
    for (b in e) {
      f = e[b];
      if (typeof f === "string") {
        c = f.match(a);
        if (c) {
          f = h[c[1]].apply(h, c[2].split(","));
        } else {
          if (h[f]) {
            g[b] = f;
            d = true;
            f = h[f];
          }
        }
      }
      j[b] = f;
    }
    if (d) {
      this.setAnimationProcessors(g);
    }
    return j;
  },
  applyAnimationProcessors: function (c, a) {
    var e = Ext.draw.sprite.AnimationParser,
      b,
      d;
    if (!a) {
      a = {};
    }
    for (b in c) {
      d = c[b];
      if (d === "none") {
        a[b] = null;
      } else {
        if (Ext.isString(d) && !(b in a)) {
          if (d in e) {
            while (Ext.isString(e[d])) {
              d = e[d];
            }
            a[b] = e[d];
          }
        } else {
          if (Ext.isObject(d)) {
            a[b] = d;
          }
        }
      }
    }
    return a;
  },
  updateDirtyTriggers: function (a) {
    this.setTriggers(a);
  },
  applyTriggers: function (b, c) {
    if (!c) {
      c = {};
    }
    for (var a in b) {
      c[a] = b[a].split(",");
    }
    return c;
  },
  applyUpdaters: function (b, a) {
    return Ext.apply(a || {}, b);
  },
  batchedNormalize: function (f, n) {
    if (!f) {
      return {};
    }
    var j = this.getProcessors(),
      d = this.getAliases(),
      a = f.translation || f.translate,
      o = {},
      g,
      h,
      b,
      e,
      p,
      c,
      m,
      l,
      k;
    if ("rotation" in f) {
      p = f.rotation;
    } else {
      p = "rotate" in f ? f.rotate : undefined;
    }
    if ("scaling" in f) {
      c = f.scaling;
    } else {
      c = "scale" in f ? f.scale : undefined;
    }
    if (typeof c !== "undefined") {
      if (Ext.isNumber(c)) {
        o.scalingX = c;
        o.scalingY = c;
      } else {
        if ("x" in c) {
          o.scalingX = c.x;
        }
        if ("y" in c) {
          o.scalingY = c.y;
        }
        if ("centerX" in c) {
          o.scalingCenterX = c.centerX;
        }
        if ("centerY" in c) {
          o.scalingCenterY = c.centerY;
        }
      }
    }
    if (typeof p !== "undefined") {
      if (Ext.isNumber(p)) {
        p = Ext.draw.Draw.rad(p);
        o.rotationRads = p;
      } else {
        if ("rads" in p) {
          o.rotationRads = p.rads;
        } else {
          if ("degrees" in p) {
            if (Ext.isArray(p.degrees)) {
              o.rotationRads = Ext.Array.map(p.degrees, function (i) {
                return Ext.draw.Draw.rad(i);
              });
            } else {
              o.rotationRads = Ext.draw.Draw.rad(p.degrees);
            }
          }
        }
        if ("centerX" in p) {
          o.rotationCenterX = p.centerX;
        }
        if ("centerY" in p) {
          o.rotationCenterY = p.centerY;
        }
      }
    }
    if (typeof a !== "undefined") {
      if ("x" in a) {
        o.translationX = a.x;
      }
      if ("y" in a) {
        o.translationY = a.y;
      }
    }
    if ("matrix" in f) {
      m = Ext.draw.Matrix.create(f.matrix);
      k = m.split();
      o.matrix = m;
      o.rotationRads = k.rotation;
      o.rotationCenterX = 0;
      o.rotationCenterY = 0;
      o.scalingX = k.scaleX;
      o.scalingY = k.scaleY;
      o.scalingCenterX = 0;
      o.scalingCenterY = 0;
      o.translationX = k.translateX;
      o.translationY = k.translateY;
    }
    for (b in f) {
      e = f[b];
      if (typeof e === "undefined") {
        continue;
      } else {
        if (Ext.isArray(e)) {
          if (b in d) {
            b = d[b];
          }
          if (b in j) {
            o[b] = [];
            for (g = 0, h = e.length; g < h; g++) {
              l = j[b].call(this, e[g]);
              if (typeof l !== "undefined") {
                o[b][g] = l;
              }
            }
          } else {
            if (n) {
              o[b] = e;
            }
          }
        } else {
          if (b in d) {
            b = d[b];
          }
          if (b in j) {
            e = j[b].call(this, e);
            if (typeof e !== "undefined") {
              o[b] = e;
            }
          } else {
            if (n) {
              o[b] = e;
            }
          }
        }
      }
    }
    return o;
  },
  normalize: function (i, j) {
    if (!i) {
      return {};
    }
    var f = this.getProcessors(),
      d = this.getAliases(),
      a = i.translation || i.translate,
      k = {},
      b,
      e,
      l,
      c,
      h,
      g;
    if ("rotation" in i) {
      l = i.rotation;
    } else {
      l = "rotate" in i ? i.rotate : undefined;
    }
    if ("scaling" in i) {
      c = i.scaling;
    } else {
      c = "scale" in i ? i.scale : undefined;
    }
    if (a) {
      if ("x" in a) {
        k.translationX = a.x;
      }
      if ("y" in a) {
        k.translationY = a.y;
      }
    }
    if (typeof c !== "undefined") {
      if (Ext.isNumber(c)) {
        k.scalingX = c;
        k.scalingY = c;
      } else {
        if ("x" in c) {
          k.scalingX = c.x;
        }
        if ("y" in c) {
          k.scalingY = c.y;
        }
        if ("centerX" in c) {
          k.scalingCenterX = c.centerX;
        }
        if ("centerY" in c) {
          k.scalingCenterY = c.centerY;
        }
      }
    }
    if (typeof l !== "undefined") {
      if (Ext.isNumber(l)) {
        l = Ext.draw.Draw.rad(l);
        k.rotationRads = l;
      } else {
        if ("rads" in l) {
          k.rotationRads = l.rads;
        } else {
          if ("degrees" in l) {
            k.rotationRads = Ext.draw.Draw.rad(l.degrees);
          }
        }
        if ("centerX" in l) {
          k.rotationCenterX = l.centerX;
        }
        if ("centerY" in l) {
          k.rotationCenterY = l.centerY;
        }
      }
    }
    if ("matrix" in i) {
      h = Ext.draw.Matrix.create(i.matrix);
      g = h.split();
      k.matrix = h;
      k.rotationRads = g.rotation;
      k.rotationCenterX = 0;
      k.rotationCenterY = 0;
      k.scalingX = g.scaleX;
      k.scalingY = g.scaleY;
      k.scalingCenterX = 0;
      k.scalingCenterY = 0;
      k.translationX = g.translateX;
      k.translationY = g.translateY;
    }
    for (b in i) {
      e = i[b];
      if (typeof e === "undefined") {
        continue;
      }
      if (b in d) {
        b = d[b];
      }
      if (b in f) {
        e = f[b].call(this, e);
        if (typeof e !== "undefined") {
          k[b] = e;
        }
      } else {
        if (j) {
          k[b] = e;
        }
      }
    }
    return k;
  },
  setBypassingNormalization: function (a, c, b) {
    return c.pushDown(a, b);
  },
  set: function (a, c, b) {
    b = this.normalize(b);
    return this.setBypassingNormalization(a, c, b);
  }
});
Ext.define(
  "Ext.draw.Matrix",
  {
    isMatrix: true,
    statics: {
      createAffineMatrixFromTwoPair: function (h, t, g, s, k, o, i, j) {
        var v = g - h,
          u = s - t,
          e = i - k,
          q = j - o,
          d = 1 / (v * v + u * u),
          p = v * e + u * q,
          n = e * u - v * q,
          m = -p * h - n * t,
          l = n * h - p * t;
        return new this(p * d, -n * d, n * d, p * d, m * d + k, l * d + o);
      },
      createPanZoomFromTwoPair: function (q, e, p, c, h, s, n, g) {
        if (arguments.length === 2) {
          return this.createPanZoomFromTwoPair.apply(this, q.concat(e));
        }
        var k = p - q,
          j = c - e,
          d = (q + p) * 0.5,
          b = (e + c) * 0.5,
          o = n - h,
          a = g - s,
          f = (h + n) * 0.5,
          l = (s + g) * 0.5,
          m = k * k + j * j,
          i = o * o + a * a,
          t = Math.sqrt(i / m);
        return new this(t, 0, 0, t, f - t * d, l - t * b);
      },
      fly: (function () {
        var a = null,
          b = function (c) {
            a.elements = c;
            return a;
          };
        return function (c) {
          if (!a) {
            a = new Ext.draw.Matrix();
          }
          a.elements = c;
          Ext.draw.Matrix.fly = b;
          return a;
        };
      })(),
      create: function (a) {
        if (a instanceof this) {
          return a;
        }
        return new this(a);
      }
    },
    constructor: function (e, d, a, f, c, b) {
      if (e && e.length === 6) {
        this.elements = e.slice();
      } else {
        if (e !== undefined) {
          this.elements = [e, d, a, f, c, b];
        } else {
          this.elements = [1, 0, 0, 1, 0, 0];
        }
      }
    },
    prepend: function (a, l, h, g, m, k) {
      var b = this.elements,
        d = b[0],
        j = b[1],
        e = b[2],
        c = b[3],
        i = b[4],
        f = b[5];
      b[0] = a * d + h * j;
      b[1] = l * d + g * j;
      b[2] = a * e + h * c;
      b[3] = l * e + g * c;
      b[4] = a * i + h * f + m;
      b[5] = l * i + g * f + k;
      return this;
    },
    prependMatrix: function (a) {
      return this.prepend.apply(this, a.elements);
    },
    append: function (a, l, h, g, m, k) {
      var b = this.elements,
        d = b[0],
        j = b[1],
        e = b[2],
        c = b[3],
        i = b[4],
        f = b[5];
      b[0] = a * d + l * e;
      b[1] = a * j + l * c;
      b[2] = h * d + g * e;
      b[3] = h * j + g * c;
      b[4] = m * d + k * e + i;
      b[5] = m * j + k * c + f;
      return this;
    },
    appendMatrix: function (a) {
      return this.append.apply(this, a.elements);
    },
    set: function (f, e, a, g, c, b) {
      var d = this.elements;
      d[0] = f;
      d[1] = e;
      d[2] = a;
      d[3] = g;
      d[4] = c;
      d[5] = b;
      return this;
    },
    inverse: function (i) {
      var g = this.elements,
        o = g[0],
        m = g[1],
        l = g[2],
        k = g[3],
        j = g[4],
        h = g[5],
        n = 1 / (o * k - m * l);
      o *= n;
      m *= n;
      l *= n;
      k *= n;
      if (i) {
        i.set(k, -m, -l, o, l * h - k * j, m * j - o * h);
        return i;
      } else {
        return new Ext.draw.Matrix(k, -m, -l, o, l * h - k * j, m * j - o * h);
      }
    },
    translate: function (a, c, b) {
      if (b) {
        return this.prepend(1, 0, 0, 1, a, c);
      } else {
        return this.append(1, 0, 0, 1, a, c);
      }
    },
    scale: function (f, e, c, a, b) {
      var d = this;
      if (e == null) {
        e = f;
      }
      if (c === undefined) {
        c = 0;
      }
      if (a === undefined) {
        a = 0;
      }
      if (b) {
        return d.prepend(f, 0, 0, e, c - c * f, a - a * e);
      } else {
        return d.append(f, 0, 0, e, c - c * f, a - a * e);
      }
    },
    rotate: function (g, e, c, b) {
      var d = this,
        f = Math.cos(g),
        a = Math.sin(g);
      e = e || 0;
      c = c || 0;
      if (b) {
        return d.prepend(f, a, -a, f, e - f * e + c * a, c - f * c - e * a);
      } else {
        return d.append(f, a, -a, f, e - f * e + c * a, c - f * c - e * a);
      }
    },
    rotateFromVector: function (a, h, c) {
      var e = this,
        g = Math.sqrt(a * a + h * h),
        f = a / g,
        b = h / g;
      if (c) {
        return e.prepend(f, b, -b, f, 0, 0);
      } else {
        return e.append(f, b, -b, f, 0, 0);
      }
    },
    clone: function () {
      return new Ext.draw.Matrix(this.elements);
    },
    flipX: function () {
      return this.append(-1, 0, 0, 1, 0, 0);
    },
    flipY: function () {
      return this.append(1, 0, 0, -1, 0, 0);
    },
    skewX: function (a) {
      return this.append(1, 0, Math.tan(a), 1, 0, 0);
    },
    skewY: function (a) {
      return this.append(1, Math.tan(a), 0, 1, 0, 0);
    },
    shearX: function (a) {
      return this.append(1, 0, a, 1, 0, 0);
    },
    shearY: function (a) {
      return this.append(1, a, 0, 1, 0, 0);
    },
    reset: function () {
      return this.set(1, 0, 0, 1, 0, 0);
    },
    precisionCompensate: function (j, g) {
      var c = this.elements,
        f = c[0],
        e = c[1],
        i = c[2],
        h = c[3],
        d = c[4],
        b = c[5],
        a = e * i - f * h;
      g.b = (j * e) / f;
      g.c = (j * i) / h;
      g.d = j;
      g.xx = f / j;
      g.yy = h / j;
      g.dx = (b * f * i - d * f * h) / a / j;
      g.dy = (d * e * h - b * f * h) / a / j;
    },
    precisionCompensateRect: function (j, g) {
      var b = this.elements,
        f = b[0],
        e = b[1],
        i = b[2],
        h = b[3],
        c = b[4],
        a = b[5],
        d = i / f;
      g.b = (j * e) / f;
      g.c = j * d;
      g.d = (j * h) / f;
      g.xx = f / j;
      g.yy = f / j;
      g.dx = (a * i - c * h) / (e * d - h) / j;
      g.dy = -(a * f - c * e) / (e * d - h) / j;
    },
    x: function (a, c) {
      var b = this.elements;
      return a * b[0] + c * b[2] + b[4];
    },
    y: function (a, c) {
      var b = this.elements;
      return a * b[1] + c * b[3] + b[5];
    },
    get: function (b, a) {
      return +this.elements[b + a * 2].toFixed(4);
    },
    transformPoint: function (b) {
      var c = this.elements,
        a,
        d;
      if (b.isPoint) {
        a = b.x;
        d = b.y;
      } else {
        a = b[0];
        d = b[1];
      }
      return [a * c[0] + d * c[2] + c[4], a * c[1] + d * c[3] + c[5]];
    },
    transformBBox: function (q, i, j) {
      var b = this.elements,
        d = q.x,
        r = q.y,
        g = q.width * 0.5,
        o = q.height * 0.5,
        a = b[0],
        s = b[1],
        n = b[2],
        k = b[3],
        e = d + g,
        c = r + o,
        p,
        f,
        m;
      if (i) {
        g -= i;
        o -= i;
        m = [
          Math.sqrt(b[0] * b[0] + b[2] * b[2]),
          Math.sqrt(b[1] * b[1] + b[3] * b[3])
        ];
        p = Math.abs(g * a) + Math.abs(o * n) + Math.abs(m[0] * i);
        f = Math.abs(g * s) + Math.abs(o * k) + Math.abs(m[1] * i);
      } else {
        p = Math.abs(g * a) + Math.abs(o * n);
        f = Math.abs(g * s) + Math.abs(o * k);
      }
      if (!j) {
        j = {};
      }
      j.x = e * a + c * n + b[4] - p;
      j.y = e * s + c * k + b[5] - f;
      j.width = p + p;
      j.height = f + f;
      return j;
    },
    transformList: function (e) {
      var b = this.elements,
        a = b[0],
        h = b[2],
        l = b[4],
        k = b[1],
        g = b[3],
        j = b[5],
        f = e.length,
        c,
        d;
      for (d = 0; d < f; d++) {
        c = e[d];
        e[d] = [c[0] * a + c[1] * h + l, c[0] * k + c[1] * g + j];
      }
      return e;
    },
    isIdentity: function () {
      var a = this.elements;
      return (
        a[0] === 1 &&
        a[1] === 0 &&
        a[2] === 0 &&
        a[3] === 1 &&
        a[4] === 0 &&
        a[5] === 0
      );
    },
    isEqual: function (a) {
      var c = a && a.isMatrix ? a.elements : a,
        b = this.elements;
      return (
        b[0] === c[0] &&
        b[1] === c[1] &&
        b[2] === c[2] &&
        b[3] === c[3] &&
        b[4] === c[4] &&
        b[5] === c[5]
      );
    },
    equals: function (a) {
      return this.isEqual(a);
    },
    toArray: function () {
      var a = this.elements;
      return [a[0], a[2], a[4], a[1], a[3], a[5]];
    },
    toVerticalArray: function () {
      return this.elements.slice();
    },
    toString: function () {
      var a = this;
      return [
        a.get(0, 0),
        a.get(0, 1),
        a.get(1, 0),
        a.get(1, 1),
        a.get(2, 0),
        a.get(2, 1)
      ].join(",");
    },
    toContext: function (a) {
      a.transform.apply(a, this.elements);
      return this;
    },
    toSvg: function () {
      var a = this.elements;
      return (
        "matrix(" +
        a[0].toFixed(9) +
        "," +
        a[1].toFixed(9) +
        "," +
        a[2].toFixed(9) +
        "," +
        a[3].toFixed(9) +
        "," +
        a[4].toFixed(9) +
        "," +
        a[5].toFixed(9) +
        ")"
      );
    },
    getScaleX: function () {
      var a = this.elements;
      return Math.sqrt(a[0] * a[0] + a[2] * a[2]);
    },
    getScaleY: function () {
      var a = this.elements;
      return Math.sqrt(a[1] * a[1] + a[3] * a[3]);
    },
    getXX: function () {
      return this.elements[0];
    },
    getXY: function () {
      return this.elements[1];
    },
    getYX: function () {
      return this.elements[2];
    },
    getYY: function () {
      return this.elements[3];
    },
    getDX: function () {
      return this.elements[4];
    },
    getDY: function () {
      return this.elements[5];
    },
    split: function () {
      var b = this.elements,
        d = b[0],
        c = b[1],
        e = b[3],
        a = { translateX: b[4], translateY: b[5] };
      a.rotate = a.rotation = Math.atan2(c, d);
      a.scaleX = d / Math.cos(a.rotate);
      a.scaleY = (e / d) * a.scaleX;
      return a;
    }
  },
  function () {
    function b(e, c, d) {
      e[c] = {
        get: function () {
          return this.elements[d];
        },
        set: function (f) {
          this.elements[d] = f;
        }
      };
    }
    if (Object.defineProperties) {
      var a = {};
      b(a, "a", 0);
      b(a, "b", 1);
      b(a, "c", 2);
      b(a, "d", 3);
      b(a, "e", 4);
      b(a, "f", 5);
      Object.defineProperties(this.prototype, a);
    }
    this.prototype.multiply = this.prototype.appendMatrix;
  }
);
Ext.define("Ext.draw.modifier.Modifier", {
  mixins: { observable: "Ext.mixin.Observable" },
  config: { lower: null, upper: null, sprite: null },
  constructor: function (a) {
    this.mixins.observable.constructor.call(this, a);
  },
  updateUpper: function (a) {
    if (a) {
      a.setLower(this);
    }
  },
  updateLower: function (a) {
    if (a) {
      a.setUpper(this);
    }
  },
  prepareAttributes: function (a) {
    if (this._lower) {
      this._lower.prepareAttributes(a);
    }
  },
  popUp: function (a, b) {
    if (this._upper) {
      this._upper.popUp(a, b);
    } else {
      Ext.apply(a, b);
    }
  },
  pushDown: function (a, c) {
    if (this._lower) {
      return this._lower.pushDown(a, c);
    } else {
      for (var b in c) {
        if (c[b] === a[b]) {
          delete c[b];
        }
      }
      return c;
    }
  }
});
Ext.define("Ext.draw.modifier.Target", {
  requires: ["Ext.draw.Matrix"],
  extend: "Ext.draw.modifier.Modifier",
  alias: "modifier.target",
  statics: { uniqueId: 0 },
  prepareAttributes: function (a) {
    if (this._lower) {
      this._lower.prepareAttributes(a);
    }
    a.attributeId = "attribute-" + Ext.draw.modifier.Target.uniqueId++;
    if (!a.hasOwnProperty("canvasAttributes")) {
      a.bbox = { plain: { dirty: true }, transform: { dirty: true } };
      a.dirty = true;
      a.pendingUpdaters = {};
      a.canvasAttributes = {};
      a.matrix = new Ext.draw.Matrix();
      a.inverseMatrix = new Ext.draw.Matrix();
    }
  },
  applyChanges: function (f, k) {
    Ext.apply(f, k);
    var l = this.getSprite(),
      o = f.pendingUpdaters,
      h = l.self.def.getTriggers(),
      p,
      a,
      m,
      b,
      e,
      n,
      d,
      c,
      g;
    for (b in k) {
      e = true;
      if ((p = h[b])) {
        l.scheduleUpdaters(f, p, [b]);
      }
      if (f.template && k.removeFromInstance && k.removeFromInstance[b]) {
        delete f[b];
      }
    }
    if (!e) {
      return;
    }
    if (o.canvas) {
      n = o.canvas;
      delete o.canvas;
      for (d = 0, g = n.length; d < g; d++) {
        b = n[d];
        f.canvasAttributes[b] = f[b];
      }
    }
    if (f.hasOwnProperty("children")) {
      a = f.children;
      for (d = 0, g = a.length; d < g; d++) {
        m = a[d];
        Ext.apply(m.pendingUpdaters, o);
        if (n) {
          for (c = 0; c < n.length; c++) {
            b = n[c];
            m.canvasAttributes[b] = m[b];
          }
        }
        l.callUpdaters(m);
      }
    }
    l.setDirty(true);
    l.callUpdaters(f);
  },
  popUp: function (a, b) {
    this.applyChanges(a, b);
  },
  pushDown: function (a, b) {
    if (this._lower) {
      b = this._lower.pushDown(a, b);
    }
    this.applyChanges(a, b);
    return b;
  }
});
Ext.define(
  "Ext.draw.TimingFunctions",
  function () {
    var g = Math.pow,
      j = Math.sin,
      m = Math.cos,
      l = Math.sqrt,
      e = Math.PI,
      b = ["quad", "cube", "quart", "quint"],
      c = {
        pow: function (o, i) {
          return g(o, i || 6);
        },
        expo: function (i) {
          return g(2, 8 * (i - 1));
        },
        circ: function (i) {
          return 1 - l(1 - i * i);
        },
        sine: function (i) {
          return 1 - j(((1 - i) * e) / 2);
        },
        back: function (i, o) {
          o = o || 1.616;
          return i * i * ((o + 1) * i - o);
        },
        bounce: function (q) {
          for (var o = 0, i = 1; 1; o += i, i /= 2) {
            if (q >= (7 - 4 * o) / 11) {
              return i * i - g((11 - 6 * o - 11 * q) / 4, 2);
            }
          }
        },
        elastic: function (o, i) {
          return g(2, 10 * --o) * m((20 * o * e * (i || 1)) / 3);
        }
      },
      k = {},
      a,
      f,
      d;
    function h(i) {
      return function (o) {
        return g(o, i);
      };
    }
    function n(i, o) {
      k[i + "In"] = function (p) {
        return o(p);
      };
      k[i + "Out"] = function (p) {
        return 1 - o(1 - p);
      };
      k[i + "InOut"] = function (p) {
        return p <= 0.5 ? o(2 * p) / 2 : (2 - o(2 * (1 - p))) / 2;
      };
    }
    for (d = 0, f = b.length; d < f; ++d) {
      c[b[d]] = h(d + 2);
    }
    for (a in c) {
      n(a, c[a]);
    }
    k.linear = Ext.identityFn;
    k.easeIn = k.quadIn;
    k.easeOut = k.quadOut;
    k.easeInOut = k.quadInOut;
    return { singleton: true, easingMap: k };
  },
  function (a) {
    Ext.apply(a, a.easingMap);
  }
);
Ext.define("Ext.draw.Animator", {
  uses: ["Ext.draw.Draw"],
  singleton: true,
  frameCallbacks: {},
  frameCallbackId: 0,
  scheduled: 0,
  frameStartTimeOffset: Ext.now(),
  animations: [],
  running: false,
  animationTime: function () {
    return Ext.AnimationQueue.frameStartTime - this.frameStartTimeOffset;
  },
  add: function (b) {
    var a = this;
    if (!a.contains(b)) {
      a.animations.push(b);
      a.ignite();
      if ("fireEvent" in b) {
        b.fireEvent("animationstart", b);
      }
    }
  },
  remove: function (d) {
    var c = this,
      e = c.animations,
      b = 0,
      a = e.length;
    for (; b < a; ++b) {
      if (e[b] === d) {
        e.splice(b, 1);
        if ("fireEvent" in d) {
          d.fireEvent("animationend", d);
        }
        return;
      }
    }
  },
  contains: function (a) {
    return Ext.Array.indexOf(this.animations, a) > -1;
  },
  empty: function () {
    return this.animations.length === 0;
  },
  step: function (d) {
    var c = this,
      f = c.animations,
      e,
      a = 0,
      b = f.length;
    for (; a < b; a++) {
      e = f[a];
      e.step(d);
      if (!e.animating) {
        f.splice(a, 1);
        a--;
        b--;
        if (e.fireEvent) {
          e.fireEvent("animationend", e);
        }
      }
    }
  },
  schedule: function (c, a) {
    a = a || this;
    var b = "frameCallback" + this.frameCallbackId++;
    if (Ext.isString(c)) {
      c = a[c];
    }
    Ext.draw.Animator.frameCallbacks[b] = { fn: c, scope: a, once: true };
    this.scheduled++;
    Ext.draw.Animator.ignite();
    return b;
  },
  scheduleIf: function (e, b) {
    b = b || this;
    var c = Ext.draw.Animator.frameCallbacks,
      a,
      d;
    if (Ext.isString(e)) {
      e = b[e];
    }
    for (d in c) {
      a = c[d];
      if (a.once && a.fn === e && a.scope === b) {
        return null;
      }
    }
    return this.schedule(e, b);
  },
  cancel: function (a) {
    if (
      Ext.draw.Animator.frameCallbacks[a] &&
      Ext.draw.Animator.frameCallbacks[a].once
    ) {
      this.scheduled--;
      delete Ext.draw.Animator.frameCallbacks[a];
    }
  },
  addFrameCallback: function (c, a) {
    a = a || this;
    if (Ext.isString(c)) {
      c = a[c];
    }
    var b = "frameCallback" + this.frameCallbackId++;
    Ext.draw.Animator.frameCallbacks[b] = { fn: c, scope: a };
    return b;
  },
  removeFrameCallback: function (a) {
    delete Ext.draw.Animator.frameCallbacks[a];
  },
  fireFrameCallbacks: function () {
    var c = this.frameCallbacks,
      d,
      b,
      a;
    for (d in c) {
      a = c[d];
      b = a.fn;
      if (Ext.isString(b)) {
        b = a.scope[b];
      }
      b.call(a.scope);
      if (c[d] && a.once) {
        this.scheduled--;
        delete c[d];
      }
    }
  },
  handleFrame: function () {
    var a = this;
    a.step(a.animationTime());
    a.fireFrameCallbacks();
    if (!a.scheduled && a.empty()) {
      Ext.AnimationQueue.stop(a.handleFrame, a);
      a.running = false;
      Ext.draw.Draw.endUpdateIOS();
    }
  },
  ignite: function () {
    if (!this.running) {
      this.running = true;
      Ext.AnimationQueue.start(this.handleFrame, this);
      Ext.draw.Draw.beginUpdateIOS();
    }
  }
});
Ext.define("Ext.draw.modifier.Animation", {
  requires: ["Ext.draw.TimingFunctions", "Ext.draw.Animator"],
  extend: "Ext.draw.modifier.Modifier",
  alias: "modifier.animation",
  config: {
    easing: Ext.identityFn,
    duration: 0,
    customEasings: {},
    customDurations: {}
  },
  constructor: function (a) {
    var b = this;
    b.anyAnimation = b.anySpecialAnimations = false;
    b.animating = 0;
    b.animatingPool = [];
    b.callParent([a]);
  },
  prepareAttributes: function (a) {
    if (!a.hasOwnProperty("timers")) {
      a.animating = false;
      a.timers = {};
      a.animationOriginal = Ext.Object.chain(a);
      a.animationOriginal.prototype = a;
    }
    if (this._lower) {
      this._lower.prepareAttributes(a.animationOriginal);
    }
  },
  updateSprite: function (a) {
    this.setConfig(a.config.fx);
  },
  updateDuration: function (a) {
    this.anyAnimation = a > 0;
  },
  applyEasing: function (a) {
    if (typeof a === "string") {
      a = Ext.draw.TimingFunctions.easingMap[a];
    }
    return a;
  },
  applyCustomEasings: function (a, e) {
    e = e || {};
    var g, d, b, h, c, f;
    for (d in a) {
      g = true;
      h = a[d];
      b = d.split(",");
      if (typeof h === "string") {
        h = Ext.draw.TimingFunctions.easingMap[h];
      }
      for (c = 0, f = b.length; c < f; c++) {
        e[b[c]] = h;
      }
    }
    if (g) {
      this.anySpecialAnimations = g;
    }
    return e;
  },
  setEasingOn: function (a, e) {
    a = Ext.Array.from(a).slice();
    var c = {},
      d = a.length,
      b = 0;
    for (; b < d; b++) {
      c[a[b]] = e;
    }
    this.setCustomEasings(c);
  },
  clearEasingOn: function (a) {
    a = Ext.Array.from(a, true);
    var b = 0,
      c = a.length;
    for (; b < c; b++) {
      delete this._customEasings[a[b]];
    }
  },
  applyCustomDurations: function (g, h) {
    h = h || {};
    var e, c, f, a, b, d;
    for (c in g) {
      e = true;
      f = g[c];
      a = c.split(",");
      for (b = 0, d = a.length; b < d; b++) {
        h[a[b]] = f;
      }
    }
    if (e) {
      this.anySpecialAnimations = e;
    }
    return h;
  },
  setDurationOn: function (b, e) {
    b = Ext.Array.from(b).slice();
    var a = {},
      c = 0,
      d = b.length;
    for (; c < d; c++) {
      a[b[c]] = e;
    }
    this.setCustomDurations(a);
  },
  clearDurationOn: function (a) {
    a = Ext.Array.from(a, true);
    var b = 0,
      c = a.length;
    for (; b < c; b++) {
      delete this._customDurations[a[b]];
    }
  },
  setAnimating: function (a, b) {
    var e = this,
      d = e.animatingPool;
    if (a.animating !== b) {
      a.animating = b;
      if (b) {
        d.push(a);
        if (e.animating === 0) {
          Ext.draw.Animator.add(e);
        }
        e.animating++;
      } else {
        for (var c = d.length; c--; ) {
          if (d[c] === a) {
            d.splice(c, 1);
          }
        }
        e.animating = d.length;
      }
    }
  },
  setAttrs: function (r, t) {
    var s = this,
      m = r.timers,
      h = s._sprite.self.def._animationProcessors,
      f = s._easing,
      e = s._duration,
      j = s._customDurations,
      i = s._customEasings,
      g = s.anySpecialAnimations,
      n = s.anyAnimation || g,
      o = r.animationOriginal,
      d = false,
      k,
      u,
      l,
      p,
      c,
      q,
      a;
    if (!n) {
      for (u in t) {
        if (r[u] === t[u]) {
          delete t[u];
        } else {
          r[u] = t[u];
        }
        delete o[u];
        delete m[u];
      }
      return t;
    } else {
      for (u in t) {
        l = t[u];
        p = r[u];
        if (l !== p && p !== undefined && p !== null && (c = h[u])) {
          q = f;
          a = e;
          if (g) {
            if (u in i) {
              q = i[u];
            }
            if (u in j) {
              a = j[u];
            }
          }
          if ((p && p.isGradient) || (l && l.isGradient)) {
            a = 0;
          }
          if (a) {
            if (!m[u]) {
              m[u] = {};
            }
            k = m[u];
            k.start = 0;
            k.easing = q;
            k.duration = a;
            k.compute = c.compute;
            k.serve = c.serve || Ext.identityFn;
            k.remove = t.removeFromInstance && t.removeFromInstance[u];
            if (c.parseInitial) {
              var b = c.parseInitial(p, l);
              k.source = b[0];
              k.target = b[1];
            } else {
              if (c.parse) {
                k.source = c.parse(p);
                k.target = c.parse(l);
              } else {
                k.source = p;
                k.target = l;
              }
            }
            o[u] = l;
            delete t[u];
            d = true;
            continue;
          } else {
            delete o[u];
          }
        } else {
          delete o[u];
        }
        delete m[u];
      }
    }
    if (d && !r.animating) {
      s.setAnimating(r, true);
    }
    return t;
  },
  updateAttributes: function (g) {
    if (!g.animating) {
      return {};
    }
    var h = {},
      e = false,
      d = g.timers,
      f = g.animationOriginal,
      c = Ext.draw.Animator.animationTime(),
      a,
      b,
      i;
    if (g.lastUpdate === c) {
      return null;
    }
    for (a in d) {
      b = d[a];
      if (!b.start) {
        b.start = c;
        i = 0;
      } else {
        i = (c - b.start) / b.duration;
      }
      if (i >= 1) {
        h[a] = f[a];
        delete f[a];
        if (d[a].remove) {
          h.removeFromInstance = h.removeFromInstance || {};
          h.removeFromInstance[a] = true;
        }
        delete d[a];
      } else {
        h[a] = b.serve(b.compute(b.source, b.target, b.easing(i), g[a]));
        e = true;
      }
    }
    g.lastUpdate = c;
    this.setAnimating(g, e);
    return h;
  },
  pushDown: function (a, b) {
    b = this.callParent([a.animationOriginal, b]);
    return this.setAttrs(a, b);
  },
  popUp: function (a, b) {
    a = a.prototype;
    b = this.setAttrs(a, b);
    if (this._upper) {
      return this._upper.popUp(a, b);
    } else {
      return Ext.apply(a, b);
    }
  },
  step: function (g) {
    var f = this,
      c = f.animatingPool.slice(),
      e = c.length,
      b = 0,
      a,
      d;
    for (; b < e; b++) {
      a = c[b];
      d = f.updateAttributes(a);
      if (d && f._upper) {
        f._upper.popUp(a, d);
      }
    }
  },
  stop: function () {
    this.step();
    var d = this,
      b = d.animatingPool,
      a,
      c;
    for (a = 0, c = b.length; a < c; a++) {
      b[a].animating = false;
    }
    d.animatingPool.length = 0;
    d.animating = 0;
    Ext.draw.Animator.remove(d);
  },
  destroy: function () {
    this.stop();
    this.callParent();
  }
});
Ext.define("Ext.draw.modifier.Highlight", {
  extend: "Ext.draw.modifier.Modifier",
  alias: "modifier.highlight",
  config: { enabled: false, highlightStyle: null },
  preFx: true,
  applyHighlightStyle: function (b, a) {
    a = a || {};
    if (this.getSprite()) {
      Ext.apply(a, this.getSprite().self.def.normalize(b));
    } else {
      Ext.apply(a, b);
    }
    return a;
  },
  prepareAttributes: function (a) {
    if (!a.hasOwnProperty("highlightOriginal")) {
      a.highlighted = false;
      a.highlightOriginal = Ext.Object.chain(a);
      a.highlightOriginal.prototype = a;
      a.highlightOriginal.removeFromInstance = {};
    }
    if (this._lower) {
      this._lower.prepareAttributes(a.highlightOriginal);
    }
  },
  updateSprite: function (b, a) {
    if (b) {
      if (this.getHighlightStyle()) {
        this._highlightStyle = b.self.def.normalize(this.getHighlightStyle());
      }
      this.setHighlightStyle(b.config.highlight);
    }
    b.self.def.setConfig({
      defaults: { highlighted: false },
      processors: { highlighted: "bool" }
    });
    this.setSprite(b);
  },
  filterChanges: function (a, d) {
    var e = this,
      f = a.highlightOriginal,
      c = e.getHighlightStyle(),
      b;
    if (a.highlighted) {
      for (b in d) {
        if (c.hasOwnProperty(b)) {
          f[b] = d[b];
          delete d[b];
        }
      }
    }
    for (b in d) {
      if (b !== "highlighted" && f[b] === d[b]) {
        delete d[b];
      }
    }
    return d;
  },
  pushDown: function (e, g) {
    var f = this.getHighlightStyle(),
      c = e.highlightOriginal,
      i = c.removeFromInstance,
      d,
      a,
      h,
      b;
    if (g.hasOwnProperty("highlighted")) {
      d = g.highlighted;
      delete g.highlighted;
      if (this._lower) {
        g = this._lower.pushDown(c, g);
      }
      g = this.filterChanges(e, g);
      if (d !== e.highlighted) {
        if (d) {
          for (a in f) {
            if (a in g) {
              c[a] = g[a];
            } else {
              h = e.template && e.template.ownAttr;
              if (h && !e.prototype.hasOwnProperty(a)) {
                i[a] = true;
                c[a] = h.animationOriginal[a];
              } else {
                b = c.timers[a];
                if (b && b.remove) {
                  i[a] = true;
                }
                c[a] = e[a];
              }
            }
            if (c[a] !== f[a]) {
              g[a] = f[a];
            }
          }
        } else {
          for (a in f) {
            if (!(a in g)) {
              g[a] = c[a];
            }
            delete c[a];
          }
          g.removeFromInstance = g.removeFromInstance || {};
          Ext.apply(g.removeFromInstance, i);
          c.removeFromInstance = {};
        }
        g.highlighted = d;
      }
    } else {
      if (this._lower) {
        g = this._lower.pushDown(c, g);
      }
      g = this.filterChanges(e, g);
    }
    return g;
  },
  popUp: function (a, b) {
    b = this.filterChanges(a, b);
    Ext.draw.modifier.Modifier.prototype.popUp.call(this, a, b);
  }
});
Ext.define(
  "Ext.draw.sprite.Sprite",
  {
    alias: "sprite.sprite",
    mixins: { observable: "Ext.mixin.Observable" },
    requires: [
      "Ext.draw.Draw",
      "Ext.draw.gradient.Gradient",
      "Ext.draw.sprite.AttributeDefinition",
      "Ext.draw.modifier.Target",
      "Ext.draw.modifier.Animation",
      "Ext.draw.modifier.Highlight"
    ],
    isSprite: true,
    statics: { defaultHitTestOptions: { fill: true, stroke: true } },
    inheritableStatics: {
      def: {
        processors: {
          strokeStyle: "color",
          fillStyle: "color",
          strokeOpacity: "limited01",
          fillOpacity: "limited01",
          lineWidth: "number",
          lineCap: "enums(butt,round,square)",
          lineJoin: "enums(round,bevel,miter)",
          lineDash: "data",
          lineDashOffset: "number",
          miterLimit: "number",
          shadowColor: "color",
          shadowOffsetX: "number",
          shadowOffsetY: "number",
          shadowBlur: "number",
          globalAlpha: "limited01",
          globalCompositeOperation:
            "enums(source-over,destination-over,source-in,destination-in,source-out,destination-out,source-atop,destination-atop,lighter,xor,copy)",
          hidden: "bool",
          transformFillStroke: "bool",
          zIndex: "number",
          translationX: "number",
          translationY: "number",
          rotationRads: "number",
          rotationCenterX: "number",
          rotationCenterY: "number",
          scalingX: "number",
          scalingY: "number",
          scalingCenterX: "number",
          scalingCenterY: "number",
          constrainGradients: "bool"
        },
        aliases: {
          stroke: "strokeStyle",
          fill: "fillStyle",
          color: "fillStyle",
          "stroke-width": "lineWidth",
          "stroke-linecap": "lineCap",
          "stroke-linejoin": "lineJoin",
          "stroke-miterlimit": "miterLimit",
          "text-anchor": "textAlign",
          opacity: "globalAlpha",
          translateX: "translationX",
          translateY: "translationY",
          rotateRads: "rotationRads",
          rotateCenterX: "rotationCenterX",
          rotateCenterY: "rotationCenterY",
          scaleX: "scalingX",
          scaleY: "scalingY",
          scaleCenterX: "scalingCenterX",
          scaleCenterY: "scalingCenterY"
        },
        defaults: {
          hidden: false,
          zIndex: 0,
          strokeStyle: "none",
          fillStyle: "none",
          lineWidth: 1,
          lineDash: [],
          lineDashOffset: 0,
          lineCap: "butt",
          lineJoin: "miter",
          miterLimit: 10,
          shadowColor: "none",
          shadowOffsetX: 0,
          shadowOffsetY: 0,
          shadowBlur: 0,
          globalAlpha: 1,
          strokeOpacity: 1,
          fillOpacity: 1,
          transformFillStroke: false,
          translationX: 0,
          translationY: 0,
          rotationRads: 0,
          rotationCenterX: null,
          rotationCenterY: null,
          scalingX: 1,
          scalingY: 1,
          scalingCenterX: null,
          scalingCenterY: null,
          constrainGradients: false
        },
        triggers: {
          zIndex: "zIndex",
          globalAlpha: "canvas",
          globalCompositeOperation: "canvas",
          transformFillStroke: "canvas",
          strokeStyle: "canvas",
          fillStyle: "canvas",
          strokeOpacity: "canvas",
          fillOpacity: "canvas",
          lineWidth: "canvas",
          lineCap: "canvas",
          lineJoin: "canvas",
          lineDash: "canvas",
          lineDashOffset: "canvas",
          miterLimit: "canvas",
          shadowColor: "canvas",
          shadowOffsetX: "canvas",
          shadowOffsetY: "canvas",
          shadowBlur: "canvas",
          translationX: "transform",
          translationY: "transform",
          rotationRads: "transform",
          rotationCenterX: "transform",
          rotationCenterY: "transform",
          scalingX: "transform",
          scalingY: "transform",
          scalingCenterX: "transform",
          scalingCenterY: "transform",
          constrainGradients: "canvas"
        },
        updaters: {
          bbox: "bboxUpdater",
          zIndex: function (a) {
            a.dirtyZIndex = true;
          },
          transform: function (a) {
            a.dirtyTransform = true;
            a.bbox.transform.dirty = true;
          }
        }
      }
    },
    config: { parent: null, surface: null },
    onClassExtended: function (d, c) {
      var b = d.superclass.self.def.initialConfig,
        e = c.inheritableStatics && c.inheritableStatics.def,
        a;
      if (e) {
        a = Ext.Object.merge({}, b, e);
        d.def = new Ext.draw.sprite.AttributeDefinition(a);
        delete c.inheritableStatics.def;
      } else {
        d.def = new Ext.draw.sprite.AttributeDefinition(b);
      }
      d.def.spriteClass = d;
    },
    constructor: function (b) {
      var d = this,
        c = d.self.def,
        e = c.getDefaults(),
        a;
      b = Ext.isObject(b) ? b : {};
      d.id = b.id || Ext.id(null, "ext-sprite-");
      d.attr = {};
      d.mixins.observable.constructor.apply(d, arguments);
      a = Ext.Array.from(b.modifiers, true);
      d.prepareModifiers(a);
      d.initializeAttributes();
      d.setAttributes(e, true);
      d.setAttributes(b);
    },
    getDirty: function () {
      return this.attr.dirty;
    },
    setDirty: function (b) {
      this.attr.dirty = b;
      if (b) {
        var a = this.getParent();
        if (a) {
          a.setDirty(true);
        }
      }
    },
    addModifier: function (a, b) {
      var c = this;
      if (!(a instanceof Ext.draw.modifier.Modifier)) {
        a = Ext.factory(a, null, null, "modifier");
      }
      a.setSprite(c);
      if (a.preFx || (a.config && a.config.preFx)) {
        if (c.fx._lower) {
          c.fx._lower.setUpper(a);
        }
        a.setUpper(c.fx);
      } else {
        c.topModifier._lower.setUpper(a);
        a.setUpper(c.topModifier);
      }
      if (b) {
        c.initializeAttributes();
      }
      return a;
    },
    prepareModifiers: function (d) {
      var c = this,
        a,
        b;
      c.topModifier = new Ext.draw.modifier.Target({ sprite: c });
      c.fx = new Ext.draw.modifier.Animation({ sprite: c });
      c.fx.setUpper(c.topModifier);
      for (a = 0, b = d.length; a < b; a++) {
        c.addModifier(d[a], false);
      }
    },
    getAnimation: function () {
      return this.fx;
    },
    setAnimation: function (a) {
      this.fx.setConfig(a);
    },
    initializeAttributes: function () {
      this.topModifier.prepareAttributes(this.attr);
    },
    callUpdaters: function (d) {
      d = d || this.attr;
      var e = this,
        h = d.pendingUpdaters,
        i = e.self.def.getUpdaters(),
        c = false,
        a = false,
        b,
        g,
        f;
      e.callUpdaters = Ext.emptyFn;
      do {
        c = false;
        for (g in h) {
          c = true;
          b = h[g];
          delete h[g];
          f = i[g];
          if (typeof f === "string") {
            f = e[f];
          }
          if (f) {
            f.call(e, d, b);
          }
        }
        a = a || c;
      } while (c);
      delete e.callUpdaters;
      if (a) {
        e.setDirty(true);
      }
    },
    callUpdater: function (a, c, b) {
      this.scheduleUpdater(a, c, b);
      this.callUpdaters(a);
    },
    scheduleUpdaters: function (a, e, c) {
      var f;
      a = a || this.attr;
      if (c) {
        for (var b = 0, d = e.length; b < d; b++) {
          f = e[b];
          this.scheduleUpdater(a, f, c);
        }
      } else {
        for (f in e) {
          c = e[f];
          this.scheduleUpdater(a, f, c);
        }
      }
    },
    scheduleUpdater: function (a, c, b) {
      b = b || [];
      a = a || this.attr;
      var d = a.pendingUpdaters;
      if (c in d) {
        if (b.length) {
          d[c] = Ext.Array.merge(d[c], b);
        }
      } else {
        d[c] = b;
      }
    },
    setAttributes: function (g, a, i) {
      var f = this,
        e = f.attr,
        d,
        b,
        h,
        c;
      if (a) {
        if (i) {
          f.topModifier.pushDown(e, g);
        } else {
          c = {};
          for (b in g) {
            h = g[b];
            if (h !== e[b]) {
              c[b] = h;
            }
          }
          f.topModifier.pushDown(e, c);
        }
      } else {
        d = f.self.def.normalize(g);
        f.topModifier.pushDown(e, d);
      }
    },
    setAttributesBypassingNormalization: function (b, a) {
      return this.setAttributes(b, true, a);
    },
    bboxUpdater: function (b) {
      var c = b.rotationRads !== 0,
        a = b.scalingX !== 1 || b.scalingY !== 1,
        d = b.rotationCenterX === null || b.rotationCenterY === null,
        e = b.scalingCenterX === null || b.scalingCenterY === null;
      b.bbox.plain.dirty = true;
      b.bbox.transform.dirty = true;
      if ((c && d) || (a && e)) {
        this.scheduleUpdater(b, "transform");
      }
    },
    getBBox: function (d) {
      var e = this,
        a = e.attr,
        f = a.bbox,
        c = f.plain,
        b = f.transform;
      if (c.dirty) {
        e.updatePlainBBox(c);
        c.dirty = false;
      }
      if (!d) {
        e.applyTransformations();
        if (b.dirty) {
          e.updateTransformedBBox(b, c);
          b.dirty = false;
        }
        return b;
      }
      return c;
    },
    updatePlainBBox: Ext.emptyFn,
    updateTransformedBBox: function (a, b) {
      this.attr.matrix.transformBBox(b, 0, a);
    },
    getBBoxCenter: function (a) {
      var b = this.getBBox(a);
      if (b) {
        return [b.x + b.width * 0.5, b.y + b.height * 0.5];
      } else {
        return [0, 0];
      }
    },
    hide: function () {
      this.attr.hidden = true;
      this.setDirty(true);
      return this;
    },
    show: function () {
      this.attr.hidden = false;
      this.setDirty(true);
      return this;
    },
    useAttributes: function (i, f) {
      this.applyTransformations();
      var d = this.attr,
        h = d.canvasAttributes,
        e = h.strokeStyle,
        g = h.fillStyle,
        b = h.lineDash,
        c = h.lineDashOffset,
        a;
      if (e) {
        if (e.isGradient) {
          i.strokeStyle = "black";
          i.strokeGradient = e;
        } else {
          i.strokeGradient = false;
        }
      }
      if (g) {
        if (g.isGradient) {
          i.fillStyle = "black";
          i.fillGradient = g;
        } else {
          i.fillGradient = false;
        }
      }
      if (b) {
        i.setLineDash(b);
      }
      if (Ext.isNumber(c) && Ext.isNumber(i.lineDashOffset)) {
        i.lineDashOffset = c;
      }
      for (a in h) {
        if (h[a] !== undefined && h[a] !== i[a]) {
          i[a] = h[a];
        }
      }
      this.setGradientBBox(i, f);
    },
    setGradientBBox: function (b, c) {
      var a = this.attr;
      if (a.constrainGradients) {
        b.setGradientBBox({ x: c[0], y: c[1], width: c[2], height: c[3] });
      } else {
        b.setGradientBBox(this.getBBox(a.transformFillStroke));
      }
    },
    applyTransformations: function (b) {
      if (!b && !this.attr.dirtyTransform) {
        return;
      }
      var r = this,
        k = r.attr,
        p = r.getBBoxCenter(true),
        g = p[0],
        f = p[1],
        q = k.translationX,
        o = k.translationY,
        j = k.scalingX,
        i = k.scalingY === null ? k.scalingX : k.scalingY,
        m = k.scalingCenterX === null ? g : k.scalingCenterX,
        l = k.scalingCenterY === null ? f : k.scalingCenterY,
        s = k.rotationRads,
        e = k.rotationCenterX === null ? g : k.rotationCenterX,
        d = k.rotationCenterY === null ? f : k.rotationCenterY,
        c = Math.cos(s),
        a = Math.sin(s),
        n,
        h;
      if (j === 1 && i === 1) {
        m = 0;
        l = 0;
      }
      if (s === 0) {
        e = 0;
        d = 0;
      }
      n = m * (1 - j) - e;
      h = l * (1 - i) - d;
      k.matrix.elements = [
        c * j,
        a * j,
        -a * i,
        c * i,
        c * n - a * h + e + q,
        a * n + c * h + d + o
      ];
      k.matrix.inverse(k.inverseMatrix);
      k.dirtyTransform = false;
      k.bbox.transform.dirty = true;
    },
    transform: function (b, c) {
      var a = this.attr,
        e = a.matrix,
        d;
      if (b && b.isMatrix) {
        d = b.elements;
      } else {
        d = b;
      }
      e.prepend.apply(e, d.slice());
      e.inverse(a.inverseMatrix);
      if (c) {
        this.updateTransformAttributes();
      }
      a.dirtyTransform = false;
      a.bbox.transform.dirty = true;
      this.setDirty(true);
      return this;
    },
    updateTransformAttributes: function () {
      var a = this.attr,
        b = a.matrix.split();
      a.rotationRads = b.rotate;
      a.rotationCenterX = 0;
      a.rotationCenterY = 0;
      a.scalingX = b.scaleX;
      a.scalingY = b.scaleY;
      a.scalingCenterX = 0;
      a.scalingCenterY = 0;
      a.translationX = b.translateX;
      a.translationY = b.translateY;
    },
    resetTransform: function (b) {
      var a = this.attr;
      a.matrix.reset();
      a.inverseMatrix.reset();
      if (!b) {
        this.updateTransformAttributes();
      }
      a.dirtyTransform = false;
      a.bbox.transform.dirty = true;
      this.setDirty(true);
      return this;
    },
    setTransform: function (a, b) {
      this.resetTransform(true);
      this.transform.call(this, a, b);
      return this;
    },
    preRender: Ext.emptyFn,
    render: Ext.emptyFn,
    hitTest: function (b, c) {
      if (this.isVisible()) {
        var a = b[0],
          f = b[1],
          e = this.getBBox(),
          d =
            e &&
            a >= e.x &&
            a <= e.x + e.width &&
            f >= e.y &&
            f <= e.y + e.height;
        if (d) {
          return { sprite: this };
        }
      }
      return null;
    },
    isVisible: function () {
      var e = this.attr,
        f = this.getParent(),
        g = f && (f.isSurface || f.isVisible()),
        d = g && !e.hidden && e.globalAlpha,
        b = Ext.util.Color.NONE,
        a = Ext.util.Color.RGBA_NONE,
        c = e.fillOpacity && e.fillStyle !== b && e.fillStyle !== a,
        i = e.strokeOpacity && e.strokeStyle !== b && e.strokeStyle !== a,
        h = d && (c || i);
      return !!h;
    },
    repaint: function () {
      var a = this.getSurface();
      if (a) {
        a.renderFrame();
      }
    },
    remove: function () {
      var a = this.getSurface();
      if (a && a.isSurface) {
        return a.remove(this);
      }
      return null;
    },
    destroy: function () {
      var b = this,
        a = b.topModifier,
        c;
      while (a) {
        c = a;
        a = a._lower;
        c.destroy();
      }
      delete b.attr;
      b.remove();
      if (b.fireEvent("beforedestroy", b) !== false) {
        b.fireEvent("destroy", b);
      }
      b.callParent();
    }
  },
  function () {
    this.def = new Ext.draw.sprite.AttributeDefinition(this.def);
    this.def.spriteClass = this;
  }
);
Ext.define("Ext.draw.Path", {
  requires: ["Ext.draw.Draw"],
  statics: {
    pathRe: /,?([achlmqrstvxz]),?/gi,
    pathRe2: /-/gi,
    pathSplitRe: /\s|,/g
  },
  svgString: "",
  constructor: function (a) {
    var b = this;
    b.commands = [];
    b.params = [];
    b.cursor = null;
    b.startX = 0;
    b.startY = 0;
    if (a) {
      b.fromSvgString(a);
    }
  },
  clear: function () {
    var a = this;
    a.params.length = 0;
    a.commands.length = 0;
    a.cursor = null;
    a.startX = 0;
    a.startY = 0;
    a.dirt();
  },
  dirt: function () {
    this.svgString = "";
  },
  moveTo: function (a, c) {
    var b = this;
    if (!b.cursor) {
      b.cursor = [a, c];
    }
    b.params.push(a, c);
    b.commands.push("M");
    b.startX = a;
    b.startY = c;
    b.cursor[0] = a;
    b.cursor[1] = c;
    b.dirt();
  },
  lineTo: function (a, c) {
    var b = this;
    if (!b.cursor) {
      b.cursor = [a, c];
      b.params.push(a, c);
      b.commands.push("M");
    } else {
      b.params.push(a, c);
      b.commands.push("L");
    }
    b.cursor[0] = a;
    b.cursor[1] = c;
    b.dirt();
  },
  bezierCurveTo: function (c, e, b, d, a, g) {
    var f = this;
    if (!f.cursor) {
      f.moveTo(c, e);
    }
    f.params.push(c, e, b, d, a, g);
    f.commands.push("C");
    f.cursor[0] = a;
    f.cursor[1] = g;
    f.dirt();
  },
  quadraticCurveTo: function (b, e, a, d) {
    var c = this;
    if (!c.cursor) {
      c.moveTo(b, e);
    }
    c.bezierCurveTo(
      (2 * b + c.cursor[0]) / 3,
      (2 * e + c.cursor[1]) / 3,
      (2 * b + a) / 3,
      (2 * e + d) / 3,
      a,
      d
    );
  },
  closePath: function () {
    var a = this;
    if (a.cursor) {
      a.cursor = null;
      a.commands.push("Z");
      a.dirt();
    }
  },
  arcTo: function (A, f, z, d, j, i, v) {
    var E = this;
    if (i === undefined) {
      i = j;
    }
    if (v === undefined) {
      v = 0;
    }
    if (!E.cursor) {
      E.moveTo(A, f);
      return;
    }
    if (j === 0 || i === 0) {
      E.lineTo(A, f);
      return;
    }
    z -= A;
    d -= f;
    var B = E.cursor[0] - A,
      g = E.cursor[1] - f,
      C = z * g - d * B,
      b,
      a,
      l,
      r,
      k,
      q,
      x = Math.sqrt(B * B + g * g),
      u = Math.sqrt(z * z + d * d),
      t,
      e,
      c;
    if (C === 0) {
      E.lineTo(A, f);
      return;
    }
    if (i !== j) {
      b = Math.cos(v);
      a = Math.sin(v);
      l = b / j;
      r = a / i;
      k = -a / j;
      q = b / i;
      var D = l * B + r * g;
      g = k * B + q * g;
      B = D;
      D = l * z + r * d;
      d = k * z + q * d;
      z = D;
    } else {
      B /= j;
      g /= i;
      z /= j;
      d /= i;
    }
    e = B * u + z * x;
    c = g * u + d * x;
    t =
      1 /
      (Math.sin(Math.asin(Math.abs(C) / (x * u)) * 0.5) *
        Math.sqrt(e * e + c * c));
    e *= t;
    c *= t;
    var o = (e * B + c * g) / (B * B + g * g),
      m = (e * z + c * d) / (z * z + d * d);
    var n = B * o - e,
      p = g * o - c,
      h = z * m - e,
      y = d * m - c,
      w = Math.atan2(p, n),
      s = Math.atan2(y, h);
    if (C > 0) {
      if (s < w) {
        s += Math.PI * 2;
      }
    } else {
      if (w < s) {
        w += Math.PI * 2;
      }
    }
    if (i !== j) {
      e = b * e * j - a * c * i + A;
      c = a * c * i + b * c * i + f;
      E.lineTo(b * j * n - a * i * p + e, a * j * n + b * i * p + c);
      E.ellipse(e, c, j, i, v, w, s, C < 0);
    } else {
      e = e * j + A;
      c = c * i + f;
      E.lineTo(j * n + e, i * p + c);
      E.ellipse(e, c, j, i, v, w, s, C < 0);
    }
  },
  ellipse: function (h, f, c, a, q, n, d, e) {
    var o = this,
      g = o.params,
      b = g.length,
      m,
      l,
      k;
    if (d - n >= Math.PI * 2) {
      o.ellipse(h, f, c, a, q, n, n + Math.PI, e);
      o.ellipse(h, f, c, a, q, n + Math.PI, d, e);
      return;
    }
    if (!e) {
      if (d < n) {
        d += Math.PI * 2;
      }
      m = o.approximateArc(g, h, f, c, a, q, n, d);
    } else {
      if (n < d) {
        n += Math.PI * 2;
      }
      m = o.approximateArc(g, h, f, c, a, q, d, n);
      for (l = b, k = g.length - 2; l < k; l += 2, k -= 2) {
        var p = g[l];
        g[l] = g[k];
        g[k] = p;
        p = g[l + 1];
        g[l + 1] = g[k + 1];
        g[k + 1] = p;
      }
    }
    if (!o.cursor) {
      o.cursor = [g[g.length - 2], g[g.length - 1]];
      o.commands.push("M");
    } else {
      o.cursor[0] = g[g.length - 2];
      o.cursor[1] = g[g.length - 1];
      o.commands.push("L");
    }
    for (l = 2; l < m; l += 6) {
      o.commands.push("C");
    }
    o.dirt();
  },
  arc: function (b, f, a, d, c, e) {
    this.ellipse(b, f, a, a, 0, d, c, e);
  },
  rect: function (b, e, c, a) {
    if (c == 0 || a == 0) {
      return;
    }
    var d = this;
    d.moveTo(b, e);
    d.lineTo(b + c, e);
    d.lineTo(b + c, e + a);
    d.lineTo(b, e + a);
    d.closePath();
  },
  approximateArc: function (s, i, f, o, n, d, x, v) {
    var e = Math.cos(d),
      z = Math.sin(d),
      k = Math.cos(x),
      l = Math.sin(x),
      q = e * k * o - z * l * n,
      y = -e * l * o - z * k * n,
      p = z * k * o + e * l * n,
      w = -z * l * o + e * k * n,
      m = Math.PI / 2,
      r = 2,
      j = q,
      u = y,
      h = p,
      t = w,
      b = 0.547443256150549,
      C,
      g,
      A,
      a,
      B,
      c;
    v -= x;
    if (v < 0) {
      v += Math.PI * 2;
    }
    s.push(q + i, p + f);
    while (v >= m) {
      s.push(
        j + u * b + i,
        h + t * b + f,
        j * b + u + i,
        h * b + t + f,
        u + i,
        t + f
      );
      r += 6;
      v -= m;
      C = j;
      j = u;
      u = -C;
      C = h;
      h = t;
      t = -C;
    }
    if (v) {
      g = (0.3294738052815987 + 0.012120855841304373 * v) * v;
      A = Math.cos(v);
      a = Math.sin(v);
      B = A + g * a;
      c = a - g * A;
      s.push(
        j + u * g + i,
        h + t * g + f,
        j * B + u * c + i,
        h * B + t * c + f,
        j * A + u * a + i,
        h * A + t * a + f
      );
      r += 6;
    }
    return r;
  },
  arcSvg: function (j, h, r, m, w, t, c) {
    if (j < 0) {
      j = -j;
    }
    if (h < 0) {
      h = -h;
    }
    var x = this,
      u = x.cursor[0],
      f = x.cursor[1],
      a = (u - t) / 2,
      y = (f - c) / 2,
      d = Math.cos(r),
      s = Math.sin(r),
      o = a * d + y * s,
      v = -a * s + y * d,
      i = o / j,
      g = v / h,
      p = i * i + g * g,
      e = (u + t) * 0.5,
      b = (f + c) * 0.5,
      l = 0,
      k = 0;
    if (p >= 1) {
      p = Math.sqrt(p);
      j *= p;
      h *= p;
    } else {
      p = Math.sqrt(1 / p - 1);
      if (m === w) {
        p = -p;
      }
      l = p * j * g;
      k = -p * h * i;
      e += d * l - s * k;
      b += s * l + d * k;
    }
    var q = Math.atan2((v - k) / h, (o - l) / j),
      n = Math.atan2((-v - k) / h, (-o - l) / j) - q;
    if (w) {
      if (n <= 0) {
        n += Math.PI * 2;
      }
    } else {
      if (n >= 0) {
        n -= Math.PI * 2;
      }
    }
    x.ellipse(e, b, j, h, r, q, q + n, 1 - w);
  },
  fromSvgString: function (e) {
    if (!e) {
      return;
    }
    var m = this,
      h,
      l = {
        a: 7,
        c: 6,
        h: 1,
        l: 2,
        m: 2,
        q: 4,
        s: 4,
        t: 2,
        v: 1,
        z: 0,
        A: 7,
        C: 6,
        H: 1,
        L: 2,
        M: 2,
        Q: 4,
        S: 4,
        T: 2,
        V: 1,
        Z: 0
      },
      k = "",
      g,
      f,
      c = 0,
      b = 0,
      d = false,
      j,
      n,
      a;
    if (Ext.isString(e)) {
      h = e
        .replace(Ext.draw.Path.pathRe, " $1 ")
        .replace(Ext.draw.Path.pathRe2, " -")
        .split(Ext.draw.Path.pathSplitRe);
    } else {
      if (Ext.isArray(e)) {
        h = e.join(",").split(Ext.draw.Path.pathSplitRe);
      }
    }
    for (j = 0, n = 0; j < h.length; j++) {
      if (h[j] !== "") {
        h[n++] = h[j];
      }
    }
    h.length = n;
    m.clear();
    for (j = 0; j < h.length; ) {
      k = d;
      d = h[j];
      a = d.toUpperCase() !== d;
      j++;
      switch (d) {
        case "M":
          m.moveTo((c = +h[j]), (b = +h[j + 1]));
          j += 2;
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.lineTo((c = +h[j]), (b = +h[j + 1]));
            j += 2;
          }
          break;
        case "L":
          m.lineTo((c = +h[j]), (b = +h[j + 1]));
          j += 2;
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.lineTo((c = +h[j]), (b = +h[j + 1]));
            j += 2;
          }
          break;
        case "A":
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.arcSvg(
              +h[j],
              +h[j + 1],
              (+h[j + 2] * Math.PI) / 180,
              +h[j + 3],
              +h[j + 4],
              (c = +h[j + 5]),
              (b = +h[j + 6])
            );
            j += 7;
          }
          break;
        case "C":
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.bezierCurveTo(
              +h[j],
              +h[j + 1],
              (g = +h[j + 2]),
              (f = +h[j + 3]),
              (c = +h[j + 4]),
              (b = +h[j + 5])
            );
            j += 6;
          }
          break;
        case "Z":
          m.closePath();
          break;
        case "m":
          m.moveTo((c += +h[j]), (b += +h[j + 1]));
          j += 2;
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.lineTo((c += +h[j]), (b += +h[j + 1]));
            j += 2;
          }
          break;
        case "l":
          m.lineTo((c += +h[j]), (b += +h[j + 1]));
          j += 2;
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.lineTo((c += +h[j]), (b += +h[j + 1]));
            j += 2;
          }
          break;
        case "a":
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.arcSvg(
              +h[j],
              +h[j + 1],
              (+h[j + 2] * Math.PI) / 180,
              +h[j + 3],
              +h[j + 4],
              (c += +h[j + 5]),
              (b += +h[j + 6])
            );
            j += 7;
          }
          break;
        case "c":
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.bezierCurveTo(
              c + +h[j],
              b + +h[j + 1],
              (g = c + +h[j + 2]),
              (f = b + +h[j + 3]),
              (c += +h[j + 4]),
              (b += +h[j + 5])
            );
            j += 6;
          }
          break;
        case "z":
          m.closePath();
          break;
        case "s":
          if (!(k === "c" || k === "C" || k === "s" || k === "S")) {
            g = c;
            f = b;
          }
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.bezierCurveTo(
              c + c - g,
              b + b - f,
              (g = c + +h[j]),
              (f = b + +h[j + 1]),
              (c += +h[j + 2]),
              (b += +h[j + 3])
            );
            j += 4;
          }
          break;
        case "S":
          if (!(k === "c" || k === "C" || k === "s" || k === "S")) {
            g = c;
            f = b;
          }
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.bezierCurveTo(
              c + c - g,
              b + b - f,
              (g = +h[j]),
              (f = +h[j + 1]),
              (c = +h[j + 2]),
              (b = +h[j + 3])
            );
            j += 4;
          }
          break;
        case "q":
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.quadraticCurveTo(
              (g = c + +h[j]),
              (f = b + +h[j + 1]),
              (c += +h[j + 2]),
              (b += +h[j + 3])
            );
            j += 4;
          }
          break;
        case "Q":
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.quadraticCurveTo(
              (g = +h[j]),
              (f = +h[j + 1]),
              (c = +h[j + 2]),
              (b = +h[j + 3])
            );
            j += 4;
          }
          break;
        case "t":
          if (!(k === "q" || k === "Q" || k === "t" || k === "T")) {
            g = c;
            f = b;
          }
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.quadraticCurveTo(
              (g = c + c - g),
              (f = b + b - f),
              (c += +h[j + 1]),
              (b += +h[j + 2])
            );
            j += 2;
          }
          break;
        case "T":
          if (!(k === "q" || k === "Q" || k === "t" || k === "T")) {
            g = c;
            f = b;
          }
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.quadraticCurveTo(
              (g = c + c - g),
              (f = b + b - f),
              (c = +h[j + 1]),
              (b = +h[j + 2])
            );
            j += 2;
          }
          break;
        case "h":
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.lineTo((c += +h[j]), b);
            j++;
          }
          break;
        case "H":
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.lineTo((c = +h[j]), b);
            j++;
          }
          break;
        case "v":
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.lineTo(c, (b += +h[j]));
            j++;
          }
          break;
        case "V":
          while (j < n && !l.hasOwnProperty(h[j])) {
            m.lineTo(c, (b = +h[j]));
            j++;
          }
          break;
      }
    }
  },
  clone: function () {
    var a = this,
      b = new Ext.draw.Path();
    b.params = a.params.slice(0);
    b.commands = a.commands.slice(0);
    b.cursor = a.cursor ? a.cursor.slice(0) : null;
    b.startX = a.startX;
    b.startY = a.startY;
    b.svgString = a.svgString;
    return b;
  },
  transform: function (j) {
    if (j.isIdentity()) {
      return;
    }
    var a = j.getXX(),
      f = j.getYX(),
      m = j.getDX(),
      l = j.getXY(),
      e = j.getYY(),
      k = j.getDY(),
      b = this.params,
      c = 0,
      d = b.length,
      h,
      g;
    for (; c < d; c += 2) {
      h = b[c];
      g = b[c + 1];
      b[c] = h * a + g * f + m;
      b[c + 1] = h * l + g * e + k;
    }
    this.dirt();
  },
  getDimension: function (f) {
    if (!f) {
      f = {};
    }
    if (!this.commands || !this.commands.length) {
      f.x = 0;
      f.y = 0;
      f.width = 0;
      f.height = 0;
      return f;
    }
    f.left = Infinity;
    f.top = Infinity;
    f.right = -Infinity;
    f.bottom = -Infinity;
    var d = 0,
      c = 0,
      b = this.commands,
      g = this.params,
      e = b.length,
      a,
      h;
    for (; d < e; d++) {
      switch (b[d]) {
        case "M":
        case "L":
          a = g[c];
          h = g[c + 1];
          f.left = Math.min(a, f.left);
          f.top = Math.min(h, f.top);
          f.right = Math.max(a, f.right);
          f.bottom = Math.max(h, f.bottom);
          c += 2;
          break;
        case "C":
          this.expandDimension(
            f,
            a,
            h,
            g[c],
            g[c + 1],
            g[c + 2],
            g[c + 3],
            (a = g[c + 4]),
            (h = g[c + 5])
          );
          c += 6;
          break;
      }
    }
    f.x = f.left;
    f.y = f.top;
    f.width = f.right - f.left;
    f.height = f.bottom - f.top;
    return f;
  },
  getDimensionWithTransform: function (n, f) {
    if (!this.commands || !this.commands.length) {
      if (!f) {
        f = {};
      }
      f.x = 0;
      f.y = 0;
      f.width = 0;
      f.height = 0;
      return f;
    }
    f.left = Infinity;
    f.top = Infinity;
    f.right = -Infinity;
    f.bottom = -Infinity;
    var a = n.getXX(),
      k = n.getYX(),
      q = n.getDX(),
      p = n.getXY(),
      h = n.getYY(),
      o = n.getDY(),
      e = 0,
      d = 0,
      b = this.commands,
      c = this.params,
      g = b.length,
      m,
      l;
    for (; e < g; e++) {
      switch (b[e]) {
        case "M":
        case "L":
          m = c[d] * a + c[d + 1] * k + q;
          l = c[d] * p + c[d + 1] * h + o;
          f.left = Math.min(m, f.left);
          f.top = Math.min(l, f.top);
          f.right = Math.max(m, f.right);
          f.bottom = Math.max(l, f.bottom);
          d += 2;
          break;
        case "C":
          this.expandDimension(
            f,
            m,
            l,
            c[d] * a + c[d + 1] * k + q,
            c[d] * p + c[d + 1] * h + o,
            c[d + 2] * a + c[d + 3] * k + q,
            c[d + 2] * p + c[d + 3] * h + o,
            (m = c[d + 4] * a + c[d + 5] * k + q),
            (l = c[d + 4] * p + c[d + 5] * h + o)
          );
          d += 6;
          break;
      }
    }
    if (!f) {
      f = {};
    }
    f.x = f.left;
    f.y = f.top;
    f.width = f.right - f.left;
    f.height = f.bottom - f.top;
    return f;
  },
  expandDimension: function (i, d, p, k, g, j, e, c, o) {
    var m = this,
      f = i.left,
      a = i.right,
      q = i.top,
      n = i.bottom,
      h = m.dim || (m.dim = []);
    m.curveDimension(d, k, j, c, h);
    f = Math.min(f, h[0]);
    a = Math.max(a, h[1]);
    m.curveDimension(p, g, e, o, h);
    q = Math.min(q, h[0]);
    n = Math.max(n, h[1]);
    i.left = f;
    i.right = a;
    i.top = q;
    i.bottom = n;
  },
  curveDimension: function (p, n, k, j, h) {
    var i = 3 * (-p + 3 * (n - k) + j),
      g = 6 * (p - 2 * n + k),
      f = -3 * (p - n),
      o,
      m,
      e = Math.min(p, j),
      l = Math.max(p, j),
      q;
    if (i === 0) {
      if (g === 0) {
        h[0] = e;
        h[1] = l;
        return;
      } else {
        o = -f / g;
        if (0 < o && o < 1) {
          m = this.interpolate(p, n, k, j, o);
          e = Math.min(e, m);
          l = Math.max(l, m);
        }
      }
    } else {
      q = g * g - 4 * i * f;
      if (q >= 0) {
        q = Math.sqrt(q);
        o = (q - g) / 2 / i;
        if (0 < o && o < 1) {
          m = this.interpolate(p, n, k, j, o);
          e = Math.min(e, m);
          l = Math.max(l, m);
        }
        if (q > 0) {
          o -= q / i;
          if (0 < o && o < 1) {
            m = this.interpolate(p, n, k, j, o);
            e = Math.min(e, m);
            l = Math.max(l, m);
          }
        }
      }
    }
    h[0] = e;
    h[1] = l;
  },
  interpolate: function (f, e, j, i, g) {
    if (g === 0) {
      return f;
    }
    if (g === 1) {
      return i;
    }
    var h = (1 - g) / g;
    return g * g * g * (i + h * (3 * j + h * (3 * e + h * f)));
  },
  fromStripes: function (g) {
    var e = this,
      c = 0,
      d = g.length,
      b,
      a,
      f;
    e.clear();
    for (; c < d; c++) {
      f = g[c];
      e.params.push.apply(e.params, f);
      e.commands.push("M");
      for (b = 2, a = f.length; b < a; b += 6) {
        e.commands.push("C");
      }
    }
    if (!e.cursor) {
      e.cursor = [];
    }
    e.cursor[0] = e.params[e.params.length - 2];
    e.cursor[1] = e.params[e.params.length - 1];
    e.dirt();
  },
  toStripes: function (k) {
    var o = k || [],
      p,
      n,
      m,
      b,
      a,
      h,
      g,
      f,
      e,
      c = this.commands,
      d = this.params,
      l = c.length;
    for (f = 0, e = 0; f < l; f++) {
      switch (c[f]) {
        case "M":
          p = [(h = b = d[e++]), (g = a = d[e++])];
          o.push(p);
          break;
        case "L":
          n = d[e++];
          m = d[e++];
          p.push(
            (b + b + n) / 3,
            (a + a + m) / 3,
            (b + n + n) / 3,
            (a + m + m) / 3,
            (b = n),
            (a = m)
          );
          break;
        case "C":
          p.push(d[e++], d[e++], d[e++], d[e++], (b = d[e++]), (a = d[e++]));
          break;
        case "Z":
          n = h;
          m = g;
          p.push(
            (b + b + n) / 3,
            (a + a + m) / 3,
            (b + n + n) / 3,
            (a + m + m) / 3,
            (b = n),
            (a = m)
          );
          break;
      }
    }
    return o;
  },
  updateSvgString: function () {
    var b = [],
      a = this.commands,
      f = this.params,
      e = a.length,
      d = 0,
      c = 0;
    for (; d < e; d++) {
      switch (a[d]) {
        case "M":
          b.push("M" + f[c] + "," + f[c + 1]);
          c += 2;
          break;
        case "L":
          b.push("L" + f[c] + "," + f[c + 1]);
          c += 2;
          break;
        case "C":
          b.push(
            "C" +
              f[c] +
              "," +
              f[c + 1] +
              " " +
              f[c + 2] +
              "," +
              f[c + 3] +
              " " +
              f[c + 4] +
              "," +
              f[c + 5]
          );
          c += 6;
          break;
        case "Z":
          b.push("Z");
          break;
      }
    }
    this.svgString = b.join("");
  },
  toString: function () {
    if (!this.svgString) {
      this.updateSvgString();
    }
    return this.svgString;
  }
});
Ext.define("Ext.draw.overrides.hittest.Path", {
  override: "Ext.draw.Path",
  rayOrigin: { x: -10000, y: -10000 },
  isPointInPath: function (o, n) {
    var m = this,
      c = m.commands,
      q = Ext.draw.PathUtil,
      p = m.rayOrigin,
      f = m.params,
      l = c.length,
      e = null,
      d = null,
      b = 0,
      a = 0,
      k = 0,
      h,
      g;
    for (h = 0, g = 0; h < l; h++) {
      switch (c[h]) {
        case "M":
          if (e !== null) {
            if (q.linesIntersection(e, d, b, a, p.x, p.y, o, n)) {
              k += 1;
            }
          }
          e = b = f[g];
          d = a = f[g + 1];
          g += 2;
          break;
        case "L":
          if (q.linesIntersection(b, a, f[g], f[g + 1], p.x, p.y, o, n)) {
            k += 1;
          }
          b = f[g];
          a = f[g + 1];
          g += 2;
          break;
        case "C":
          k += q.cubicLineIntersections(
            b,
            f[g],
            f[g + 2],
            f[g + 4],
            a,
            f[g + 1],
            f[g + 3],
            f[g + 5],
            p.x,
            p.y,
            o,
            n
          ).length;
          b = f[g + 4];
          a = f[g + 5];
          g += 6;
          break;
        case "Z":
          if (e !== null) {
            if (q.linesIntersection(e, d, b, a, p.x, p.y, o, n)) {
              k += 1;
            }
          }
          break;
      }
    }
    return k % 2 === 1;
  },
  isPointOnPath: function (n, m) {
    var l = this,
      c = l.commands,
      o = Ext.draw.PathUtil,
      f = l.params,
      k = c.length,
      e = null,
      d = null,
      b = 0,
      a = 0,
      h,
      g;
    for (h = 0, g = 0; h < k; h++) {
      switch (c[h]) {
        case "M":
          if (e !== null) {
            if (o.pointOnLine(e, d, b, a, n, m)) {
              return true;
            }
          }
          e = b = f[g];
          d = a = f[g + 1];
          g += 2;
          break;
        case "L":
          if (o.pointOnLine(b, a, f[g], f[g + 1], n, m)) {
            return true;
          }
          b = f[g];
          a = f[g + 1];
          g += 2;
          break;
        case "C":
          if (
            o.pointOnCubic(
              b,
              f[g],
              f[g + 2],
              f[g + 4],
              a,
              f[g + 1],
              f[g + 3],
              f[g + 5],
              n,
              m
            )
          ) {
            return true;
          }
          b = f[g + 4];
          a = f[g + 5];
          g += 6;
          break;
        case "Z":
          if (e !== null) {
            if (o.pointOnLine(e, d, b, a, n, m)) {
              return true;
            }
          }
          break;
      }
    }
    return false;
  },
  getSegmentIntersections: function (t, d, s, c, r, b, o, a) {
    var w = this,
      g = arguments.length,
      v = Ext.draw.PathUtil,
      f = w.commands,
      u = w.params,
      k = f.length,
      m = null,
      l = null,
      h = 0,
      e = 0,
      x = [],
      q,
      n,
      p;
    for (q = 0, n = 0; q < k; q++) {
      switch (f[q]) {
        case "M":
          if (m !== null) {
            switch (g) {
              case 4:
                p = v.linesIntersection(m, l, h, e, t, d, s, c);
                if (p) {
                  x.push(p);
                }
                break;
              case 8:
                p = v.cubicLineIntersections(
                  t,
                  s,
                  r,
                  o,
                  d,
                  c,
                  b,
                  a,
                  m,
                  l,
                  h,
                  e
                );
                x.push.apply(x, p);
                break;
            }
          }
          m = h = u[n];
          l = e = u[n + 1];
          n += 2;
          break;
        case "L":
          switch (g) {
            case 4:
              p = v.linesIntersection(h, e, u[n], u[n + 1], t, d, s, c);
              if (p) {
                x.push(p);
              }
              break;
            case 8:
              p = v.cubicLineIntersections(
                t,
                s,
                r,
                o,
                d,
                c,
                b,
                a,
                h,
                e,
                u[n],
                u[n + 1]
              );
              x.push.apply(x, p);
              break;
          }
          h = u[n];
          e = u[n + 1];
          n += 2;
          break;
        case "C":
          switch (g) {
            case 4:
              p = v.cubicLineIntersections(
                h,
                u[n],
                u[n + 2],
                u[n + 4],
                e,
                u[n + 1],
                u[n + 3],
                u[n + 5],
                t,
                d,
                s,
                c
              );
              x.push.apply(x, p);
              break;
            case 8:
              p = v.cubicsIntersections(
                h,
                u[n],
                u[n + 2],
                u[n + 4],
                e,
                u[n + 1],
                u[n + 3],
                u[n + 5],
                t,
                s,
                r,
                o,
                d,
                c,
                b,
                a
              );
              x.push.apply(x, p);
              break;
          }
          h = u[n + 4];
          e = u[n + 5];
          n += 6;
          break;
        case "Z":
          if (m !== null) {
            switch (g) {
              case 4:
                p = v.linesIntersection(m, l, h, e, t, d, s, c);
                if (p) {
                  x.push(p);
                }
                break;
              case 8:
                p = v.cubicLineIntersections(
                  t,
                  s,
                  r,
                  o,
                  d,
                  c,
                  b,
                  a,
                  m,
                  l,
                  h,
                  e
                );
                x.push.apply(x, p);
                break;
            }
          }
          break;
      }
    }
    return x;
  },
  getIntersections: function (o) {
    var m = this,
      c = m.commands,
      g = m.params,
      l = c.length,
      f = null,
      e = null,
      b = 0,
      a = 0,
      d = [],
      k,
      h,
      n;
    for (k = 0, h = 0; k < l; k++) {
      switch (c[k]) {
        case "M":
          if (f !== null) {
            n = o.getSegmentIntersections.call(o, f, e, b, a);
            d.push.apply(d, n);
          }
          f = b = g[h];
          e = a = g[h + 1];
          h += 2;
          break;
        case "L":
          n = o.getSegmentIntersections.call(o, b, a, g[h], g[h + 1]);
          d.push.apply(d, n);
          b = g[h];
          a = g[h + 1];
          h += 2;
          break;
        case "C":
          n = o.getSegmentIntersections.call(
            o,
            b,
            a,
            g[h],
            g[h + 1],
            g[h + 2],
            g[h + 3],
            g[h + 4],
            g[h + 5]
          );
          d.push.apply(d, n);
          b = g[h + 4];
          a = g[h + 5];
          h += 6;
          break;
        case "Z":
          if (f !== null) {
            n = o.getSegmentIntersections.call(o, f, e, b, a);
            d.push.apply(d, n);
          }
          break;
      }
    }
    return d;
  }
});
Ext.define("Ext.draw.sprite.Path", {
  extend: "Ext.draw.sprite.Sprite",
  requires: ["Ext.draw.Draw", "Ext.draw.Path"],
  alias: ["sprite.path", "Ext.draw.Sprite"],
  type: "path",
  isPath: true,
  inheritableStatics: {
    def: {
      processors: {
        path: function (b, a) {
          if (!(b instanceof Ext.draw.Path)) {
            b = new Ext.draw.Path(b);
          }
          return b;
        }
      },
      aliases: { d: "path" },
      triggers: { path: "bbox" },
      updaters: {
        path: function (a) {
          var b = a.path;
          if (!b || b.bindAttr !== a) {
            b = new Ext.draw.Path();
            b.bindAttr = a;
            a.path = b;
          }
          b.clear();
          this.updatePath(b, a);
          this.scheduleUpdater(a, "bbox", ["path"]);
        }
      }
    }
  },
  updatePlainBBox: function (a) {
    if (this.attr.path) {
      this.attr.path.getDimension(a);
    }
  },
  updateTransformedBBox: function (a) {
    if (this.attr.path) {
      this.attr.path.getDimensionWithTransform(this.attr.matrix, a);
    }
  },
  render: function (b, c) {
    var d = this.attr.matrix,
      a = this.attr;
    if (!a.path || a.path.params.length === 0) {
      return;
    }
    d.toContext(c);
    c.appendPath(a.path);
    c.fillStroke(a);
  },
  updatePath: function (b, a) {}
});
Ext.define("Ext.draw.overrides.hittest.sprite.Path", {
  override: "Ext.draw.sprite.Path",
  requires: ["Ext.draw.Color"],
  isPointInPath: function (c, g) {
    var b = this.attr;
    if (b.fillStyle === Ext.util.Color.RGBA_NONE) {
      return this.isPointOnPath(c, g);
    }
    var e = b.path,
      d = b.matrix,
      f,
      a;
    if (!d.isIdentity()) {
      f = e.params.slice(0);
      e.transform(b.matrix);
    }
    a = e.isPointInPath(c, g);
    if (f) {
      e.params = f;
    }
    return a;
  },
  isPointOnPath: function (c, g) {
    var b = this.attr,
      e = b.path,
      d = b.matrix,
      f,
      a;
    if (!d.isIdentity()) {
      f = e.params.slice(0);
      e.transform(b.matrix);
    }
    a = e.isPointOnPath(c, g);
    if (f) {
      e.params = f;
    }
    return a;
  },
  hitTest: function (i, l) {
    var e = this,
      c = e.attr,
      k = c.path,
      g = c.matrix,
      h = i[0],
      f = i[1],
      d = e.callParent([i, l]),
      j = null,
      a,
      b;
    if (!d) {
      return j;
    }
    l = l || Ext.draw.sprite.Sprite.defaultHitTestOptions;
    if (!g.isIdentity()) {
      a = k.params.slice(0);
      k.transform(c.matrix);
    }
    if (l.fill && l.stroke) {
      b =
        c.fillStyle !== Ext.util.Color.NONE &&
        c.fillStyle !== Ext.util.Color.RGBA_NONE;
      if (b) {
        if (k.isPointInPath(h, f)) {
          j = { sprite: e };
        }
      } else {
        if (k.isPointInPath(h, f) || k.isPointOnPath(h, f)) {
          j = { sprite: e };
        }
      }
    } else {
      if (l.stroke && !l.fill) {
        if (k.isPointOnPath(h, f)) {
          j = { sprite: e };
        }
      } else {
        if (l.fill && !l.stroke) {
          if (k.isPointInPath(h, f)) {
            j = { sprite: e };
          }
        }
      }
    }
    if (a) {
      k.params = a;
    }
    return j;
  },
  getIntersections: function (j) {
    if (!(j.isSprite && j.isPath)) {
      return [];
    }
    var e = this.attr,
      d = j.attr,
      i = e.path,
      h = d.path,
      g = e.matrix,
      a = d.matrix,
      c,
      f,
      b;
    if (!g.isIdentity()) {
      c = i.params.slice(0);
      i.transform(e.matrix);
    }
    if (!a.isIdentity()) {
      f = h.params.slice(0);
      h.transform(d.matrix);
    }
    b = i.getIntersections(h);
    if (c) {
      i.params = c;
    }
    if (f) {
      h.params = f;
    }
    return b;
  }
});
Ext.define("Ext.draw.sprite.Circle", {
  extend: "Ext.draw.sprite.Path",
  alias: "sprite.circle",
  type: "circle",
  inheritableStatics: {
    def: {
      processors: { cx: "number", cy: "number", r: "number" },
      aliases: { radius: "r", x: "cx", y: "cy", centerX: "cx", centerY: "cy" },
      defaults: { cx: 0, cy: 0, r: 4 },
      triggers: { cx: "path", cy: "path", r: "path" }
    }
  },
  updatePlainBBox: function (c) {
    var b = this.attr,
      a = b.cx,
      e = b.cy,
      d = b.r;
    c.x = a - d;
    c.y = e - d;
    c.width = d + d;
    c.height = d + d;
  },
  updateTransformedBBox: function (d) {
    var g = this.attr,
      f = g.cx,
      e = g.cy,
      a = g.r,
      h = g.matrix,
      j = h.getScaleX(),
      i = h.getScaleY(),
      c,
      b;
    c = j * a;
    b = i * a;
    d.x = h.x(f, e) - c;
    d.y = h.y(f, e) - b;
    d.width = c + c;
    d.height = b + b;
  },
  updatePath: function (b, a) {
    b.arc(a.cx, a.cy, a.r, 0, Math.PI * 2, false);
  }
});
Ext.define("Ext.draw.sprite.Arc", {
  extend: "Ext.draw.sprite.Circle",
  alias: "sprite.arc",
  type: "arc",
  inheritableStatics: {
    def: {
      processors: {
        startAngle: "number",
        endAngle: "number",
        anticlockwise: "bool"
      },
      aliases: {
        from: "startAngle",
        to: "endAngle",
        start: "startAngle",
        end: "endAngle"
      },
      defaults: { startAngle: 0, endAngle: Math.PI * 2, anticlockwise: false },
      triggers: { startAngle: "path", endAngle: "path", anticlockwise: "path" }
    }
  },
  updatePath: function (b, a) {
    b.arc(a.cx, a.cy, a.r, a.startAngle, a.endAngle, a.anticlockwise);
  }
});
Ext.define("Ext.draw.sprite.Arrow", {
  extend: "Ext.draw.sprite.Path",
  alias: "sprite.arrow",
  inheritableStatics: {
    def: {
      processors: { x: "number", y: "number", size: "number" },
      defaults: { x: 0, y: 0, size: 4 },
      triggers: { x: "path", y: "path", size: "path" }
    }
  },
  updatePath: function (d, b) {
    var c = b.size * 1.5,
      a = b.x - b.lineWidth / 2,
      e = b.y;
    d.fromSvgString(
      "M".concat(
        a - c * 0.7,
        ",",
        e - c * 0.4,
        "l",
        [
          c * 0.6,
          0,
          0,
          -c * 0.4,
          c,
          c * 0.8,
          -c,
          c * 0.8,
          0,
          -c * 0.4,
          -c * 0.6,
          0
        ],
        "z"
      )
    );
  }
});
Ext.define("Ext.draw.sprite.Composite", {
  extend: "Ext.draw.sprite.Sprite",
  alias: "sprite.composite",
  type: "composite",
  isComposite: true,
  config: { sprites: [] },
  constructor: function (a) {
    this.sprites = [];
    this.map = {};
    this.callParent([a]);
  },
  add: function (c) {
    if (!c) {
      return null;
    }
    if (!c.isSprite) {
      c = Ext.create("sprite." + c.type, c);
    }
    c.setParent(this);
    c.setSurface(this.getSurface());
    var d = this,
      a = d.attr,
      b = c.applyTransformations;
    c.applyTransformations = function (e) {
      if (c.attr.dirtyTransform) {
        a.dirtyTransform = true;
        a.bbox.plain.dirty = true;
        a.bbox.transform.dirty = true;
      }
      b.call(c, e);
    };
    d.sprites.push(c);
    d.map[c.id] = c.getId();
    a.bbox.plain.dirty = true;
    a.bbox.transform.dirty = true;
    return c;
  },
  removeSprite: function (a, c) {
    var b = this,
      e,
      d;
    if (a) {
      if (a.charAt) {
        a = b.map[a];
      }
      if (!a || !a.isSprite) {
        return null;
      }
      if (a.isDestroyed || a.isDestroying) {
        return a;
      }
      e = a.getId();
      d = b.map[e];
      delete b.map[e];
      if (c) {
        a.destroy();
      }
      if (!d) {
        return a;
      }
      a.setParent(null);
      a.setSurface(null);
      Ext.Array.remove(b.sprites, a);
      b.dirtyZIndex = true;
      b.setDirty(true);
    }
    return a || null;
  },
  updateSurface: function (a) {
    for (var b = 0, c = this.sprites.length; b < c; b++) {
      this.sprites[b].setSurface(a);
    }
  },
  addAll: function (b) {
    if (b.isSprite || b.type) {
      this.add(b);
    } else {
      if (Ext.isArray(b)) {
        var a = 0;
        while (a < b.length) {
          this.add(b[a++]);
        }
      }
    }
  },
  updatePlainBBox: function (g) {
    var e = this,
      b = Infinity,
      h = -Infinity,
      f = Infinity,
      a = -Infinity,
      j,
      k,
      c,
      d;
    for (c = 0, d = e.sprites.length; c < d; c++) {
      j = e.sprites[c];
      j.applyTransformations();
      k = j.getBBox();
      if (b > k.x) {
        b = k.x;
      }
      if (h < k.x + k.width) {
        h = k.x + k.width;
      }
      if (f > k.y) {
        f = k.y;
      }
      if (a < k.y + k.height) {
        a = k.y + k.height;
      }
    }
    g.x = b;
    g.y = f;
    g.width = h - b;
    g.height = a - f;
  },
  isVisible: function () {
    var b = this.attr,
      d = this.getParent(),
      a = d && (d.isSurface || d.isVisible()),
      c = a && !b.hidden && b.globalAlpha;
    return !!c;
  },
  render: function (a, j, g) {
    var f = this,
      c = f.attr,
      h = f.attr.matrix,
      d = f.sprites,
      e = d.length,
      b = 0;
    h.toContext(j);
    for (; b < e; b++) {
      a.renderSprite(d[b], g);
    }
  },
  destroy: function () {
    var c = this,
      d = c.sprites,
      b = d.length,
      a;
    for (a = 0; a < b; a++) {
      d[a].destroy();
    }
    d.length = 0;
    c.callParent();
  }
});
Ext.define("Ext.draw.sprite.Cross", {
  extend: "Ext.draw.sprite.Path",
  alias: "sprite.cross",
  inheritableStatics: {
    def: {
      processors: { x: "number", y: "number", size: "number" },
      defaults: { x: 0, y: 0, size: 4 },
      triggers: { x: "path", y: "path", size: "path" }
    }
  },
  updatePath: function (d, b) {
    var c = b.size / 1.7,
      a = b.x - b.lineWidth / 2,
      e = b.y;
    d.fromSvgString(
      "M".concat(a - c, ",", e, "l", [
        -c,
        -c,
        c,
        -c,
        c,
        c,
        c,
        -c,
        c,
        c,
        -c,
        c,
        c,
        c,
        -c,
        c,
        -c,
        -c,
        -c,
        c,
        -c,
        -c,
        "z"
      ])
    );
  }
});
Ext.define("Ext.draw.sprite.Diamond", {
  extend: "Ext.draw.sprite.Path",
  alias: "sprite.diamond",
  inheritableStatics: {
    def: {
      processors: { x: "number", y: "number", size: "number" },
      defaults: { x: 0, y: 0, size: 4 },
      triggers: { x: "path", y: "path", size: "path" }
    }
  },
  updatePath: function (d, b) {
    var c = b.size * 1.25,
      a = b.x - b.lineWidth / 2,
      e = b.y;
    d.fromSvgString(["M", a, e - c, "l", c, c, -c, c, -c, -c, c, -c, "z"]);
  }
});
Ext.define("Ext.draw.sprite.Ellipse", {
  extend: "Ext.draw.sprite.Path",
  alias: "sprite.ellipse",
  type: "ellipse",
  inheritableStatics: {
    def: {
      processors: {
        cx: "number",
        cy: "number",
        rx: "number",
        ry: "number",
        axisRotation: "number"
      },
      aliases: {
        radius: "r",
        x: "cx",
        y: "cy",
        centerX: "cx",
        centerY: "cy",
        radiusX: "rx",
        radiusY: "ry"
      },
      defaults: { cx: 0, cy: 0, rx: 1, ry: 1, axisRotation: 0 },
      triggers: {
        cx: "path",
        cy: "path",
        rx: "path",
        ry: "path",
        axisRotation: "path"
      }
    }
  },
  updatePlainBBox: function (c) {
    var b = this.attr,
      a = b.cx,
      f = b.cy,
      e = b.rx,
      d = b.ry;
    c.x = a - e;
    c.y = f - d;
    c.width = e + e;
    c.height = d + d;
  },
  updateTransformedBBox: function (d) {
    var i = this.attr,
      f = i.cx,
      e = i.cy,
      c = i.rx,
      b = i.ry,
      l = b / c,
      m = i.matrix.clone(),
      a,
      q,
      k,
      j,
      p,
      o,
      n,
      g;
    m.append(1, 0, 0, l, 0, e * (1 - l));
    a = m.getXX();
    k = m.getYX();
    p = m.getDX();
    q = m.getXY();
    j = m.getYY();
    o = m.getDY();
    n = Math.sqrt(a * a + k * k) * c;
    g = Math.sqrt(q * q + j * j) * c;
    d.x = f * a + e * k + p - n;
    d.y = f * q + e * j + o - g;
    d.width = n + n;
    d.height = g + g;
  },
  updatePath: function (b, a) {
    b.ellipse(a.cx, a.cy, a.rx, a.ry, a.axisRotation, 0, Math.PI * 2, false);
  }
});
Ext.define("Ext.draw.sprite.EllipticalArc", {
  extend: "Ext.draw.sprite.Ellipse",
  alias: "sprite.ellipticalArc",
  type: "ellipticalArc",
  inheritableStatics: {
    def: {
      processors: {
        startAngle: "number",
        endAngle: "number",
        anticlockwise: "bool"
      },
      aliases: {
        from: "startAngle",
        to: "endAngle",
        start: "startAngle",
        end: "endAngle"
      },
      defaults: { startAngle: 0, endAngle: Math.PI * 2, anticlockwise: false },
      triggers: { startAngle: "path", endAngle: "path", anticlockwise: "path" }
    }
  },
  updatePath: function (b, a) {
    b.ellipse(
      a.cx,
      a.cy,
      a.rx,
      a.ry,
      a.axisRotation,
      a.startAngle,
      a.endAngle,
      a.anticlockwise
    );
  }
});
Ext.define("Ext.draw.sprite.Rect", {
  extend: "Ext.draw.sprite.Path",
  alias: "sprite.rect",
  type: "rect",
  inheritableStatics: {
    def: {
      processors: {
        x: "number",
        y: "number",
        width: "number",
        height: "number",
        radius: "number"
      },
      aliases: {},
      triggers: {
        x: "path",
        y: "path",
        width: "path",
        height: "path",
        radius: "path"
      },
      defaults: { x: 0, y: 0, width: 8, height: 8, radius: 0 }
    }
  },
  updatePlainBBox: function (b) {
    var a = this.attr;
    b.x = a.x;
    b.y = a.y;
    b.width = a.width;
    b.height = a.height;
  },
  updateTransformedBBox: function (a, b) {
    this.attr.matrix.transformBBox(b, this.attr.radius, a);
  },
  updatePath: function (f, d) {
    var c = d.x,
      g = d.y,
      e = d.width,
      b = d.height,
      a = Math.min(d.radius, Math.abs(b) * 0.5, Math.abs(e) * 0.5);
    if (a === 0) {
      f.rect(c, g, e, b);
    } else {
      f.moveTo(c + a, g);
      f.arcTo(c + e, g, c + e, g + b, a);
      f.arcTo(c + e, g + b, c, g + b, a);
      f.arcTo(c, g + b, c, g, a);
      f.arcTo(c, g, c + a, g, a);
    }
  }
});
Ext.define("Ext.draw.sprite.Image", {
  extend: "Ext.draw.sprite.Rect",
  alias: "sprite.image",
  type: "image",
  statics: { imageLoaders: {} },
  inheritableStatics: {
    def: {
      processors: { src: "string" },
      triggers: { src: "src" },
      updaters: { src: "updateSource" },
      defaults: { src: "", width: null, height: null }
    }
  },
  updateSurface: function (a) {
    if (a) {
      this.updateSource(this.attr);
    }
  },
  updateSource: function (g) {
    var h = this,
      a = g.src,
      c = h.getSurface(),
      f = Ext.draw.sprite.Image.imageLoaders[a],
      b = g.width,
      j = g.height,
      e,
      d;
    if (!c) {
      return;
    }
    if (!f) {
      e = new Image();
      f = Ext.draw.sprite.Image.imageLoaders[a] = {
        image: e,
        done: false,
        pendingSprites: [h],
        pendingSurfaces: [c]
      };
      e.width = b;
      e.height = j;
      e.onload = function () {
        var i;
        if (!f.done) {
          f.done = true;
          for (d = 0; d < f.pendingSprites.length; d++) {
            i = f.pendingSprites[d];
            if (!i.destroyed) {
              i.setDirty(true);
            }
          }
          for (d = 0; d < f.pendingSurfaces.length; d++) {
            i = f.pendingSurfaces[d];
            if (!i.destroyed) {
              i.renderFrame();
            }
          }
        }
      };
      e.src = a;
    } else {
      Ext.Array.include(f.pendingSprites, h);
      Ext.Array.include(f.pendingSurfaces, c);
    }
  },
  render: function (c, l) {
    var g = this,
      f = g.attr,
      k = f.matrix,
      a = f.src,
      i = f.x,
      h = f.y,
      b = f.width,
      j = f.height,
      e = Ext.draw.sprite.Image.imageLoaders[a],
      d;
    if (e && e.done) {
      k.toContext(l);
      d = e.image;
      l.drawImage(
        d,
        i,
        h,
        b || (d.naturalWidth || d.width) / c.devicePixelRatio,
        j || (d.naturalHeight || d.height) / c.devicePixelRatio
      );
    }
  },
  isVisible: function () {
    var b = this.attr,
      d = this.getParent(),
      a = d && (d.isSurface || d.isVisible()),
      c = a && !b.hidden && b.globalAlpha;
    return !!c;
  }
});
Ext.define("Ext.draw.sprite.Instancing", {
  extend: "Ext.draw.sprite.Sprite",
  alias: "sprite.instancing",
  type: "instancing",
  isInstancing: true,
  config: { template: null, instances: null },
  instances: null,
  applyTemplate: function (b) {
    if (!b.isSprite) {
      if (!b.xclass && !b.type) {
        b.type = "circle";
      }
      b = Ext.create(b.xclass || "sprite." + b.type, b);
    }
    var a = b.getSurface();
    if (a) {
      a.remove(b);
    }
    b.setParent(this);
    return b;
  },
  updateTemplate: function (a, b) {
    if (b) {
      delete b.ownAttr;
    }
    a.setSurface(this.getSurface());
    a.ownAttr = a.attr;
    this.clearAll();
  },
  updateInstances: function (c) {
    this.clearAll();
    if (Ext.isArray(c)) {
      for (var a = 0, b = c.length; a < b; a++) {
        this.add(c[a]);
      }
    }
  },
  updateSurface: function (a) {
    var b = this.getTemplate();
    if (b && !b.destroyed) {
      b.setSurface(a);
    }
  },
  get: function (a) {
    return this.instances[a];
  },
  getCount: function () {
    return this.instances.length;
  },
  clearAll: function () {
    var a = this.getTemplate();
    a.attr.children = this.instances = [];
    this.position = 0;
  },
  createInstance: function (b, c, a) {
    return this.add(b, c, a);
  },
  add: function (d, f, c) {
    var e = this.getTemplate(),
      b = e.attr,
      a = Ext.Object.chain(b);
    e.topModifier.prepareAttributes(a);
    e.attr = a;
    e.setAttributes(d, f, c);
    a.template = e;
    this.instances.push(a);
    e.attr = b;
    this.position++;
    return a;
  },
  getBBox: function () {
    return null;
  },
  getBBoxFor: function (b, d) {
    var c = this.getTemplate(),
      a = c.attr,
      e;
    c.attr = this.instances[b];
    e = c.getBBox(d);
    c.attr = a;
    return e;
  },
  isVisible: function () {
    var b = this.attr,
      c = this.getParent(),
      a;
    a = c && c.isSurface && !b.hidden && b.globalAlpha;
    return !!a;
  },
  isInstanceVisible: function (c) {
    var e = this,
      d = e.getTemplate(),
      b = d.attr,
      f = e.instances,
      a = false;
    if (!Ext.isNumber(c) || c < 0 || c >= f.length || !e.isVisible()) {
      return a;
    }
    d.attr = f[c];
    a = d.isVisible(point, options);
    d.attr = b;
    return a;
  },
  render: function (b, l, h) {
    var g = this,
      j = g.getTemplate(),
      d = b.getRect(),
      k = g.attr.matrix,
      c = j.attr,
      a = g.instances,
      f = g.position,
      e;
    k.toContext(l);
    j.preRender(b, l, h);
    j.useAttributes(l, d);
    for (e = 0; e < f; e++) {
      if (a[e].hidden) {
        continue;
      }
      l.save();
      j.attr = a[e];
      j.useAttributes(l, d);
      j.render(b, l, h);
      l.restore();
    }
    j.attr = c;
  },
  setAttributesFor: function (c, e, f) {
    var d = this.getTemplate(),
      b = d.attr,
      a = this.instances[c];
    if (!a) {
      return;
    }
    d.attr = a;
    if (f) {
      e = Ext.apply({}, e);
    } else {
      e = d.self.def.normalize(e);
    }
    d.topModifier.pushDown(a, e);
    d.attr = b;
  },
  destroy: function () {
    var b = this,
      a = b.getTemplate();
    b.instances = null;
    if (a) {
      a.destroy();
    }
    b.callParent();
  }
});
Ext.define("Ext.draw.overrides.hittest.sprite.Instancing", {
  override: "Ext.draw.sprite.Instancing",
  hitTest: function (f, j) {
    var e = this,
      g = e.getTemplate(),
      b = g.attr,
      a = e.instances,
      d = a.length,
      c = 0,
      h = null;
    if (!e.isVisible()) {
      return h;
    }
    for (; c < d; c++) {
      g.attr = a[c];
      h = g.hitTest(f, j);
      if (h) {
        h.isInstance = true;
        h.template = h.sprite;
        h.sprite = this;
        h.instance = a[c];
        h.index = c;
        return h;
      }
    }
    g.attr = b;
    return h;
  }
});
Ext.define("Ext.draw.sprite.Line", {
  extend: "Ext.draw.sprite.Sprite",
  alias: "sprite.line",
  type: "line",
  inheritableStatics: {
    def: {
      processors: {
        fromX: "number",
        fromY: "number",
        toX: "number",
        toY: "number"
      },
      defaults: { fromX: 0, fromY: 0, toX: 1, toY: 1, strokeStyle: "black" },
      aliases: { x1: "fromX", y1: "fromY", x2: "toX", y2: "toY" }
    }
  },
  updateLineBBox: function (b, i, s, g, r, f) {
    var o = this.attr,
      q = o.matrix,
      h = o.lineWidth / 2,
      m,
      l,
      d,
      c,
      k,
      j,
      n;
    if (i) {
      n = q.transformPoint([s, g]);
      s = n[0];
      g = n[1];
      n = q.transformPoint([r, f]);
      r = n[0];
      f = n[1];
    }
    m = Math.min(s, r);
    d = Math.max(s, r);
    l = Math.min(g, f);
    c = Math.max(g, f);
    var t = Math.atan2(d - m, c - l),
      a = Math.sin(t),
      e = Math.cos(t),
      k = h * e,
      j = h * a;
    m -= k;
    l -= j;
    d += k;
    c += j;
    b.x = m;
    b.y = l;
    b.width = d - m;
    b.height = c - l;
  },
  updatePlainBBox: function (b) {
    var a = this.attr;
    this.updateLineBBox(b, false, a.fromX, a.fromY, a.toX, a.toY);
  },
  updateTransformedBBox: function (b, c) {
    var a = this.attr;
    this.updateLineBBox(b, true, a.fromX, a.fromY, a.toX, a.toY);
  },
  render: function (b, c) {
    var a = this.attr,
      d = this.attr.matrix;
    d.toContext(c);
    c.beginPath();
    c.moveTo(a.fromX, a.fromY);
    c.lineTo(a.toX, a.toY);
    c.stroke();
  }
});
Ext.define("Ext.draw.sprite.Plus", {
  extend: "Ext.draw.sprite.Path",
  alias: "sprite.plus",
  inheritableStatics: {
    def: {
      processors: { x: "number", y: "number", size: "number" },
      defaults: { x: 0, y: 0, size: 4 },
      triggers: { x: "path", y: "path", size: "path" }
    }
  },
  updatePath: function (d, b) {
    var c = b.size / 1.3,
      a = b.x - b.lineWidth / 2,
      e = b.y;
    d.fromSvgString(
      "M".concat(a - c / 2, ",", e - c / 2, "l", [
        0,
        -c,
        c,
        0,
        0,
        c,
        c,
        0,
        0,
        c,
        -c,
        0,
        0,
        c,
        -c,
        0,
        0,
        -c,
        -c,
        0,
        0,
        -c,
        "z"
      ])
    );
  }
});
Ext.define("Ext.draw.sprite.Sector", {
  extend: "Ext.draw.sprite.Path",
  alias: "sprite.sector",
  type: "sector",
  inheritableStatics: {
    def: {
      processors: {
        centerX: "number",
        centerY: "number",
        startAngle: "number",
        endAngle: "number",
        startRho: "number",
        endRho: "number",
        margin: "number"
      },
      aliases: { rho: "endRho" },
      triggers: {
        centerX: "path,bbox",
        centerY: "path,bbox",
        startAngle: "path,bbox",
        endAngle: "path,bbox",
        startRho: "path,bbox",
        endRho: "path,bbox",
        margin: "path,bbox"
      },
      defaults: {
        centerX: 0,
        centerY: 0,
        startAngle: 0,
        endAngle: 0,
        startRho: 0,
        endRho: 150,
        margin: 0,
        path: "M 0,0"
      }
    }
  },
  getMidAngle: function () {
    return this.midAngle || 0;
  },
  updatePath: function (j, h) {
    var g = Math.min(h.startAngle, h.endAngle),
      c = Math.max(h.startAngle, h.endAngle),
      b = (this.midAngle = (g + c) * 0.5),
      d = h.margin,
      f = h.centerX,
      e = h.centerY,
      i = Math.min(h.startRho, h.endRho),
      a = Math.max(h.startRho, h.endRho);
    if (d) {
      f += d * Math.cos(b);
      e += d * Math.sin(b);
    }
    j.moveTo(f + i * Math.cos(g), e + i * Math.sin(g));
    j.lineTo(f + a * Math.cos(g), e + a * Math.sin(g));
    j.arc(f, e, a, g, c, false);
    j.lineTo(f + i * Math.cos(c), e + i * Math.sin(c));
    j.arc(f, e, i, c, g, true);
  }
});
Ext.define("Ext.draw.sprite.Square", {
  extend: "Ext.draw.sprite.Path",
  alias: "sprite.square",
  inheritableStatics: {
    def: {
      processors: { x: "number", y: "number", size: "number" },
      defaults: { x: 0, y: 0, size: 4 },
      triggers: { x: "path", y: "path", size: "size" }
    }
  },
  updatePath: function (e, b) {
    var c = b.size * 1.2,
      d = c * 2,
      a = b.x - b.lineWidth / 2,
      f = b.y;
    e.fromSvgString(
      "M".concat(a - c, ",", f - c, "l", [d, 0, 0, d, -d, 0, 0, -d, "z"])
    );
  }
});
Ext.define("Ext.draw.TextMeasurer", {
  singleton: true,
  requires: ["Ext.util.TextMetrics"],
  measureDiv: null,
  measureCache: {},
  precise: Ext.isIE8,
  measureDivTpl: {
    tag: "div",
    style: {
      overflow: "hidden",
      position: "relative",
      float: "left",
      width: 0,
      height: 0
    },
    children: {
      tag: "div",
      style: {
        display: "block",
        position: "absolute",
        x: -100000,
        y: -100000,
        padding: 0,
        margin: 0,
        "z-index": -100000,
        "white-space": "nowrap"
      }
    }
  },
  actualMeasureText: function (g, b) {
    var e = Ext.draw.TextMeasurer,
      f = e.measureDiv,
      a = 100000,
      c;
    if (!f) {
      var d = Ext.Element.create({
        style: {
          overflow: "hidden",
          position: "relative",
          float: "left",
          width: 0,
          height: 0
        }
      });
      e.measureDiv = f = Ext.Element.create({
        style: {
          position: "absolute",
          x: a,
          y: a,
          "z-index": -a,
          "white-space": "nowrap",
          display: "block",
          padding: 0,
          margin: 0
        }
      });
      Ext.getBody().appendChild(d);
      d.appendChild(f);
    }
    if (b) {
      f.setStyle({ font: b, lineHeight: "normal" });
    }
    f.setText("(" + g + ")");
    c = f.getSize();
    f.setText("()");
    c.width -= f.getSize().width;
    return c;
  },
  measureTextSingleLine: function (h, d) {
    if (this.precise) {
      return this.preciseMeasureTextSingleLine(h, d);
    }
    h = h.toString();
    var a = this.measureCache,
      g = h.split(""),
      c = 0,
      j = 0,
      l,
      b,
      e,
      f,
      k;
    if (!a[d]) {
      a[d] = {};
    }
    a = a[d];
    if (a[h]) {
      return a[h];
    }
    for (e = 0, f = g.length; e < f; e++) {
      b = g[e];
      if (!(l = a[b])) {
        k = this.actualMeasureText(b, d);
        l = a[b] = k;
      }
      c += l.width;
      j = Math.max(j, l.height);
    }
    return (a[h] = { width: c, height: j });
  },
  preciseMeasureTextSingleLine: function (c, a) {
    c = c.toString();
    var b =
      this.measureDiv ||
      (this.measureDiv = Ext.getBody()
        .createChild(this.measureDivTpl)
        .down("div"));
    b.setStyle({ font: a || "" });
    return Ext.util.TextMetrics.measure(b, c);
  },
  measureText: function (e, b) {
    var h = e.split("\n"),
      d = h.length,
      f = 0,
      a = 0,
      j,
      c,
      g;
    if (d === 1) {
      return this.measureTextSingleLine(e, b);
    }
    g = [];
    for (c = 0; c < d; c++) {
      j = this.measureTextSingleLine(h[c], b);
      g.push(j);
      f += j.height;
      a = Math.max(a, j.width);
    }
    return { width: a, height: f, sizes: g };
  }
});
Ext.define("Ext.draw.sprite.Text", function () {
  var d = {
    "xx-small": true,
    "x-small": true,
    small: true,
    medium: true,
    large: true,
    "x-large": true,
    "xx-large": true
  };
  var b = {
    normal: true,
    bold: true,
    bolder: true,
    lighter: true,
    100: true,
    200: true,
    300: true,
    400: true,
    500: true,
    600: true,
    700: true,
    800: true,
    900: true
  };
  var a = {
    start: "start",
    left: "start",
    center: "center",
    middle: "center",
    end: "end",
    right: "end"
  };
  var c = {
    top: "top",
    hanging: "hanging",
    middle: "middle",
    center: "middle",
    alphabetic: "alphabetic",
    ideographic: "ideographic",
    bottom: "bottom"
  };
  return {
    extend: "Ext.draw.sprite.Sprite",
    requires: ["Ext.draw.TextMeasurer", "Ext.draw.Color"],
    alias: "sprite.text",
    type: "text",
    lineBreakRe: /\r?\n/g,
    inheritableStatics: {
      def: {
        animationProcessors: { text: "text" },
        processors: {
          x: "number",
          y: "number",
          text: "string",
          fontSize: function (e) {
            if (Ext.isNumber(+e)) {
              return e + "px";
            } else {
              if (e.match(Ext.dom.Element.unitRe)) {
                return e;
              } else {
                if (e in d) {
                  return e;
                }
              }
            }
          },
          fontStyle: "enums(,italic,oblique)",
          fontVariant: "enums(,small-caps)",
          fontWeight: function (e) {
            if (e in b) {
              return String(e);
            } else {
              return "";
            }
          },
          fontFamily: "string",
          textAlign: function (e) {
            return a[e] || "center";
          },
          textBaseline: function (e) {
            return c[e] || "alphabetic";
          },
          font: "string"
        },
        aliases: {
          "font-size": "fontSize",
          "font-family": "fontFamily",
          "font-weight": "fontWeight",
          "font-variant": "fontVariant",
          "text-anchor": "textAlign"
        },
        defaults: {
          fontStyle: "",
          fontVariant: "",
          fontWeight: "",
          fontSize: "10px",
          fontFamily: "sans-serif",
          font: "10px sans-serif",
          textBaseline: "alphabetic",
          textAlign: "start",
          strokeStyle: "rgba(0, 0, 0, 0)",
          fillStyle: "#000",
          x: 0,
          y: 0,
          text: ""
        },
        triggers: {
          fontStyle: "fontX,bbox",
          fontVariant: "fontX,bbox",
          fontWeight: "fontX,bbox",
          fontSize: "fontX,bbox",
          fontFamily: "fontX,bbox",
          font: "font,bbox,canvas",
          textBaseline: "bbox",
          textAlign: "bbox",
          x: "bbox",
          y: "bbox",
          text: "bbox"
        },
        updaters: { fontX: "makeFontShorthand", font: "parseFontShorthand" }
      }
    },
    config: { preciseMeasurement: undefined },
    constructor: function (e) {
      if (e && e.font) {
        e = Ext.clone(e);
        for (var f in e) {
          if (f !== "font" && f.indexOf("font") === 0) {
            delete e[f];
          }
        }
      }
      Ext.draw.sprite.Sprite.prototype.constructor.call(this, e);
    },
    fontValuesMap: {
      italic: "fontStyle",
      oblique: "fontStyle",
      "small-caps": "fontVariant",
      bold: "fontWeight",
      bolder: "fontWeight",
      lighter: "fontWeight",
      100: "fontWeight",
      200: "fontWeight",
      300: "fontWeight",
      400: "fontWeight",
      500: "fontWeight",
      600: "fontWeight",
      700: "fontWeight",
      800: "fontWeight",
      900: "fontWeight",
      "xx-small": "fontSize",
      "x-small": "fontSize",
      small: "fontSize",
      medium: "fontSize",
      large: "fontSize",
      "x-large": "fontSize",
      "xx-large": "fontSize"
    },
    makeFontShorthand: function (e) {
      var f = [];
      if (e.fontStyle) {
        f.push(e.fontStyle);
      }
      if (e.fontVariant) {
        f.push(e.fontVariant);
      }
      if (e.fontWeight) {
        f.push(e.fontWeight);
      }
      if (e.fontSize) {
        f.push(e.fontSize);
      }
      if (e.fontFamily) {
        f.push(e.fontFamily);
      }
      this.setAttributes({ font: f.join(" ") }, true);
    },
    parseFontShorthand: function (j) {
      var m = j.font,
        k = m.length,
        l = {},
        n = this.fontValuesMap,
        e = 0,
        i,
        g,
        f,
        h;
      while (e < k && i !== -1) {
        i = m.indexOf(" ", e);
        if (i < 0) {
          f = m.substr(e);
        } else {
          if (i > e) {
            f = m.substr(e, i - e);
          } else {
            continue;
          }
        }
        g = f.indexOf("/");
        if (g > 0) {
          f = f.substr(0, g);
        } else {
          if (g === 0) {
            continue;
          }
        }
        if (f !== "normal" && f !== "inherit") {
          h = n[f];
          if (h) {
            l[h] = f;
          } else {
            if (f.match(Ext.dom.Element.unitRe)) {
              l.fontSize = f;
            } else {
              l.fontFamily = m.substr(e);
              break;
            }
          }
        }
        e = i + 1;
      }
      if (!l.fontStyle) {
        l.fontStyle = "";
      }
      if (!l.fontVariant) {
        l.fontVariant = "";
      }
      if (!l.fontWeight) {
        l.fontWeight = "";
      }
      this.setAttributes(l, true);
    },
    fontProperties: {
      fontStyle: true,
      fontVariant: true,
      fontWeight: true,
      fontSize: true,
      fontFamily: true
    },
    setAttributes: function (g, i, e) {
      var f, h;
      if (g && g.font) {
        h = {};
        for (f in g) {
          if (!(f in this.fontProperties)) {
            h[f] = g[f];
          }
        }
        g = h;
      }
      this.callParent([g, i, e]);
    },
    getBBox: function (g) {
      var h = this,
        f = h.attr.bbox.plain,
        e = h.getSurface();
      if (f.dirty) {
        h.updatePlainBBox(f);
        f.dirty = false;
      }
      if (e && e.getInherited().rtl && e.getFlipRtlText()) {
        h.updatePlainBBox(f, true);
      }
      return h.callParent([g]);
    },
    rtlAlignments: { start: "end", center: "center", end: "start" },
    updatePlainBBox: function (k, B) {
      var E = this,
        w = E.attr,
        o = w.x,
        n = w.y,
        q = [],
        t = w.font,
        r = w.text,
        s = w.textBaseline,
        l = w.textAlign,
        D = E.getPreciseMeasurement(),
        u,
        C;
      if (B && E.oldSize) {
        u = E.oldSize;
      } else {
        C = Ext.draw.TextMeasurer.precise;
        if (Ext.isBoolean(D)) {
          Ext.draw.TextMeasurer.precise = D;
        }
        u = E.oldSize = Ext.draw.TextMeasurer.measureText(r, t);
        Ext.draw.TextMeasurer.precise = C;
      }
      var z = E.getSurface(),
        p = (z && z.getInherited().rtl) || false,
        v = p && z.getFlipRtlText(),
        f = u.sizes,
        g = u.height,
        j = u.width,
        m = f ? f.length : 0,
        e,
        h,
        A = 0;
      switch (s) {
        case "hanging":
        case "top":
          break;
        case "ideographic":
        case "bottom":
          n -= g;
          break;
        case "alphabetic":
          n -= g * 0.8;
          break;
        case "middle":
          n -= g * 0.5;
          break;
      }
      if (v) {
        h = z.getRect();
        o = h[2] - h[0] - o;
        l = E.rtlAlignments[l];
      }
      switch (l) {
        case "start":
          if (p) {
            for (; A < m; A++) {
              e = f[A].width;
              q.push(-(j - e));
            }
          }
          break;
        case "end":
          o -= j;
          if (p) {
            break;
          }
          for (; A < m; A++) {
            e = f[A].width;
            q.push(j - e);
          }
          break;
        case "center":
          o -= j * 0.5;
          for (; A < m; A++) {
            e = f[A].width;
            q.push((p ? -1 : 1) * (j - e) * 0.5);
          }
          break;
      }
      w.textAlignOffsets = q;
      k.x = o;
      k.y = n;
      k.width = j;
      k.height = g;
    },
    setText: function (e) {
      this.setAttributes({ text: e }, true);
    },
    render: function (e, q, k) {
      var h = this,
        g = h.attr,
        p = Ext.draw.Matrix.fly(g.matrix.elements.slice(0)),
        o = h.getBBox(true),
        s = g.textAlignOffsets,
        m = Ext.util.Color.RGBA_NONE,
        l,
        j,
        f,
        r,
        n;
      if (g.text.length === 0) {
        return;
      }
      r = g.text.split(h.lineBreakRe);
      n = o.height / r.length;
      l = g.bbox.plain.x;
      j = g.bbox.plain.y + n * 0.78;
      p.toContext(q);
      if (e.getInherited().rtl) {
        l += g.bbox.plain.width;
      }
      for (f = 0; f < r.length; f++) {
        if (q.fillStyle !== m) {
          q.fillText(r[f], l + (s[f] || 0), j + n * f);
        }
        if (q.strokeStyle !== m) {
          q.strokeText(r[f], l + (s[f] || 0), j + n * f);
        }
      }
    }
  };
});
Ext.define("Ext.draw.sprite.Tick", {
  extend: "Ext.draw.sprite.Line",
  alias: "sprite.tick",
  inheritableStatics: {
    def: {
      processors: { x: "number", y: "number", size: "number" },
      defaults: { x: 0, y: 0, size: 4 },
      triggers: { x: "tick", y: "tick", size: "tick" },
      updaters: {
        tick: function (b) {
          var d = b.size * 1.5,
            c = b.lineWidth / 2,
            a = b.x,
            e = b.y;
          this.setAttributes({
            fromX: a - c,
            fromY: e - d,
            toX: a - c,
            toY: e + d
          });
        }
      }
    }
  }
});
Ext.define("Ext.draw.sprite.Triangle", {
  extend: "Ext.draw.sprite.Path",
  alias: "sprite.triangle",
  inheritableStatics: {
    def: {
      processors: { x: "number", y: "number", size: "number" },
      defaults: { x: 0, y: 0, size: 4 },
      triggers: { x: "path", y: "path", size: "path" }
    }
  },
  updatePath: function (d, b) {
    var c = b.size * 2.2,
      a = b.x,
      e = b.y;
    d.fromSvgString(
      "M".concat(
        a,
        ",",
        e,
        "m0-",
        c * 0.48,
        "l",
        c * 0.5,
        ",",
        c * 0.87,
        "-",
        c,
        ",0z"
      )
    );
  }
});
Ext.define("Ext.draw.gradient.Linear", {
  extend: "Ext.draw.gradient.Gradient",
  requires: ["Ext.draw.Color"],
  type: "linear",
  config: { degrees: 0, radians: 0 },
  applyRadians: function (b, a) {
    if (Ext.isNumber(b)) {
      return b;
    }
    return a;
  },
  applyDegrees: function (b, a) {
    if (Ext.isNumber(b)) {
      return b;
    }
    return a;
  },
  updateRadians: function (a) {
    this.setDegrees(Ext.draw.Draw.degrees(a));
  },
  updateDegrees: function (a) {
    this.setRadians(Ext.draw.Draw.rad(a));
  },
  generateGradient: function (q, o) {
    var c = this.getRadians(),
      p = Math.cos(c),
      j = Math.sin(c),
      m = o.width,
      f = o.height,
      d = o.x + m * 0.5,
      b = o.y + f * 0.5,
      n = this.getStops(),
      g = n.length,
      k,
      a,
      e;
    if (Ext.isNumber(d) && Ext.isNumber(b) && f > 0 && m > 0) {
      a =
        (Math.sqrt(f * f + m * m) * Math.abs(Math.cos(c - Math.atan(f / m)))) /
        2;
      k = q.createLinearGradient(d + p * a, b + j * a, d - p * a, b - j * a);
      for (e = 0; e < g; e++) {
        k.addColorStop(n[e].offset, n[e].color);
      }
      return k;
    }
    return Ext.util.Color.NONE;
  }
});
Ext.define("Ext.draw.gradient.Radial", {
  extend: "Ext.draw.gradient.Gradient",
  type: "radial",
  config: { start: { x: 0, y: 0, r: 0 }, end: { x: 0, y: 0, r: 1 } },
  applyStart: function (a, b) {
    if (!b) {
      return a;
    }
    var c = { x: b.x, y: b.y, r: b.r };
    if ("x" in a) {
      c.x = a.x;
    } else {
      if ("centerX" in a) {
        c.x = a.centerX;
      }
    }
    if ("y" in a) {
      c.y = a.y;
    } else {
      if ("centerY" in a) {
        c.y = a.centerY;
      }
    }
    if ("r" in a) {
      c.r = a.r;
    } else {
      if ("radius" in a) {
        c.r = a.radius;
      }
    }
    return c;
  },
  applyEnd: function (b, a) {
    if (!a) {
      return b;
    }
    var c = { x: a.x, y: a.y, r: a.r };
    if ("x" in b) {
      c.x = b.x;
    } else {
      if ("centerX" in b) {
        c.x = b.centerX;
      }
    }
    if ("y" in b) {
      c.y = b.y;
    } else {
      if ("centerY" in b) {
        c.y = b.centerY;
      }
    }
    if ("r" in b) {
      c.r = b.r;
    } else {
      if ("radius" in b) {
        c.r = b.radius;
      }
    }
    return c;
  },
  generateGradient: function (n, m) {
    var a = this.getStart(),
      b = this.getEnd(),
      k = m.width * 0.5,
      d = m.height * 0.5,
      j = m.x + k,
      f = m.y + d,
      g = n.createRadialGradient(
        j + a.x * k,
        f + a.y * d,
        a.r * Math.max(k, d),
        j + b.x * k,
        f + b.y * d,
        b.r * Math.max(k, d)
      ),
      l = this.getStops(),
      e = l.length,
      c;
    for (c = 0; c < e; c++) {
      g.addColorStop(l[c].offset, l[c].color);
    }
    return g;
  }
});
Ext.define("Ext.draw.Surface", {
  extend: "Ext.draw.SurfaceBase",
  xtype: "surface",
  requires: [
    "Ext.draw.sprite.*",
    "Ext.draw.gradient.*",
    "Ext.draw.sprite.AttributeDefinition",
    "Ext.draw.Matrix",
    "Ext.draw.Draw"
  ],
  uses: ["Ext.draw.engine.Canvas"],
  devicePixelRatio:
    window.devicePixelRatio ||
    window.screen.deviceXDPI / window.screen.logicalXDPI,
  deprecated: {
    "5.1.0": {
      statics: {
        methods: {
          stableSort: function (a) {
            return Ext.Array.sort(a, function (d, c) {
              return d.attr.zIndex - c.attr.zIndex;
            });
          }
        }
      }
    }
  },
  cls: Ext.baseCSSPrefix + "surface",
  config: {
    rect: null,
    background: null,
    items: [],
    dirty: false,
    flipRtlText: false
  },
  isSurface: true,
  isPendingRenderFrame: false,
  dirtyPredecessorCount: 0,
  constructor: function (a) {
    var b = this;
    b.predecessors = [];
    b.successors = [];
    b.map = {};
    b.callParent([a]);
    b.matrix = new Ext.draw.Matrix();
    b.inverseMatrix = b.matrix.inverse();
  },
  roundPixel: function (a) {
    return Math.round(this.devicePixelRatio * a) / this.devicePixelRatio;
  },
  waitFor: function (a) {
    var b = this,
      c = b.predecessors;
    if (!Ext.Array.contains(c, a)) {
      c.push(a);
      a.successors.push(b);
      if (a.getDirty()) {
        b.dirtyPredecessorCount++;
      }
    }
  },
  updateDirty: function (d) {
    var c = this.successors,
      e = c.length,
      b = 0,
      a;
    for (; b < e; b++) {
      a = c[b];
      if (d) {
        a.dirtyPredecessorCount++;
        a.setDirty(true);
      } else {
        a.dirtyPredecessorCount--;
        if (a.dirtyPredecessorCount === 0 && a.isPendingRenderFrame) {
          a.renderFrame();
        }
      }
    }
  },
  applyBackground: function (a, b) {
    this.setDirty(true);
    if (Ext.isString(a)) {
      a = { fillStyle: a };
    }
    return Ext.factory(a, Ext.draw.sprite.Rect, b);
  },
  applyRect: function (a, b) {
    if (b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]) {
      return;
    }
    if (Ext.isArray(a)) {
      return [a[0], a[1], a[2], a[3]];
    } else {
      if (Ext.isObject(a)) {
        return [
          a.x || a.left,
          a.y || a.top,
          a.width || a.right - a.left,
          a.height || a.bottom - a.top
        ];
      }
    }
  },
  updateRect: function (i) {
    var h = this,
      c = i[0],
      f = i[1],
      g = c + i[2],
      a = f + i[3],
      e = h.getBackground(),
      d = h.element;
    d.setLocalXY(Math.floor(c), Math.floor(f));
    d.setSize(Math.ceil(g - Math.floor(c)), Math.ceil(a - Math.floor(f)));
    if (e) {
      e.setAttributes({
        x: 0,
        y: 0,
        width: Math.ceil(g - Math.floor(c)),
        height: Math.ceil(a - Math.floor(f))
      });
    }
    h.setDirty(true);
  },
  resetTransform: function () {
    this.matrix.set(1, 0, 0, 1, 0, 0);
    this.inverseMatrix.set(1, 0, 0, 1, 0, 0);
    this.setDirty(true);
  },
  get: function (a) {
    return this.map[a] || this.getItems()[a];
  },
  add: function () {
    var h = this,
      f = Array.prototype.slice.call(arguments),
      k = Ext.isArray(f[0]),
      a = h.map,
      d = [],
      g,
      l,
      j,
      b,
      c,
      e;
    g = Ext.Array.clean(k ? f[0] : f);
    if (!g.length) {
      return d;
    }
    for (c = 0, e = g.length; c < e; c++) {
      l = g[c];
      if (!l || l.destroyed) {
        continue;
      }
      j = null;
      if (l.isSprite && !a[l.getId()]) {
        j = l;
      } else {
        if (!a[l.id]) {
          j = this.createItem(l);
        }
      }
      if (j) {
        a[j.getId()] = j;
        d.push(j);
        b = j.getSurface();
        if (b && b.isSurface) {
          b.remove(j);
        }
        j.setParent(h);
        j.setSurface(h);
        h.onAdd(j);
      }
    }
    g = h.getItems();
    if (g) {
      g.push.apply(g, d);
    }
    h.dirtyZIndex = true;
    h.setDirty(true);
    if (!k && d.length === 1) {
      return d[0];
    } else {
      return d;
    }
  },
  onAdd: Ext.emptyFn,
  remove: function (a, d) {
    var b = this,
      c = b.clearing,
      f,
      e;
    if (a) {
      if (a.charAt) {
        a = b.map[a];
      }
      if (!a || !a.isSprite) {
        return null;
      }
      f = a.id;
      e = b.map[f];
      delete b.map[f];
      if (a.destroyed || a.destroying) {
        if (e && !c) {
          Ext.Array.remove(b.getItems(), a);
        }
        return a;
      }
      if (!e) {
        if (d) {
          a.destroy();
        }
        return a;
      }
      a.setParent(null);
      a.setSurface(null);
      if (d) {
        a.destroy();
      }
      if (!c) {
        Ext.Array.remove(b.getItems(), a);
        b.dirtyZIndex = true;
        b.setDirty(true);
      }
    }
    return a || null;
  },
  removeAll: function (f) {
    var e = this,
      a = e.getItems(),
      d,
      c,
      b;
    e.clearing = !!f;
    for (b = a.length - 1; b >= 0; b--) {
      d = a[b];
      if (f) {
        d.destroy();
      } else {
        d.setParent(null);
        d.setSurface(null);
      }
    }
    e.clearing = false;
    a.length = 0;
    e.map = {};
    e.dirtyZIndex = true;
    if (!e.destroying) {
      e.setDirty(true);
    }
  },
  applyItems: function (a) {
    if (this.getItems()) {
      this.removeAll(true);
    }
    return Ext.Array.from(this.add(a));
  },
  createItem: function (a) {
    return Ext.create(a.xclass || "sprite." + a.type, a);
  },
  getBBox: function (e, b) {
    e = Ext.Array.from(e);
    var c = Infinity,
      h = -Infinity,
      g = Infinity,
      a = -Infinity,
      f = e.length,
      j,
      k,
      d;
    for (d = 0; d < f; d++) {
      j = e[d];
      k = j.getBBox(b);
      if (c > k.x) {
        c = k.x;
      }
      if (h < k.x + k.width) {
        h = k.x + k.width;
      }
      if (g > k.y) {
        g = k.y;
      }
      if (a < k.y + k.height) {
        a = k.y + k.height;
      }
    }
    return { x: c, y: g, width: h - c, height: a - g };
  },
  emptyRect: [0, 0, 0, 0],
  getEventXY: function (d) {
    var g = this,
      f = g.getInherited().rtl,
      c = d.getXY(),
      a = g.getOwnerBody(),
      i = a.getXY(),
      h = g.getRect() || g.emptyRect,
      j = [],
      b;
    if (f) {
      b = a.getWidth();
      j[0] = i[0] - c[0] - h[0] + b;
    } else {
      j[0] = c[0] - i[0] - h[0];
    }
    j[1] = c[1] - i[1] - h[1];
    return j;
  },
  clear: Ext.emptyFn,
  orderByZIndex: function () {
    var d = this,
      a = d.getItems(),
      e = false,
      b,
      c;
    if (d.getDirty()) {
      for (b = 0, c = a.length; b < c; b++) {
        if (a[b].attr.dirtyZIndex) {
          e = true;
          break;
        }
      }
      if (e) {
        Ext.Array.sort(a, function (g, f) {
          return g.attr.zIndex - f.attr.zIndex;
        });
        this.setDirty(true);
      }
      for (b = 0, c = a.length; b < c; b++) {
        a[b].attr.dirtyZIndex = false;
      }
    }
  },
  repaint: function () {
    var a = this;
    a.repaint = Ext.emptyFn;
    Ext.defer(function () {
      delete a.repaint;
      a.element.repaint();
    }, 1);
  },
  renderFrame: function () {
    var f = this;
    if (!(f.element && f.getDirty() && f.getRect())) {
      return;
    }
    if (f.dirtyPredecessorCount > 0) {
      f.isPendingRenderFrame = true;
      return;
    }
    var c = f.getBackground(),
      a = f.getItems(),
      e,
      b,
      d;
    f.orderByZIndex();
    if (f.getDirty()) {
      f.clear();
      f.clearTransform();
      if (c) {
        f.renderSprite(c);
      }
      for (b = 0, d = a.length; b < d; b++) {
        e = a[b];
        if (f.renderSprite(e) === false) {
          return;
        }
        e.attr.textPositionCount = f.textPosition;
      }
      f.setDirty(false);
    }
  },
  renderSprite: Ext.emptyFn,
  clearTransform: Ext.emptyFn,
  destroy: function () {
    var a = this;
    a.destroying = true;
    a.removeAll(true);
    a.destroying = false;
    a.predecessors = a.successors = null;
    if (a.hasListeners.destroy) {
      a.fireEvent("destroy", a);
    }
    a.callParent();
  }
});
Ext.define("Ext.draw.overrides.hittest.Surface", {
  override: "Ext.draw.Surface",
  hitTest: function (b, c) {
    var f = this,
      g = f.getItems(),
      e,
      d,
      a;
    c = c || Ext.draw.sprite.Sprite.defaultHitTestOptions;
    for (e = g.length - 1; e >= 0; e--) {
      d = g[e];
      if (d.hitTest) {
        a = d.hitTest(b, c);
        if (a) {
          return a;
        }
      }
    }
    return null;
  },
  hitTestEvent: function (b, a) {
    var c = this.getEventXY(b);
    return this.hitTest(c, a);
  }
});
Ext.define("Ext.draw.engine.SvgContext", {
  requires: ["Ext.draw.Color"],
  toSave: [
    "strokeOpacity",
    "strokeStyle",
    "fillOpacity",
    "fillStyle",
    "globalAlpha",
    "lineWidth",
    "lineCap",
    "lineJoin",
    "lineDash",
    "lineDashOffset",
    "miterLimit",
    "shadowOffsetX",
    "shadowOffsetY",
    "shadowBlur",
    "shadowColor",
    "globalCompositeOperation",
    "position",
    "fillGradient",
    "strokeGradient"
  ],
  strokeOpacity: 1,
  strokeStyle: "none",
  fillOpacity: 1,
  fillStyle: "none",
  lineDas: [],
  lineDashOffset: 0,
  globalAlpha: 1,
  lineWidth: 1,
  lineCap: "butt",
  lineJoin: "miter",
  miterLimit: 10,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  shadowBlur: 0,
  shadowColor: "none",
  globalCompositeOperation: "src",
  urlStringRe: /^url\(#([\w\-]+)\)$/,
  constructor: function (a) {
    var b = this;
    b.surface = a;
    b.state = [];
    b.matrix = new Ext.draw.Matrix();
    b.path = null;
    b.clear();
  },
  clear: function () {
    this.group = this.surface.mainGroup;
    this.position = 0;
    this.path = null;
  },
  getElement: function (a) {
    return this.surface.getSvgElement(this.group, a, this.position++);
  },
  save: function () {
    var c = this.toSave,
      e = {},
      d = this.getElement("g"),
      b,
      a;
    for (a = 0; a < c.length; a++) {
      b = c[a];
      if (b in this) {
        e[b] = this[b];
      }
    }
    this.position = 0;
    e.matrix = this.matrix.clone();
    this.state.push(e);
    this.group = d;
    return d;
  },
  restore: function () {
    var d = this.toSave,
      f = this.state.pop(),
      e = this.group,
      c = e.dom.childNodes,
      b,
      a;
    while (c.length > this.position) {
      e.last().destroy();
    }
    for (a = 0; a < d.length; a++) {
      b = d[a];
      if (b in f) {
        this[b] = f[b];
      } else {
        delete this[b];
      }
    }
    this.setTransform.apply(this, f.matrix.elements);
    this.group = e.getParent();
  },
  transform: function (f, b, e, g, d, c) {
    if (this.path) {
      var a = Ext.draw.Matrix.fly([f, b, e, g, d, c]).inverse();
      this.path.transform(a);
    }
    this.matrix.append(f, b, e, g, d, c);
  },
  setTransform: function (e, a, d, f, c, b) {
    if (this.path) {
      this.path.transform(this.matrix);
    }
    this.matrix.reset();
    this.transform(e, a, d, f, c, b);
  },
  scale: function (a, b) {
    this.transform(a, 0, 0, b, 0, 0);
  },
  rotate: function (d) {
    var c = Math.cos(d),
      a = Math.sin(d),
      b = -Math.sin(d),
      e = Math.cos(d);
    this.transform(c, a, b, e, 0, 0);
  },
  translate: function (a, b) {
    this.transform(1, 0, 0, 1, a, b);
  },
  setGradientBBox: function (a) {
    this.bbox = a;
  },
  beginPath: function () {
    this.path = new Ext.draw.Path();
  },
  moveTo: function (a, b) {
    if (!this.path) {
      this.beginPath();
    }
    this.path.moveTo(a, b);
    this.path.element = null;
  },
  lineTo: function (a, b) {
    if (!this.path) {
      this.beginPath();
    }
    this.path.lineTo(a, b);
    this.path.element = null;
  },
  rect: function (b, d, c, a) {
    this.moveTo(b, d);
    this.lineTo(b + c, d);
    this.lineTo(b + c, d + a);
    this.lineTo(b, d + a);
    this.closePath();
  },
  strokeRect: function (b, d, c, a) {
    this.beginPath();
    this.rect(b, d, c, a);
    this.stroke();
  },
  fillRect: function (b, d, c, a) {
    this.beginPath();
    this.rect(b, d, c, a);
    this.fill();
  },
  closePath: function () {
    if (!this.path) {
      this.beginPath();
    }
    this.path.closePath();
    this.path.element = null;
  },
  arcSvg: function (d, a, f, g, c, b, e) {
    if (!this.path) {
      this.beginPath();
    }
    this.path.arcSvg(d, a, f, g, c, b, e);
    this.path.element = null;
  },
  arc: function (b, f, a, d, c, e) {
    if (!this.path) {
      this.beginPath();
    }
    this.path.arc(b, f, a, d, c, e);
    this.path.element = null;
  },
  ellipse: function (a, h, g, f, d, c, b, e) {
    if (!this.path) {
      this.beginPath();
    }
    this.path.ellipse(a, h, g, f, d, c, b, e);
    this.path.element = null;
  },
  arcTo: function (b, e, a, d, g, f, c) {
    if (!this.path) {
      this.beginPath();
    }
    this.path.arcTo(b, e, a, d, g, f, c);
    this.path.element = null;
  },
  bezierCurveTo: function (d, f, b, e, a, c) {
    if (!this.path) {
      this.beginPath();
    }
    this.path.bezierCurveTo(d, f, b, e, a, c);
    this.path.element = null;
  },
  strokeText: function (d, a, e) {
    d = String(d);
    if (this.strokeStyle) {
      var b = this.getElement("text"),
        c = this.surface.getSvgElement(b, "tspan", 0);
      this.surface.setElementAttributes(b, {
        x: a,
        y: e,
        transform: this.matrix.toSvg(),
        stroke: this.strokeStyle,
        fill: "none",
        opacity: this.globalAlpha,
        "stroke-opacity": this.strokeOpacity,
        style: "font: " + this.font,
        "stroke-dasharray": this.lineDash.join(","),
        "stroke-dashoffset": this.lineDashOffset
      });
      if (this.lineDash.length) {
        this.surface.setElementAttributes(b, {
          "stroke-dasharray": this.lineDash.join(","),
          "stroke-dashoffset": this.lineDashOffset
        });
      }
      if (c.dom.firstChild) {
        c.dom.removeChild(c.dom.firstChild);
      }
      this.surface.setElementAttributes(c, {
        "alignment-baseline": "alphabetic"
      });
      c.dom.appendChild(document.createTextNode(Ext.String.htmlDecode(d)));
    }
  },
  fillText: function (d, a, e) {
    d = String(d);
    if (this.fillStyle) {
      var b = this.getElement("text"),
        c = this.surface.getSvgElement(b, "tspan", 0);
      this.surface.setElementAttributes(b, {
        x: a,
        y: e,
        transform: this.matrix.toSvg(),
        fill: this.fillStyle,
        opacity: this.globalAlpha,
        "fill-opacity": this.fillOpacity,
        style: "font: " + this.font
      });
      if (c.dom.firstChild) {
        c.dom.removeChild(c.dom.firstChild);
      }
      this.surface.setElementAttributes(c, {
        "alignment-baseline": "alphabetic"
      });
      c.dom.appendChild(document.createTextNode(Ext.String.htmlDecode(d)));
    }
  },
  drawImage: function (c, k, i, l, e, p, n, a, g) {
    var f = this,
      d = f.getElement("image"),
      j = k,
      h = i,
      b = typeof l === "undefined" ? c.width : l,
      m = typeof e === "undefined" ? c.height : e,
      o = null;
    if (typeof g !== "undefined") {
      o = k + " " + i + " " + l + " " + e;
      j = p;
      h = n;
      b = a;
      m = g;
    }
    d.dom.setAttributeNS("http://www.w3.org/1999/xlink", "href", c.src);
    f.surface.setElementAttributes(d, {
      viewBox: o,
      x: j,
      y: h,
      width: b,
      height: m,
      opacity: f.globalAlpha,
      transform: f.matrix.toSvg()
    });
  },
  fill: function () {
    var c = this;
    if (!c.path) {
      return;
    }
    if (c.fillStyle) {
      var e,
        a = c.fillGradient,
        b = c.path.element,
        f = c.bbox,
        d;
      if (!b) {
        e = c.path.toString();
        b = c.path.element = c.getElement("path");
        c.surface.setElementAttributes(b, {
          d: e,
          transform: c.matrix.toSvg()
        });
      }
      if (a && f) {
        d = a.generateGradient(c, f);
      } else {
        d = c.fillStyle;
      }
      c.surface.setElementAttributes(b, {
        fill: d,
        "fill-opacity": c.fillOpacity * c.globalAlpha
      });
    }
  },
  stroke: function () {
    var b = this;
    if (!b.path) {
      return;
    }
    if (b.strokeStyle) {
      var e,
        d = b.strokeGradient,
        a = b.path.element,
        f = b.bbox,
        c;
      if (!a || !b.path.svgString) {
        e = b.path.toString();
        if (!e) {
          return;
        }
        a = b.path.element = b.getElement("path");
        b.surface.setElementAttributes(a, {
          fill: "none",
          d: e,
          transform: b.matrix.toSvg()
        });
      }
      if (d && f) {
        c = d.generateGradient(b, f);
      } else {
        c = b.strokeStyle;
      }
      b.surface.setElementAttributes(a, {
        stroke: c,
        "stroke-linecap": b.lineCap,
        "stroke-linejoin": b.lineJoin,
        "stroke-width": b.lineWidth,
        "stroke-opacity": b.strokeOpacity * b.globalAlpha,
        "stroke-dasharray": b.lineDash.join(","),
        "stroke-dashoffset": b.lineDashOffset
      });
      if (b.lineDash.length) {
        b.surface.setElementAttributes(a, {
          "stroke-dasharray": b.lineDash.join(","),
          "stroke-dashoffset": b.lineDashOffset
        });
      }
    }
  },
  fillStroke: function (a, e) {
    var b = this,
      d = b.fillStyle,
      g = b.strokeStyle,
      c = b.fillOpacity,
      f = b.strokeOpacity;
    if (e === undefined) {
      e = a.transformFillStroke;
    }
    if (!e) {
      a.inverseMatrix.toContext(b);
    }
    if (d && c !== 0) {
      b.fill();
    }
    if (g && f !== 0) {
      b.stroke();
    }
  },
  appendPath: function (a) {
    this.path = a.clone();
  },
  setLineDash: function (a) {
    this.lineDash = a;
  },
  getLineDash: function () {
    return this.lineDash;
  },
  createLinearGradient: function (c, f, a, d) {
    var e = this,
      b = e.surface.getNextDef("linearGradient"),
      g;
    e.surface.setElementAttributes(b, {
      x1: c,
      y1: f,
      x2: a,
      y2: d,
      gradientUnits: "userSpaceOnUse"
    });
    g = new Ext.draw.engine.SvgContext.Gradient(e, e.surface, b);
    return g;
  },
  createRadialGradient: function (b, i, d, a, h, c) {
    var f = this,
      e = f.surface.getNextDef("radialGradient"),
      g;
    f.surface.setElementAttributes(e, {
      fx: b,
      fy: i,
      cx: a,
      cy: h,
      r: c,
      gradientUnits: "userSpaceOnUse"
    });
    g = new Ext.draw.engine.SvgContext.Gradient(f, f.surface, e, d / c);
    return g;
  }
});
Ext.define("Ext.draw.engine.SvgContext.Gradient", {
  isGradient: true,
  constructor: function (c, a, d, b) {
    var e = this;
    e.ctx = c;
    e.surface = a;
    e.element = d;
    e.position = 0;
    e.compression = b || 0;
  },
  addColorStop: function (e, b) {
    var d = this,
      c = d.surface.getSvgElement(d.element, "stop", d.position++),
      a = d.compression;
    d.surface.setElementAttributes(c, {
      offset: (((1 - a) * e + a) * 100).toFixed(2) + "%",
      "stop-color": b,
      "stop-opacity": Ext.util.Color.fly(b).a.toFixed(15)
    });
  },
  toString: function () {
    var a = this.element.dom.childNodes;
    while (a.length > this.position) {
      Ext.fly(a[a.length - 1]).destroy();
    }
    return "url(#" + this.element.getId() + ")";
  }
});
Ext.define("Ext.draw.engine.Svg", {
  extend: "Ext.draw.Surface",
  requires: ["Ext.draw.engine.SvgContext"],
  isSVG: true,
  config: { highPrecision: false },
  getElementConfig: function () {
    return {
      reference: "element",
      style: { position: "absolute" },
      children: [
        {
          reference: "innerElement",
          style: { width: "100%", height: "100%", position: "relative" },
          children: [
            {
              tag: "svg",
              reference: "svgElement",
              namespace: "http://www.w3.org/2000/svg",
              width: "100%",
              height: "100%",
              version: 1.1
            }
          ]
        }
      ]
    };
  },
  constructor: function (a) {
    var b = this;
    b.callParent([a]);
    b.mainGroup = b.createSvgNode("g");
    b.defsElement = b.createSvgNode("defs");
    b.svgElement.appendChild(b.mainGroup);
    b.svgElement.appendChild(b.defsElement);
    b.ctx = new Ext.draw.engine.SvgContext(b);
  },
  createSvgNode: function (a) {
    var b = document.createElementNS("http://www.w3.org/2000/svg", a);
    return Ext.get(b);
  },
  getSvgElement: function (e, b, a) {
    var f = e.dom.childNodes,
      d = f.length,
      c;
    if (a < d) {
      c = f[a];
      if (c.tagName === b) {
        return Ext.get(c);
      } else {
        Ext.destroy(c);
      }
    } else {
      if (a > d) {
        Ext.raise("Invalid position.");
      }
    }
    c = Ext.get(this.createSvgNode(b));
    if (a === 0) {
      e.insertFirst(c);
    } else {
      c.insertAfter(Ext.fly(f[a - 1]));
    }
    c.cache = {};
    return c;
  },
  setElementAttributes: function (d, b) {
    var f = d.dom,
      a = d.cache,
      c,
      e;
    for (c in b) {
      e = b[c];
      if (a[c] !== e) {
        a[c] = e;
        f.setAttribute(c, e);
      }
    }
  },
  getNextDef: function (a) {
    return this.getSvgElement(this.defsElement, a, this.defsPosition++);
  },
  clearTransform: function () {
    var a = this;
    a.mainGroup.set({ transform: a.matrix.toSvg() });
  },
  clear: function () {
    this.ctx.clear();
    this.removeSurplusDefs();
    this.defsPosition = 0;
  },
  removeSurplusDefs: function () {
    var d = this.defsElement,
      a = d.dom.childNodes,
      c = a.length,
      b;
    for (b = c - 1; b > this.defsPosition; b--) {
      d.removeChild(a[b]);
    }
  },
  renderSprite: function (b) {
    var d = this,
      c = d.getRect(),
      a = d.ctx;
    if (b.attr.hidden || b.attr.globalAlpha === 0) {
      a.save();
      a.restore();
      return;
    }
    b.element = a.save();
    b.preRender(this);
    b.useAttributes(a, c);
    if (false === b.render(this, a, [0, 0, c[2], c[3]])) {
      return false;
    }
    b.setDirty(false);
    a.restore();
  },
  toSVG: function (e, b) {
    var f = Ext.getClassName(this),
      c,
      a,
      g,
      d;
    c =
      '<svg version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg" width="' +
      e.width +
      '" height="' +
      e.height +
      '">';
    for (d = 0; d < b.length; d++) {
      a = b[d];
      if (Ext.getClassName(a) !== f) {
        continue;
      }
      g = a.getRect();
      c += '<g transform="translate(' + g[0] + "," + g[1] + ')">';
      c += this.serializeNode(a.svgElement.dom);
      c += "</g>";
    }
    c += "</svg>";
    return c;
  },
  flatten: function (c, a) {
    var b = '<?xml version="1.0" standalone="yes"?>';
    b += this.toSVG(c, a);
    return {
      data: "data:image/svg+xml;utf8," + encodeURIComponent(b),
      type: "svg"
    };
  },
  serializeNode: function (d) {
    var b = "",
      c,
      f,
      a,
      e;
    if (d.nodeType === document.TEXT_NODE) {
      return d.nodeValue;
    }
    b += "<" + d.nodeName;
    if (d.attributes.length) {
      for (c = 0, f = d.attributes.length; c < f; c++) {
        a = d.attributes[c];
        b += " " + a.name + '="' + a.value + '"';
      }
    }
    b += ">";
    if (d.childNodes && d.childNodes.length) {
      for (c = 0, f = d.childNodes.length; c < f; c++) {
        e = d.childNodes[c];
        b += this.serializeNode(e);
      }
    }
    b += "</" + d.nodeName + ">";
    return b;
  },
  destroy: function () {
    var a = this;
    a.ctx.destroy();
    a.mainGroup.destroy();
    a.defsElement.destroy();
    delete a.mainGroup;
    delete a.defsElement;
    delete a.ctx;
    a.callParent();
  },
  remove: function (a, b) {
    if (a && a.element) {
      a.element.destroy();
      a.element = null;
    }
    this.callParent(arguments);
  }
});
Ext.draw || (Ext.draw = {});
Ext.draw.engine || (Ext.draw.engine = {});
Ext.draw.engine.excanvas = true;
if (!document.createElement("canvas").getContext) {
  (function () {
    var ab = Math;
    var n = ab.round;
    var l = ab.sin;
    var A = ab.cos;
    var H = ab.abs;
    var N = ab.sqrt;
    var d = 10;
    var f = d / 2;
    var z = +navigator.userAgent.match(/MSIE ([\d.]+)?/)[1];
    function y() {
      return this.context_ || (this.context_ = new D(this));
    }
    var t = Array.prototype.slice;
    function g(j, m, p) {
      var i = t.call(arguments, 2);
      return function () {
        return j.apply(m, i.concat(t.call(arguments)));
      };
    }
    function af(i) {
      return String(i).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    }
    function Y(m, j, i) {
      Ext.onReady(function () {
        if (!m.namespaces[j]) {
          m.namespaces.add(j, i, "#default#VML");
        }
      });
    }
    function R(j) {
      Y(j, "g_vml_", "urn:schemas-microsoft-com:vml");
      Y(j, "g_o_", "urn:schemas-microsoft-com:office:office");
      if (!j.styleSheets.ex_canvas_) {
        var i = j.createStyleSheet();
        i.owningElement.id = "ex_canvas_";
        i.cssText =
          "canvas{display:inline-block;overflow:hidden;text-align:left;width:300px;height:150px}";
      }
    }
    R(document);
    var e = {
      init: function (i) {
        var j = i || document;
        j.createElement("canvas");
        j.attachEvent("onreadystatechange", g(this.init_, this, j));
      },
      init_: function (p) {
        var m = p.getElementsByTagName("canvas");
        for (var j = 0; j < m.length; j++) {
          this.initElement(m[j]);
        }
      },
      initElement: function (j) {
        if (!j.getContext) {
          j.getContext = y;
          R(j.ownerDocument);
          j.innerHTML = "";
          j.attachEvent("onpropertychange", x);
          j.attachEvent("onresize", W);
          var i = j.attributes;
          if (i.width && i.width.specified) {
            j.style.width = i.width.nodeValue + "px";
          } else {
            j.width = j.clientWidth;
          }
          if (i.height && i.height.specified) {
            j.style.height = i.height.nodeValue + "px";
          } else {
            j.height = j.clientHeight;
          }
        }
        return j;
      }
    };
    function x(j) {
      var i = j.srcElement;
      switch (j.propertyName) {
        case "width":
          i.getContext().clearRect();
          i.style.width = i.attributes.width.nodeValue + "px";
          i.firstChild.style.width = i.clientWidth + "px";
          break;
        case "height":
          i.getContext().clearRect();
          i.style.height = i.attributes.height.nodeValue + "px";
          i.firstChild.style.height = i.clientHeight + "px";
          break;
      }
    }
    function W(j) {
      var i = j.srcElement;
      if (i.firstChild) {
        i.firstChild.style.width = i.clientWidth + "px";
        i.firstChild.style.height = i.clientHeight + "px";
      }
    }
    e.init();
    var k = [];
    for (var ae = 0; ae < 16; ae++) {
      for (var ad = 0; ad < 16; ad++) {
        k[ae * 16 + ad] = ae.toString(16) + ad.toString(16);
      }
    }
    function B() {
      return [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ];
    }
    function J(p, m) {
      var j = B();
      for (var i = 0; i < 3; i++) {
        for (var ah = 0; ah < 3; ah++) {
          var Z = 0;
          for (var ag = 0; ag < 3; ag++) {
            Z += p[i][ag] * m[ag][ah];
          }
          j[i][ah] = Z;
        }
      }
      return j;
    }
    function v(j, i) {
      i.fillStyle = j.fillStyle;
      i.lineCap = j.lineCap;
      i.lineJoin = j.lineJoin;
      i.lineDash = j.lineDash;
      i.lineWidth = j.lineWidth;
      i.miterLimit = j.miterLimit;
      i.shadowBlur = j.shadowBlur;
      i.shadowColor = j.shadowColor;
      i.shadowOffsetX = j.shadowOffsetX;
      i.shadowOffsetY = j.shadowOffsetY;
      i.strokeStyle = j.strokeStyle;
      i.globalAlpha = j.globalAlpha;
      i.font = j.font;
      i.textAlign = j.textAlign;
      i.textBaseline = j.textBaseline;
      i.arcScaleX_ = j.arcScaleX_;
      i.arcScaleY_ = j.arcScaleY_;
      i.lineScale_ = j.lineScale_;
    }
    var b = {
      aliceblue: "#F0F8FF",
      antiquewhite: "#FAEBD7",
      aquamarine: "#7FFFD4",
      azure: "#F0FFFF",
      beige: "#F5F5DC",
      bisque: "#FFE4C4",
      black: "#000000",
      blanchedalmond: "#FFEBCD",
      blueviolet: "#8A2BE2",
      brown: "#A52A2A",
      burlywood: "#DEB887",
      cadetblue: "#5F9EA0",
      chartreuse: "#7FFF00",
      chocolate: "#D2691E",
      coral: "#FF7F50",
      cornflowerblue: "#6495ED",
      cornsilk: "#FFF8DC",
      crimson: "#DC143C",
      cyan: "#00FFFF",
      darkblue: "#00008B",
      darkcyan: "#008B8B",
      darkgoldenrod: "#B8860B",
      darkgray: "#A9A9A9",
      darkgreen: "#006400",
      darkgrey: "#A9A9A9",
      darkkhaki: "#BDB76B",
      darkmagenta: "#8B008B",
      darkolivegreen: "#556B2F",
      darkorange: "#FF8C00",
      darkorchid: "#9932CC",
      darkred: "#8B0000",
      darksalmon: "#E9967A",
      darkseagreen: "#8FBC8F",
      darkslateblue: "#483D8B",
      darkslategray: "#2F4F4F",
      darkslategrey: "#2F4F4F",
      darkturquoise: "#00CED1",
      darkviolet: "#9400D3",
      deeppink: "#FF1493",
      deepskyblue: "#00BFFF",
      dimgray: "#696969",
      dimgrey: "#696969",
      dodgerblue: "#1E90FF",
      firebrick: "#B22222",
      floralwhite: "#FFFAF0",
      forestgreen: "#228B22",
      gainsboro: "#DCDCDC",
      ghostwhite: "#F8F8FF",
      gold: "#FFD700",
      goldenrod: "#DAA520",
      grey: "#808080",
      greenyellow: "#ADFF2F",
      honeydew: "#F0FFF0",
      hotpink: "#FF69B4",
      indianred: "#CD5C5C",
      indigo: "#4B0082",
      ivory: "#FFFFF0",
      khaki: "#F0E68C",
      lavender: "#E6E6FA",
      lavenderblush: "#FFF0F5",
      lawngreen: "#7CFC00",
      lemonchiffon: "#FFFACD",
      lightblue: "#ADD8E6",
      lightcoral: "#F08080",
      lightcyan: "#E0FFFF",
      lightgoldenrodyellow: "#FAFAD2",
      lightgreen: "#90EE90",
      lightgrey: "#D3D3D3",
      lightpink: "#FFB6C1",
      lightsalmon: "#FFA07A",
      lightseagreen: "#20B2AA",
      lightskyblue: "#87CEFA",
      lightslategray: "#778899",
      lightslategrey: "#778899",
      lightsteelblue: "#B0C4DE",
      lightyellow: "#FFFFE0",
      limegreen: "#32CD32",
      linen: "#FAF0E6",
      magenta: "#FF00FF",
      mediumaquamarine: "#66CDAA",
      mediumblue: "#0000CD",
      mediumorchid: "#BA55D3",
      mediumpurple: "#9370DB",
      mediumseagreen: "#3CB371",
      mediumslateblue: "#7B68EE",
      mediumspringgreen: "#00FA9A",
      mediumturquoise: "#48D1CC",
      mediumvioletred: "#C71585",
      midnightblue: "#191970",
      mintcream: "#F5FFFA",
      mistyrose: "#FFE4E1",
      moccasin: "#FFE4B5",
      navajowhite: "#FFDEAD",
      oldlace: "#FDF5E6",
      olivedrab: "#6B8E23",
      orange: "#FFA500",
      orangered: "#FF4500",
      orchid: "#DA70D6",
      palegoldenrod: "#EEE8AA",
      palegreen: "#98FB98",
      paleturquoise: "#AFEEEE",
      palevioletred: "#DB7093",
      papayawhip: "#FFEFD5",
      peachpuff: "#FFDAB9",
      peru: "#CD853F",
      pink: "#FFC0CB",
      plum: "#DDA0DD",
      powderblue: "#B0E0E6",
      rosybrown: "#BC8F8F",
      royalblue: "#4169E1",
      saddlebrown: "#8B4513",
      salmon: "#FA8072",
      sandybrown: "#F4A460",
      seagreen: "#2E8B57",
      seashell: "#FFF5EE",
      sienna: "#A0522D",
      skyblue: "#87CEEB",
      slateblue: "#6A5ACD",
      slategray: "#708090",
      slategrey: "#708090",
      snow: "#FFFAFA",
      springgreen: "#00FF7F",
      steelblue: "#4682B4",
      tan: "#D2B48C",
      thistle: "#D8BFD8",
      tomato: "#FF6347",
      turquoise: "#40E0D0",
      violet: "#EE82EE",
      wheat: "#F5DEB3",
      whitesmoke: "#F5F5F5",
      yellowgreen: "#9ACD32"
    };
    function M(j) {
      var p = j.indexOf("(", 3);
      var i = j.indexOf(")", p + 1);
      var m = j.substring(p + 1, i).split(",");
      if (m.length != 4 || j.charAt(3) != "a") {
        m[3] = 1;
      }
      return m;
    }
    function c(i) {
      return parseFloat(i) / 100;
    }
    function r(j, m, i) {
      return Math.min(i, Math.max(m, j));
    }
    function I(ag) {
      var i, ai, aj, ah, ak, Z;
      ah = (parseFloat(ag[0]) / 360) % 360;
      if (ah < 0) {
        ah++;
      }
      ak = r(c(ag[1]), 0, 1);
      Z = r(c(ag[2]), 0, 1);
      if (ak == 0) {
        i = ai = aj = Z;
      } else {
        var j = Z < 0.5 ? Z * (1 + ak) : Z + ak - Z * ak;
        var m = 2 * Z - j;
        i = a(m, j, ah + 1 / 3);
        ai = a(m, j, ah);
        aj = a(m, j, ah - 1 / 3);
      }
      return (
        "#" +
        k[Math.floor(i * 255)] +
        k[Math.floor(ai * 255)] +
        k[Math.floor(aj * 255)]
      );
    }
    function a(j, i, m) {
      if (m < 0) {
        m++;
      }
      if (m > 1) {
        m--;
      }
      if (6 * m < 1) {
        return j + (i - j) * 6 * m;
      } else {
        if (2 * m < 1) {
          return i;
        } else {
          if (3 * m < 2) {
            return j + (i - j) * (2 / 3 - m) * 6;
          } else {
            return j;
          }
        }
      }
    }
    var C = {};
    function F(j) {
      if (j in C) {
        return C[j];
      }
      var ag,
        Z = 1;
      j = String(j);
      if (j.charAt(0) == "#") {
        ag = j;
      } else {
        if (/^rgb/.test(j)) {
          var p = M(j);
          var ag = "#",
            ah;
          for (var m = 0; m < 3; m++) {
            if (p[m].indexOf("%") != -1) {
              ah = Math.floor(c(p[m]) * 255);
            } else {
              ah = +p[m];
            }
            ag += k[r(ah, 0, 255)];
          }
          Z = +p[3];
        } else {
          if (/^hsl/.test(j)) {
            var p = M(j);
            ag = I(p);
            Z = p[3];
          } else {
            ag = b[j] || j;
          }
        }
      }
      return (C[j] = { color: ag, alpha: Z });
    }
    var o = {
      style: "normal",
      variant: "normal",
      weight: "normal",
      size: 10,
      family: "sans-serif"
    };
    var L = {};
    function E(i) {
      if (L[i]) {
        return L[i];
      }
      var p = document.createElement("div");
      var m = p.style;
      try {
        m.font = i;
      } catch (j) {}
      return (L[i] = {
        style: m.fontStyle || o.style,
        variant: m.fontVariant || o.variant,
        weight: m.fontWeight || o.weight,
        size: m.fontSize || o.size,
        family: m.fontFamily || o.family
      });
    }
    function u(m, j) {
      var i = {};
      for (var ah in m) {
        i[ah] = m[ah];
      }
      var ag = parseFloat(j.currentStyle.fontSize),
        Z = parseFloat(m.size);
      if (typeof m.size == "number") {
        i.size = m.size;
      } else {
        if (m.size.indexOf("px") != -1) {
          i.size = Z;
        } else {
          if (m.size.indexOf("em") != -1) {
            i.size = ag * Z;
          } else {
            if (m.size.indexOf("%") != -1) {
              i.size = (ag / 100) * Z;
            } else {
              if (m.size.indexOf("pt") != -1) {
                i.size = Z / 0.75;
              } else {
                i.size = ag;
              }
            }
          }
        }
      }
      i.size *= 0.981;
      return i;
    }
    function ac(i) {
      return (
        i.style +
        " " +
        i.variant +
        " " +
        i.weight +
        " " +
        i.size +
        "px " +
        i.family
      );
    }
    var s = { butt: "flat", round: "round" };
    function S(i) {
      return s[i] || "square";
    }
    function D(i) {
      this.m_ = B();
      this.mStack_ = [];
      this.aStack_ = [];
      this.currentPath_ = [];
      this.strokeStyle = "#000";
      this.fillStyle = "#000";
      this.lineWidth = 1;
      this.lineJoin = "miter";
      this.lineDash = [];
      this.lineCap = "butt";
      this.miterLimit = d * 1;
      this.globalAlpha = 1;
      this.font = "10px sans-serif";
      this.textAlign = "left";
      this.textBaseline = "alphabetic";
      this.canvas = i;
      var m =
        "width:" +
        i.clientWidth +
        "px;height:" +
        i.clientHeight +
        "px;overflow:hidden;position:absolute";
      var j = i.ownerDocument.createElement("div");
      j.style.cssText = m;
      i.appendChild(j);
      var p = j.cloneNode(false);
      p.style.backgroundColor = "red";
      p.style.filter = "alpha(opacity=0)";
      i.appendChild(p);
      this.element_ = j;
      this.arcScaleX_ = 1;
      this.arcScaleY_ = 1;
      this.lineScale_ = 1;
    }
    var q = D.prototype;
    q.clearRect = function () {
      if (this.textMeasureEl_) {
        this.textMeasureEl_.removeNode(true);
        this.textMeasureEl_ = null;
      }
      this.element_.innerHTML = "";
    };
    q.beginPath = function () {
      this.currentPath_ = [];
    };
    q.moveTo = function (j, i) {
      var m = V(this, j, i);
      this.currentPath_.push({ type: "moveTo", x: m.x, y: m.y });
      this.currentX_ = m.x;
      this.currentY_ = m.y;
    };
    q.lineTo = function (j, i) {
      var m = V(this, j, i);
      this.currentPath_.push({ type: "lineTo", x: m.x, y: m.y });
      this.currentX_ = m.x;
      this.currentY_ = m.y;
    };
    q.bezierCurveTo = function (m, j, ak, aj, ai, ag) {
      var i = V(this, ai, ag);
      var ah = V(this, m, j);
      var Z = V(this, ak, aj);
      K(this, ah, Z, i);
    };
    function K(i, Z, m, j) {
      i.currentPath_.push({
        type: "bezierCurveTo",
        cp1x: Z.x,
        cp1y: Z.y,
        cp2x: m.x,
        cp2y: m.y,
        x: j.x,
        y: j.y
      });
      i.currentX_ = j.x;
      i.currentY_ = j.y;
    }
    q.quadraticCurveTo = function (ai, m, j, i) {
      var ah = V(this, ai, m);
      var ag = V(this, j, i);
      var aj = {
        x: this.currentX_ + (2 / 3) * (ah.x - this.currentX_),
        y: this.currentY_ + (2 / 3) * (ah.y - this.currentY_)
      };
      var Z = {
        x: aj.x + (ag.x - this.currentX_) / 3,
        y: aj.y + (ag.y - this.currentY_) / 3
      };
      K(this, aj, Z, ag);
    };
    q.arc = function (al, aj, ak, ag, j, m) {
      ak *= d;
      var ap = m ? "at" : "wa";
      var am = al + A(ag) * ak - f;
      var ao = aj + l(ag) * ak - f;
      var i = al + A(j) * ak - f;
      var an = aj + l(j) * ak - f;
      if (am == i && !m) {
        am += 0.125;
      }
      var Z = V(this, al, aj);
      var ai = V(this, am, ao);
      var ah = V(this, i, an);
      this.currentPath_.push({
        type: ap,
        x: Z.x,
        y: Z.y,
        radius: ak,
        xStart: ai.x,
        yStart: ai.y,
        xEnd: ah.x,
        yEnd: ah.y
      });
    };
    q.rect = function (m, j, i, p) {
      this.moveTo(m, j);
      this.lineTo(m + i, j);
      this.lineTo(m + i, j + p);
      this.lineTo(m, j + p);
      this.closePath();
    };
    q.strokeRect = function (m, j, i, p) {
      var Z = this.currentPath_;
      this.beginPath();
      this.moveTo(m, j);
      this.lineTo(m + i, j);
      this.lineTo(m + i, j + p);
      this.lineTo(m, j + p);
      this.closePath();
      this.stroke();
      this.currentPath_ = Z;
    };
    q.fillRect = function (m, j, i, p) {
      var Z = this.currentPath_;
      this.beginPath();
      this.moveTo(m, j);
      this.lineTo(m + i, j);
      this.lineTo(m + i, j + p);
      this.lineTo(m, j + p);
      this.closePath();
      this.fill();
      this.currentPath_ = Z;
    };
    q.createLinearGradient = function (j, p, i, m) {
      var Z = new U("gradient");
      Z.x0_ = j;
      Z.y0_ = p;
      Z.x1_ = i;
      Z.y1_ = m;
      return Z;
    };
    q.createRadialGradient = function (p, ag, m, j, Z, i) {
      var ah = new U("gradientradial");
      ah.x0_ = p;
      ah.y0_ = ag;
      ah.r0_ = m;
      ah.x1_ = j;
      ah.y1_ = Z;
      ah.r1_ = i;
      return ah;
    };
    q.drawImage = function (an, j) {
      var ah, Z, aj, ar, al, ak, ao, av;
      var ai = an.runtimeStyle.width;
      var am = an.runtimeStyle.height;
      an.runtimeStyle.width = "auto";
      an.runtimeStyle.height = "auto";
      var ag = an.width;
      var aq = an.height;
      an.runtimeStyle.width = ai;
      an.runtimeStyle.height = am;
      if (arguments.length == 3) {
        ah = arguments[1];
        Z = arguments[2];
        al = ak = 0;
        ao = aj = ag;
        av = ar = aq;
      } else {
        if (arguments.length == 5) {
          ah = arguments[1];
          Z = arguments[2];
          aj = arguments[3];
          ar = arguments[4];
          al = ak = 0;
          ao = ag;
          av = aq;
        } else {
          if (arguments.length == 9) {
            al = arguments[1];
            ak = arguments[2];
            ao = arguments[3];
            av = arguments[4];
            ah = arguments[5];
            Z = arguments[6];
            aj = arguments[7];
            ar = arguments[8];
          } else {
            throw Error("Invalid number of arguments");
          }
        }
      }
      var au = V(this, ah, Z);
      var at = [];
      var i = 10;
      var p = 10;
      var ap = this.m_;
      at.push(
        " <g_vml_:group",
        ' coordsize="',
        d * i,
        ",",
        d * p,
        '"',
        ' coordorigin="0,0"',
        ' style="width:',
        n(i * ap[0][0]),
        "px;height:",
        n(p * ap[1][1]),
        "px;position:absolute;",
        "top:",
        n(au.y / d),
        "px;left:",
        n(au.x / d),
        "px; rotation:",
        n((Math.atan(ap[0][1] / ap[1][1]) * 180) / Math.PI),
        ";"
      );
      at.push(
        '" >',
        '<g_vml_:image src="',
        an.src,
        '"',
        ' style="width:',
        d * aj,
        "px;",
        " height:",
        d * ar,
        'px"',
        ' cropleft="',
        al / ag,
        '"',
        ' croptop="',
        ak / aq,
        '"',
        ' cropright="',
        (ag - al - ao) / ag,
        '"',
        ' cropbottom="',
        (aq - ak - av) / aq,
        '"',
        " />",
        "</g_vml_:group>"
      );
      this.element_.insertAdjacentHTML("BeforeEnd", at.join(""));
    };
    q.setLineDash = function (i) {
      if (i.length === 1) {
        i = i.slice();
        i[1] = i[0];
      }
      this.lineDash = i;
    };
    q.getLineDash = function () {
      return this.lineDash;
    };
    q.stroke = function (ak) {
      var ai = [];
      var m = 10;
      var al = 10;
      ai.push(
        "<g_vml_:shape",
        ' filled="',
        !!ak,
        '"',
        ' style="position:absolute;width:',
        m,
        "px;height:",
        al,
        'px;left:0px;top:0px;"',
        ' coordorigin="0,0"',
        ' coordsize="',
        d * m,
        ",",
        d * al,
        '"',
        ' stroked="',
        !ak,
        '"',
        ' path="'
      );
      var Z = { x: null, y: null };
      var aj = { x: null, y: null };
      for (var ag = 0; ag < this.currentPath_.length; ag++) {
        var j = this.currentPath_[ag];
        var ah;
        switch (j.type) {
          case "moveTo":
            ah = j;
            ai.push(" m ", n(j.x), ",", n(j.y));
            break;
          case "lineTo":
            ai.push(" l ", n(j.x), ",", n(j.y));
            break;
          case "close":
            ai.push(" x ");
            j = null;
            break;
          case "bezierCurveTo":
            ai.push(
              " c ",
              n(j.cp1x),
              ",",
              n(j.cp1y),
              ",",
              n(j.cp2x),
              ",",
              n(j.cp2y),
              ",",
              n(j.x),
              ",",
              n(j.y)
            );
            break;
          case "at":
          case "wa":
            ai.push(
              " ",
              j.type,
              " ",
              n(j.x - this.arcScaleX_ * j.radius),
              ",",
              n(j.y - this.arcScaleY_ * j.radius),
              " ",
              n(j.x + this.arcScaleX_ * j.radius),
              ",",
              n(j.y + this.arcScaleY_ * j.radius),
              " ",
              n(j.xStart),
              ",",
              n(j.yStart),
              " ",
              n(j.xEnd),
              ",",
              n(j.yEnd)
            );
            break;
        }
        if (j) {
          if (Z.x == null || j.x < Z.x) {
            Z.x = j.x;
          }
          if (aj.x == null || j.x > aj.x) {
            aj.x = j.x;
          }
          if (Z.y == null || j.y < Z.y) {
            Z.y = j.y;
          }
          if (aj.y == null || j.y > aj.y) {
            aj.y = j.y;
          }
        }
      }
      ai.push(' ">');
      if (!ak) {
        w(this, ai);
      } else {
        G(this, ai, Z, aj);
      }
      ai.push("</g_vml_:shape>");
      this.element_.insertAdjacentHTML("beforeEnd", ai.join(""));
    };
    function w(m, ag) {
      var j = F(m.strokeStyle);
      var p = j.color;
      var Z = j.alpha * m.globalAlpha;
      var i = m.lineScale_ * m.lineWidth;
      if (i < 1) {
        Z *= i;
      }
      ag.push(
        "<g_vml_:stroke",
        ' opacity="',
        Z,
        '"',
        ' joinstyle="',
        m.lineJoin,
        '"',
        ' dashstyle="',
        m.lineDash.join(" "),
        '"',
        ' miterlimit="',
        m.miterLimit,
        '"',
        ' endcap="',
        S(m.lineCap),
        '"',
        ' weight="',
        i,
        'px"',
        ' color="',
        p,
        '" />'
      );
    }
    function G(aq, ai, aK, ar) {
      var aj = aq.fillStyle;
      var aB = aq.arcScaleX_;
      var aA = aq.arcScaleY_;
      var j = ar.x - aK.x;
      var p = ar.y - aK.y;
      if (aj instanceof U) {
        var an = 0;
        var aF = { x: 0, y: 0 };
        var ax = 0;
        var am = 1;
        if (aj.type_ == "gradient") {
          var al = aj.x0_ / aB;
          var m = aj.y0_ / aA;
          var ak = aj.x1_ / aB;
          var aM = aj.y1_ / aA;
          var aJ = V(aq, al, m);
          var aI = V(aq, ak, aM);
          var ag = aI.x - aJ.x;
          var Z = aI.y - aJ.y;
          an = (Math.atan2(ag, Z) * 180) / Math.PI;
          if (an < 0) {
            an += 360;
          }
          if (an < 0.000001) {
            an = 0;
          }
        } else {
          var aJ = V(aq, aj.x0_, aj.y0_);
          aF = { x: (aJ.x - aK.x) / j, y: (aJ.y - aK.y) / p };
          j /= aB * d;
          p /= aA * d;
          var aD = ab.max(j, p);
          ax = (2 * aj.r0_) / aD;
          am = (2 * aj.r1_) / aD - ax;
        }
        var av = aj.colors_;
        av.sort(function (aN, i) {
          return aN.offset - i.offset;
        });
        var ap = av.length;
        var au = av[0].color;
        var at = av[ap - 1].color;
        var az = av[0].alpha * aq.globalAlpha;
        var ay = av[ap - 1].alpha * aq.globalAlpha;
        var aE = [];
        for (var aH = 0; aH < ap; aH++) {
          var ao = av[aH];
          aE.push(ao.offset * am + ax + " " + ao.color);
        }
        ai.push(
          '<g_vml_:fill type="',
          aj.type_,
          '"',
          ' method="none" focus="100%"',
          ' color="',
          au,
          '"',
          ' color2="',
          at,
          '"',
          ' colors="',
          aE.join(","),
          '"',
          ' opacity="',
          ay,
          '"',
          ' g_o_:opacity2="',
          az,
          '"',
          ' angle="',
          an,
          '"',
          ' focusposition="',
          aF.x,
          ",",
          aF.y,
          '" />'
        );
      } else {
        if (aj instanceof T) {
          if (j && p) {
            var ah = -aK.x;
            var aC = -aK.y;
            ai.push(
              "<g_vml_:fill",
              ' position="',
              (ah / j) * aB * aB,
              ",",
              (aC / p) * aA * aA,
              '"',
              ' type="tile"',
              ' src="',
              aj.src_,
              '" />'
            );
          }
        } else {
          var aL = F(aq.fillStyle);
          var aw = aL.color;
          var aG = aL.alpha * aq.globalAlpha;
          ai.push('<g_vml_:fill color="', aw, '" opacity="', aG, '" />');
        }
      }
    }
    q.fill = function () {
      this.$stroke(true);
    };
    q.closePath = function () {
      this.currentPath_.push({ type: "close" });
    };
    function V(j, Z, p) {
      var i = j.m_;
      return {
        x: d * (Z * i[0][0] + p * i[1][0] + i[2][0]) - f,
        y: d * (Z * i[0][1] + p * i[1][1] + i[2][1]) - f
      };
    }
    q.save = function () {
      var i = {};
      v(this, i);
      this.aStack_.push(i);
      this.mStack_.push(this.m_);
    };
    q.restore = function () {
      if (this.aStack_.length) {
        v(this.aStack_.pop(), this);
        this.m_ = this.mStack_.pop();
      }
    };
    function h(i) {
      return (
        isFinite(i[0][0]) &&
        isFinite(i[0][1]) &&
        isFinite(i[1][0]) &&
        isFinite(i[1][1]) &&
        isFinite(i[2][0]) &&
        isFinite(i[2][1])
      );
    }
    function aa(j, i, p) {
      if (!h(i)) {
        return;
      }
      j.m_ = i;
      if (p) {
        var Z = i[0][0] * i[1][1] - i[0][1] * i[1][0];
        j.lineScale_ = N(H(Z));
      }
    }
    q.translate = function (m, j) {
      var i = [
        [1, 0, 0],
        [0, 1, 0],
        [m, j, 1]
      ];
      aa(this, J(i, this.m_), false);
    };
    q.rotate = function (j) {
      var p = A(j);
      var m = l(j);
      var i = [
        [p, m, 0],
        [-m, p, 0],
        [0, 0, 1]
      ];
      aa(this, J(i, this.m_), false);
    };
    q.scale = function (m, j) {
      this.arcScaleX_ *= m;
      this.arcScaleY_ *= j;
      var i = [
        [m, 0, 0],
        [0, j, 0],
        [0, 0, 1]
      ];
      aa(this, J(i, this.m_), true);
    };
    q.transform = function (Z, p, ah, ag, j, i) {
      var m = [
        [Z, p, 0],
        [ah, ag, 0],
        [j, i, 1]
      ];
      aa(this, J(m, this.m_), true);
    };
    q.setTransform = function (ag, Z, ai, ah, p, j) {
      var i = [
        [ag, Z, 0],
        [ai, ah, 0],
        [p, j, 1]
      ];
      aa(this, i, true);
    };
    q.drawText_ = function (am, ak, aj, ap, ai) {
      var ao = this.m_,
        at = 1000,
        j = 0,
        ar = at,
        ah = { x: 0, y: 0 },
        ag = [];
      var i = u(E(this.font), this.element_);
      var p = ac(i);
      var au = this.element_.currentStyle;
      var Z = this.textAlign.toLowerCase();
      switch (Z) {
        case "left":
        case "center":
        case "right":
          break;
        case "end":
          Z = au.direction == "ltr" ? "right" : "left";
          break;
        case "start":
          Z = au.direction == "rtl" ? "right" : "left";
          break;
        default:
          Z = "left";
      }
      switch (this.textBaseline) {
        case "hanging":
        case "top":
          ah.y = i.size / 1.75;
          break;
        case "middle":
          break;
        default:
        case null:
        case "alphabetic":
        case "ideographic":
        case "bottom":
          ah.y = -i.size / 3;
          break;
      }
      switch (Z) {
        case "right":
          j = at;
          ar = 0.05;
          break;
        case "center":
          j = ar = at / 2;
          break;
      }
      var aq = V(this, ak + ah.x, aj + ah.y);
      ag.push(
        '<g_vml_:line from="',
        -j,
        ' 0" to="',
        ar,
        ' 0.05" ',
        ' coordsize="100 100" coordorigin="0 0"',
        ' filled="',
        !ai,
        '" stroked="',
        !!ai,
        '" style="position:absolute;width:1px;height:1px;left:0px;top:0px;">'
      );
      if (ai) {
        w(this, ag);
      } else {
        G(this, ag, { x: -j, y: 0 }, { x: ar, y: i.size });
      }
      var an =
        ao[0][0].toFixed(3) +
        "," +
        ao[1][0].toFixed(3) +
        "," +
        ao[0][1].toFixed(3) +
        "," +
        ao[1][1].toFixed(3) +
        ",0,0";
      var al = n(aq.x / d) + "," + n(aq.y / d);
      ag.push(
        '<g_vml_:skew on="t" matrix="',
        an,
        '" ',
        ' offset="',
        al,
        '" origin="',
        j,
        ' 0" />',
        '<g_vml_:path textpathok="true" />',
        '<g_vml_:textpath on="true" string="',
        af(am),
        '" style="v-text-align:',
        Z,
        ";font:",
        af(p),
        '" /></g_vml_:line>'
      );
      this.element_.insertAdjacentHTML("beforeEnd", ag.join(""));
    };
    q.fillText = function (m, i, p, j) {
      this.drawText_(m, i, p, j, false);
    };
    q.strokeText = function (m, i, p, j) {
      this.drawText_(m, i, p, j, true);
    };
    q.measureText = function (m) {
      if (!this.textMeasureEl_) {
        var i =
          '<span style="position:absolute;top:-20000px;left:0;padding:0;margin:0;border:none;white-space:pre;"></span>';
        this.element_.insertAdjacentHTML("beforeEnd", i);
        this.textMeasureEl_ = this.element_.lastChild;
      }
      var j = this.element_.ownerDocument;
      this.textMeasureEl_.innerHTML = "";
      this.textMeasureEl_.style.font = this.font;
      this.textMeasureEl_.appendChild(j.createTextNode(m));
      return { width: this.textMeasureEl_.offsetWidth };
    };
    q.clip = function () {};
    q.arcTo = function () {};
    q.createPattern = function (j, i) {
      return new T(j, i);
    };
    function U(i) {
      this.type_ = i;
      this.x0_ = 0;
      this.y0_ = 0;
      this.r0_ = 0;
      this.x1_ = 0;
      this.y1_ = 0;
      this.r1_ = 0;
      this.colors_ = [];
    }
    U.prototype.addColorStop = function (j, i) {
      i = F(i);
      this.colors_.push({ offset: j, color: i.color, alpha: i.alpha });
    };
    function T(j, i) {
      Q(j);
      switch (i) {
        case "repeat":
        case null:
        case "":
          this.repetition_ = "repeat";
          break;
        case "repeat-x":
        case "repeat-y":
        case "no-repeat":
          this.repetition_ = i;
          break;
        default:
          O("SYNTAX_ERR");
      }
      this.src_ = j.src;
      this.width_ = j.width;
      this.height_ = j.height;
    }
    function O(i) {
      throw new P(i);
    }
    function Q(i) {
      if (!i || i.nodeType != 1 || i.tagName != "IMG") {
        O("TYPE_MISMATCH_ERR");
      }
      if (i.readyState != "complete") {
        O("INVALID_STATE_ERR");
      }
    }
    function P(i) {
      this.code = this[i];
      this.message = i + ": DOM Exception " + this.code;
    }
    var X = (P.prototype = new Error());
    X.INDEX_SIZE_ERR = 1;
    X.DOMSTRING_SIZE_ERR = 2;
    X.HIERARCHY_REQUEST_ERR = 3;
    X.WRONG_DOCUMENT_ERR = 4;
    X.INVALID_CHARACTER_ERR = 5;
    X.NO_DATA_ALLOWED_ERR = 6;
    X.NO_MODIFICATION_ALLOWED_ERR = 7;
    X.NOT_FOUND_ERR = 8;
    X.NOT_SUPPORTED_ERR = 9;
    X.INUSE_ATTRIBUTE_ERR = 10;
    X.INVALID_STATE_ERR = 11;
    X.SYNTAX_ERR = 12;
    X.INVALID_MODIFICATION_ERR = 13;
    X.NAMESPACE_ERR = 14;
    X.INVALID_ACCESS_ERR = 15;
    X.VALIDATION_ERR = 16;
    X.TYPE_MISMATCH_ERR = 17;
    G_vmlCanvasManager = e;
    CanvasRenderingContext2D = D;
    CanvasGradient = U;
    CanvasPattern = T;
    DOMException = P;
  })();
}
Ext.define(
  "Ext.draw.engine.Canvas",
  {
    extend: "Ext.draw.Surface",
    isCanvas: true,
    requires: [
      "Ext.draw.engine.excanvas",
      "Ext.draw.Animator",
      "Ext.draw.Color"
    ],
    config: { highPrecision: false },
    statics: {
      contextOverrides: {
        setGradientBBox: function (a) {
          this.bbox = a;
        },
        fill: function () {
          var c = this.fillStyle,
            a = this.fillGradient,
            b = this.fillOpacity,
            d = this.globalAlpha,
            e = this.bbox;
          if (c !== Ext.util.Color.RGBA_NONE && b !== 0) {
            if (a && e) {
              this.fillStyle = a.generateGradient(this, e);
            }
            if (b !== 1) {
              this.globalAlpha = d * b;
            }
            this.$fill();
            if (b !== 1) {
              this.globalAlpha = d;
            }
            if (a && e) {
              this.fillStyle = c;
            }
          }
        },
        stroke: function () {
          var e = this.strokeStyle,
            c = this.strokeGradient,
            a = this.strokeOpacity,
            b = this.globalAlpha,
            d = this.bbox;
          if (e !== Ext.util.Color.RGBA_NONE && a !== 0) {
            if (c && d) {
              this.strokeStyle = c.generateGradient(this, d);
            }
            if (a !== 1) {
              this.globalAlpha = b * a;
            }
            this.$stroke();
            if (a !== 1) {
              this.globalAlpha = b;
            }
            if (c && d) {
              this.strokeStyle = e;
            }
          }
        },
        fillStroke: function (d, e) {
          var j = this,
            i = this.fillStyle,
            h = this.fillOpacity,
            f = this.strokeStyle,
            c = this.strokeOpacity,
            b = j.shadowColor,
            a = j.shadowBlur,
            g = Ext.util.Color.RGBA_NONE;
          if (e === undefined) {
            e = d.transformFillStroke;
          }
          if (!e) {
            d.inverseMatrix.toContext(j);
          }
          if (i !== g && h !== 0) {
            j.fill();
            j.shadowColor = g;
            j.shadowBlur = 0;
          }
          if (f !== g && c !== 0) {
            j.stroke();
          }
          j.shadowColor = b;
          j.shadowBlur = a;
        },
        setLineDash: function (a) {
          if (this.$setLineDash) {
            this.$setLineDash(a);
          }
        },
        getLineDash: function () {
          if (this.$getLineDash) {
            return this.$getLineDash();
          }
        },
        ellipse: function (g, e, c, a, j, b, f, d) {
          var i = Math.cos(j),
            h = Math.sin(j);
          this.transform(i * c, h * c, -h * a, i * a, g, e);
          this.arc(0, 0, 1, b, f, d);
          this.transform(
            i / c,
            -h / a,
            h / c,
            i / a,
            -(i * g + h * e) / c,
            (h * g - i * e) / a
          );
        },
        appendPath: function (f) {
          var e = this,
            c = 0,
            b = 0,
            a = f.commands,
            g = f.params,
            d = a.length;
          e.beginPath();
          for (; c < d; c++) {
            switch (a[c]) {
              case "M":
                e.moveTo(g[b], g[b + 1]);
                b += 2;
                break;
              case "L":
                e.lineTo(g[b], g[b + 1]);
                b += 2;
                break;
              case "C":
                e.bezierCurveTo(
                  g[b],
                  g[b + 1],
                  g[b + 2],
                  g[b + 3],
                  g[b + 4],
                  g[b + 5]
                );
                b += 6;
                break;
              case "Z":
                e.closePath();
                break;
            }
          }
        },
        save: function () {
          var c = this.toSave,
            d = c.length,
            e = d && {},
            b = 0,
            a;
          for (; b < d; b++) {
            a = c[b];
            if (a in this) {
              e[a] = this[a];
            }
          }
          this.state.push(e);
          this.$save();
        },
        restore: function () {
          var b = this.state.pop(),
            a;
          if (b) {
            for (a in b) {
              this[a] = b[a];
            }
          }
          this.$restore();
        }
      }
    },
    splitThreshold: 3000,
    toSave: ["fillGradient", "strokeGradient"],
    element: {
      reference: "element",
      children: [
        {
          reference: "innerElement",
          style: { width: "100%", height: "100%", position: "relative" }
        }
      ]
    },
    createCanvas: function () {
      var c = Ext.Element.create({
        tag: "canvas",
        cls: Ext.baseCSSPrefix + "surface-canvas"
      });
      if (window.G_vmlCanvasManager) {
        G_vmlCanvasManager.initElement(c.dom);
        this.isVML = true;
      }
      var d = Ext.draw.engine.Canvas.contextOverrides,
        a = c.dom.getContext("2d"),
        b;
      if (a.ellipse) {
        delete d.ellipse;
      }
      a.state = [];
      a.toSave = this.toSave;
      for (b in d) {
        a["$" + b] = a[b];
      }
      Ext.apply(a, d);
      if (this.getHighPrecision()) {
        this.enablePrecisionCompensation(a);
      } else {
        this.disablePrecisionCompensation(a);
      }
      this.innerElement.appendChild(c);
      this.canvases.push(c);
      this.contexts.push(a);
    },
    updateHighPrecision: function (d) {
      var e = this.contexts,
        c = e.length,
        b,
        a;
      for (b = 0; b < c; b++) {
        a = e[b];
        if (d) {
          this.enablePrecisionCompensation(a);
        } else {
          this.disablePrecisionCompensation(a);
        }
      }
    },
    precisionNames: [
      "rect",
      "fillRect",
      "strokeRect",
      "clearRect",
      "moveTo",
      "lineTo",
      "arc",
      "arcTo",
      "save",
      "restore",
      "updatePrecisionCompensate",
      "setTransform",
      "transform",
      "scale",
      "translate",
      "rotate",
      "quadraticCurveTo",
      "bezierCurveTo",
      "createLinearGradient",
      "createRadialGradient",
      "fillText",
      "strokeText",
      "drawImage"
    ],
    disablePrecisionCompensation: function (b) {
      var a = Ext.draw.engine.Canvas.contextOverrides,
        f = this.precisionNames,
        e = f.length,
        d,
        c;
      for (d = 0; d < e; d++) {
        c = f[d];
        if (!(c in a)) {
          delete b[c];
        }
      }
      this.setDirty(true);
    },
    enablePrecisionCompensation: function (j) {
      var c = this,
        a = 1,
        g = 1,
        l = 0,
        k = 0,
        i = new Ext.draw.Matrix(),
        b = [],
        e = {},
        d = Ext.draw.engine.Canvas.contextOverrides,
        h = j.constructor.prototype;
      var f = {
        toSave: c.toSave,
        rect: function (m, p, n, o) {
          return h.rect.call(this, m * a + l, p * g + k, n * a, o * g);
        },
        fillRect: function (m, p, n, o) {
          this.updatePrecisionCompensateRect();
          h.fillRect.call(this, m * a + l, p * g + k, n * a, o * g);
          this.updatePrecisionCompensate();
        },
        strokeRect: function (m, p, n, o) {
          this.updatePrecisionCompensateRect();
          h.strokeRect.call(this, m * a + l, p * g + k, n * a, o * g);
          this.updatePrecisionCompensate();
        },
        clearRect: function (m, p, n, o) {
          return h.clearRect.call(this, m * a + l, p * g + k, n * a, o * g);
        },
        moveTo: function (m, n) {
          return h.moveTo.call(this, m * a + l, n * g + k);
        },
        lineTo: function (m, n) {
          return h.lineTo.call(this, m * a + l, n * g + k);
        },
        arc: function (n, r, m, p, o, q) {
          this.updatePrecisionCompensateRect();
          h.arc.call(this, n * a + l, r * a + k, m * a, p, o, q);
          this.updatePrecisionCompensate();
        },
        arcTo: function (o, q, n, p, m) {
          this.updatePrecisionCompensateRect();
          h.arcTo.call(this, o * a + l, q * g + k, n * a + l, p * g + k, m * a);
          this.updatePrecisionCompensate();
        },
        save: function () {
          b.push(i);
          i = i.clone();
          d.save.call(this);
          h.save.call(this);
        },
        restore: function () {
          i = b.pop();
          d.restore.call(this);
          h.restore.call(this);
          this.updatePrecisionCompensate();
        },
        updatePrecisionCompensate: function () {
          i.precisionCompensate(c.devicePixelRatio, e);
          a = e.xx;
          g = e.yy;
          l = e.dx;
          k = e.dy;
          h.setTransform.call(this, c.devicePixelRatio, e.b, e.c, e.d, 0, 0);
        },
        updatePrecisionCompensateRect: function () {
          i.precisionCompensateRect(c.devicePixelRatio, e);
          a = e.xx;
          g = e.yy;
          l = e.dx;
          k = e.dy;
          h.setTransform.call(this, c.devicePixelRatio, e.b, e.c, e.d, 0, 0);
        },
        setTransform: function (q, o, n, m, r, p) {
          i.set(q, o, n, m, r, p);
          this.updatePrecisionCompensate();
        },
        transform: function (q, o, n, m, r, p) {
          i.append(q, o, n, m, r, p);
          this.updatePrecisionCompensate();
        },
        scale: function (n, m) {
          this.transform(n, 0, 0, m, 0, 0);
        },
        translate: function (n, m) {
          this.transform(1, 0, 0, 1, n, m);
        },
        rotate: function (o) {
          var n = Math.cos(o),
            m = Math.sin(o);
          this.transform(n, m, -m, n, 0, 0);
        },
        quadraticCurveTo: function (n, p, m, o) {
          h.quadraticCurveTo.call(
            this,
            n * a + l,
            p * g + k,
            m * a + l,
            o * g + k
          );
        },
        bezierCurveTo: function (r, p, o, n, m, q) {
          h.bezierCurveTo.call(
            this,
            r * a + l,
            p * g + k,
            o * a + l,
            n * g + k,
            m * a + l,
            q * g + k
          );
        },
        createLinearGradient: function (n, p, m, o) {
          this.updatePrecisionCompensateRect();
          var q = h.createLinearGradient.call(
            this,
            n * a + l,
            p * g + k,
            m * a + l,
            o * g + k
          );
          this.updatePrecisionCompensate();
          return q;
        },
        createRadialGradient: function (p, r, o, n, q, m) {
          this.updatePrecisionCompensateRect();
          var s = h.createLinearGradient.call(
            this,
            p * a + l,
            r * a + k,
            o * a,
            n * a + l,
            q * a + k,
            m * a
          );
          this.updatePrecisionCompensate();
          return s;
        },
        fillText: function (o, m, p, n) {
          h.setTransform.apply(this, i.elements);
          if (typeof n === "undefined") {
            h.fillText.call(this, o, m, p);
          } else {
            h.fillText.call(this, o, m, p, n);
          }
          this.updatePrecisionCompensate();
        },
        strokeText: function (o, m, p, n) {
          h.setTransform.apply(this, i.elements);
          if (typeof n === "undefined") {
            h.strokeText.call(this, o, m, p);
          } else {
            h.strokeText.call(this, o, m, p, n);
          }
          this.updatePrecisionCompensate();
        },
        fill: function () {
          var m = this.fillGradient,
            n = this.bbox;
          this.updatePrecisionCompensateRect();
          if (m && n) {
            this.fillStyle = m.generateGradient(this, n);
          }
          h.fill.call(this);
          this.updatePrecisionCompensate();
        },
        stroke: function () {
          var m = this.strokeGradient,
            n = this.bbox;
          this.updatePrecisionCompensateRect();
          if (m && n) {
            this.strokeStyle = m.generateGradient(this, n);
          }
          h.stroke.call(this);
          this.updatePrecisionCompensate();
        },
        drawImage: function (u, s, r, q, p, o, n, m, t) {
          switch (arguments.length) {
            case 3:
              return h.drawImage.call(this, u, s * a + l, r * g + k);
            case 5:
              return h.drawImage.call(
                this,
                u,
                s * a + l,
                r * g + k,
                q * a,
                p * g
              );
            case 9:
              return h.drawImage.call(
                this,
                u,
                s,
                r,
                q,
                p,
                o * a + l,
                n * g * k,
                m * a,
                t * g
              );
          }
        }
      };
      Ext.apply(j, f);
      this.setDirty(true);
    },
    updateRect: function (a) {
      this.callParent([a]);
      var C = this,
        p = Math.floor(a[0]),
        e = Math.floor(a[1]),
        g = Math.ceil(a[0] + a[2]),
        B = Math.ceil(a[1] + a[3]),
        u = C.devicePixelRatio,
        D = C.canvases,
        d = g - p,
        y = B - e,
        n = Math.round(C.splitThreshold / u),
        c = (C.xSplits = Math.ceil(d / n)),
        f = (C.ySplits = Math.ceil(y / n)),
        v,
        s,
        q,
        A,
        z,
        x,
        o,
        m;
      for (s = 0, z = 0; s < f; s++, z += n) {
        for (v = 0, A = 0; v < c; v++, A += n) {
          q = s * c + v;
          if (q >= D.length) {
            C.createCanvas();
          }
          x = D[q].dom;
          x.style.left = A + "px";
          x.style.top = z + "px";
          m = Math.min(n, y - z);
          if (m * u !== x.height) {
            x.height = m * u;
            x.style.height = m + "px";
          }
          o = Math.min(n, d - A);
          if (o * u !== x.width) {
            x.width = o * u;
            x.style.width = o + "px";
          }
          C.applyDefaults(C.contexts[q]);
        }
      }
      C.activeCanvases = q = c * f;
      while (D.length > q) {
        D.pop().destroy();
      }
      C.clear();
    },
    clearTransform: function () {
      var f = this,
        a = f.xSplits,
        g = f.ySplits,
        d = f.contexts,
        h = f.splitThreshold,
        l = f.devicePixelRatio,
        e,
        c,
        b,
        m;
      for (e = 0; e < a; e++) {
        for (c = 0; c < g; c++) {
          b = c * a + e;
          m = d[b];
          m.translate(-h * e, -h * c);
          m.scale(l, l);
          f.matrix.toContext(m);
        }
      }
    },
    renderSprite: function (q) {
      var C = this,
        b = C.getRect(),
        e = C.matrix,
        g = q.getParent(),
        v = Ext.draw.Matrix.fly([1, 0, 0, 1, 0, 0]),
        p = C.splitThreshold / C.devicePixelRatio,
        c = C.xSplits,
        m = C.ySplits,
        A,
        z,
        s,
        a,
        r,
        o,
        d = 0,
        B,
        n = 0,
        f,
        l = b[2],
        y = b[3],
        x,
        u,
        t;
      while (g && g.isSprite) {
        v.prependMatrix(g.matrix || (g.attr && g.attr.matrix));
        g = g.getParent();
      }
      v.prependMatrix(e);
      a = q.getBBox();
      if (a) {
        a = v.transformBBox(a);
      }
      q.preRender(C);
      if (q.attr.hidden || q.attr.globalAlpha === 0) {
        q.setDirty(false);
        return;
      }
      for (u = 0, z = 0; u < m; u++, z += p) {
        for (x = 0, A = 0; x < c; x++, A += p) {
          t = u * c + x;
          s = C.contexts[t];
          r = Math.min(p, l - A);
          o = Math.min(p, y - z);
          d = A;
          B = d + r;
          n = z;
          f = n + o;
          if (a) {
            if (a.x > B || a.x + a.width < d || a.y > f || a.y + a.height < n) {
              continue;
            }
          }
          s.save();
          q.useAttributes(s, b);
          if (false === q.render(C, s, [d, n, r, o])) {
            return false;
          }
          s.restore();
        }
      }
      q.setDirty(false);
    },
    flatten: function (n, a) {
      var k = document.createElement("canvas"),
        f = Ext.getClassName(this),
        g = this.devicePixelRatio,
        l = k.getContext("2d"),
        b,
        c,
        h,
        e,
        d,
        m;
      k.width = Math.ceil(n.width * g);
      k.height = Math.ceil(n.height * g);
      for (e = 0; e < a.length; e++) {
        b = a[e];
        if (Ext.getClassName(b) !== f) {
          continue;
        }
        h = b.getRect();
        for (d = 0; d < b.canvases.length; d++) {
          c = b.canvases[d];
          m = c.getOffsetsTo(c.getParent());
          l.drawImage(c.dom, (h[0] + m[0]) * g, (h[1] + m[1]) * g);
        }
      }
      return { data: k.toDataURL(), type: "png" };
    },
    applyDefaults: function (a) {
      var b = Ext.util.Color.RGBA_NONE;
      a.strokeStyle = b;
      a.fillStyle = b;
      a.textAlign = "start";
      a.textBaseline = "alphabetic";
      a.miterLimit = 1;
    },
    clear: function () {
      var d = this,
        e = d.activeCanvases,
        c,
        b,
        a;
      for (c = 0; c < e; c++) {
        b = d.canvases[c].dom;
        a = d.contexts[c];
        a.setTransform(1, 0, 0, 1, 0, 0);
        a.clearRect(0, 0, b.width, b.height);
      }
      d.setDirty(true);
    },
    destroy: function () {
      var d = this,
        c = d.canvases,
        b = c.length,
        a;
      for (a = 0; a < b; a++) {
        d.contexts[a] = null;
        c[a].destroy();
        c[a] = null;
      }
      d.contexts = d.canvases = null;
      d.callParent();
    },
    privates: {
      initElement: function () {
        var a = this;
        a.callParent();
        a.canvases = [];
        a.contexts = [];
        a.activeCanvases = a.xSplits = a.ySplits = 0;
      }
    }
  },
  function () {
    var c = this,
      b = c.prototype,
      a = 10000000000;
    if (Ext.os.is.Android4 && Ext.browser.is.Chrome) {
      a = 3000;
    } else {
      if (Ext.is.iOS) {
        a = 2200;
      }
    }
    b.splitThreshold = a;
  }
);
Ext.define(
  "Ext.draw.Container",
  {
    extend: "Ext.draw.ContainerBase",
    alternateClassName: "Ext.draw.Component",
    xtype: "draw",
    defaultType: "surface",
    isDrawContainer: true,
    requires: [
      "Ext.draw.Surface",
      "Ext.draw.engine.Svg",
      "Ext.draw.engine.Canvas",
      "Ext.draw.gradient.GradientDefinition"
    ],
    engine: "Ext.draw.engine.Canvas",
    config: {
      cls: Ext.baseCSSPrefix + "draw-container",
      resizeHandler: null,
      sprites: null,
      gradients: [],
      touchAction: {
        panX: false,
        panY: false,
        pinchZoom: false,
        doubleTapZoom: false
      }
    },
    defaultDownloadServerUrl: "http://svg.sencha.io",
    supportedFormats: ["png", "pdf", "jpeg", "gif"],
    supportedOptions: {
      version: Ext.isNumber,
      data: Ext.isString,
      format: function (a) {
        return Ext.Array.indexOf(this.supportedFormats, a) >= 0;
      },
      filename: Ext.isString,
      width: Ext.isNumber,
      height: Ext.isNumber,
      scale: Ext.isNumber,
      pdf: Ext.isObject,
      jpeg: Ext.isObject
    },
    initAnimator: function () {
      this.frameCallbackId = Ext.draw.Animator.addFrameCallback(
        "renderFrame",
        this
      );
    },
    applyGradients: function (b) {
      var a = [],
        c,
        f,
        d,
        e;
      if (!Ext.isArray(b)) {
        return a;
      }
      for (c = 0, f = b.length; c < f; c++) {
        d = b[c];
        if (!Ext.isObject(d)) {
          continue;
        }
        if (typeof d.type !== "string") {
          d.type = "linear";
        }
        if (d.angle) {
          d.degrees = d.angle;
          delete d.angle;
        }
        if (Ext.isObject(d.stops)) {
          d.stops = (function (i) {
            var g = [],
              h;
            for (e in i) {
              h = i[e];
              h.offset = e / 100;
              g.push(h);
            }
            return g;
          })(d.stops);
        }
        a.push(d);
      }
      Ext.draw.gradient.GradientDefinition.add(a);
      return a;
    },
    applySprites: function (f) {
      if (!f) {
        return;
      }
      f = Ext.Array.from(f);
      var e = f.length,
        b = [],
        d,
        a,
        c;
      for (d = 0; d < e; d++) {
        c = f[d];
        a = c.surface;
        if (!(a && a.isSurface)) {
          if (Ext.isString(a)) {
            a = this.getSurface(a);
            delete c.surface;
          } else {
            a = this.getSurface("main");
          }
        }
        c = a.add(c);
        b.push(c);
      }
      return b;
    },
    resizeDelay: 500,
    resizeTimerId: 0,
    handleResize: function (d, b) {
      var f = this,
        e = f.element,
        c = f.getResizeHandler() || f.defaultResizeHandler,
        a;
      if (!e) {
        return;
      }
      d = d || e.getSize();
      if (!(d.width && d.height)) {
        return;
      }
      clearTimeout(f.resizeTimerId);
      if (!b) {
        f.resizeTimerId = Ext.defer(f.handleResize, f.resizeDelay, f, [
          d,
          true
        ]);
        return;
      } else {
        f.resizeTimerId = 0;
      }
      f.fireEvent("bodyresize", f, d);
      a = c.call(f, d);
      if (a !== false) {
        f.renderFrame();
      }
    },
    defaultResizeHandler: function (a) {
      this.getItems().each(function (b) {
        b.setRect([0, 0, a.width, a.height]);
      });
    },
    getSurface: function (e) {
      var d = this,
        b = d.getItems(),
        c = b.getCount(),
        a;
      a = d.createSurface(e);
      if (b.getCount() > c) {
        d.handleResize(null, true);
      }
      return a;
    },
    createSurface: function (d) {
      d = this.getId() + "-" + (d || "main");
      var c = this,
        b = c.getItems(),
        a = b.get(d);
      if (!a) {
        a = c.add({ xclass: c.engine, id: d });
      }
      return a;
    },
    renderFrame: function () {
      var e = this,
        a = e.getItems(),
        b,
        d,
        c;
      for (b = 0, d = a.length; b < d; b++) {
        c = a.items[b];
        if (c.isSurface) {
          c.renderFrame();
        }
      }
    },
    getImage: function (k) {
      var l = this.innerElement.getSize(),
        a = Array.prototype.slice.call(this.items.items),
        c = this.surfaceZIndexes,
        d,
        g,
        f,
        e,
        b,
        h;
      for (e = 1; e < a.length; e++) {
        b = a[e];
        h = c[b.type];
        f = e - 1;
        while (f >= 0 && c[a[f].type] > h) {
          a[f + 1] = a[f];
          f--;
        }
        a[f + 1] = b;
      }
      b = a[0];
      if ((Ext.isIE || Ext.isEdge) && b.isSVG) {
        d = { data: b.toSVG(l, a), type: "svg-markup" };
      } else {
        d = b.flatten(l, a);
        if (k === "image") {
          g = new Image();
          g.src = d.data;
          d.data = g;
          return d;
        }
        if (k === "stream") {
          d.data = d.data.replace(
            /^data:image\/[^;]+/,
            "data:application/octet-stream"
          );
          return d;
        }
      }
      return d;
    },
    download: function (d) {
      var e = this,
        a = [],
        b,
        c,
        f;
      if (Ext.isIE8) {
        return false;
      }
      d = Ext.apply({ version: 2, data: e.getImage().data }, d);
      for (c in d) {
        if (d.hasOwnProperty(c)) {
          f = d[c];
          if (c in e.supportedOptions) {
            if (e.supportedOptions[c].call(e, f)) {
              a.push({
                tag: "input",
                type: "hidden",
                name: c,
                value: Ext.String.htmlEncode(
                  Ext.isObject(f) ? Ext.JSON.encode(f) : f
                )
              });
            }
          }
        }
      }
      b = Ext.dom.Helper.markup({
        tag: "html",
        children: [
          { tag: "head" },
          {
            tag: "body",
            children: [
              {
                tag: "form",
                method: "POST",
                action: d.url || e.defaultDownloadServerUrl,
                children: a
              },
              {
                tag: "script",
                type: "text/javascript",
                children: 'document.getElementsByTagName("form")[0].submit();'
              }
            ]
          }
        ]
      });
      window.open("", "ImageDownload_" + Date.now()).document.write(b);
    },
    destroy: function () {
      var a = this,
        b = a.frameCallbackId;
      if (b) {
        Ext.draw.Animator.removeFrameCallback(b);
      }
      clearTimeout(a.resizeTimerId);
      a.resizeTimerId = 0;
      a.callParent();
    }
  },
  function () {
    if (location.search.match("svg")) {
      Ext.draw.Container.prototype.engine = "Ext.draw.engine.Svg";
    } else {
      if (
        (Ext.os.is.BlackBerry && Ext.os.version.getMajor() === 10) ||
        (Ext.browser.is.AndroidStock4 &&
          (Ext.os.version.getMinor() === 1 ||
            Ext.os.version.getMinor() === 2 ||
            Ext.os.version.getMinor() === 3))
      ) {
        Ext.draw.Container.prototype.engine = "Ext.draw.engine.Svg";
      }
    }
  }
);
Ext.define("Ext.chart.theme.Base", {
  mixins: { factoryable: "Ext.mixin.Factoryable" },
  requires: ["Ext.draw.Color"],
  factoryConfig: { type: "chart.theme" },
  isTheme: true,
  config: {
    baseColor: null,
    colors: undefined,
    gradients: null,
    chart: { defaults: { background: "white" } },
    axis: {
      defaults: {
        label: {
          x: 0,
          y: 0,
          textBaseline: "middle",
          textAlign: "center",
          fontSize: "default",
          fontFamily: "default",
          fontWeight: "default",
          fillStyle: "black"
        },
        title: {
          fillStyle: "black",
          fontSize: "default*1.23",
          fontFamily: "default",
          fontWeight: "default"
        },
        style: { strokeStyle: "black" },
        grid: { strokeStyle: "rgb(221, 221, 221)" }
      },
      top: { style: { textPadding: 5 } },
      bottom: { style: { textPadding: 5 } }
    },
    series: {
      defaults: {
        label: {
          fillStyle: "black",
          strokeStyle: "none",
          fontFamily: "default",
          fontWeight: "default",
          fontSize: "default*1.077",
          textBaseline: "middle",
          textAlign: "center"
        },
        labelOverflowPadding: 5
      }
    },
    sprites: {
      text: {
        fontSize: "default",
        fontWeight: "default",
        fontFamily: "default",
        fillStyle: "black"
      }
    },
    legend: {
      label: {
        fontSize: 14,
        fontWeight: "default",
        fontFamily: "default",
        fillStyle: "black"
      },
      border: {
        lineWidth: 1,
        radius: 4,
        fillStyle: "none",
        strokeStyle: "gray"
      },
      background: "white"
    },
    seriesThemes: undefined,
    markerThemes: {
      type: ["circle", "cross", "plus", "square", "triangle", "diamond"]
    },
    useGradients: false,
    background: null
  },
  colorDefaults: [
    "#94ae0a",
    "#115fa6",
    "#a61120",
    "#ff8809",
    "#ffd13e",
    "#a61187",
    "#24ad9a",
    "#7c7474",
    "#a66111"
  ],
  constructor: function (a) {
    this.initConfig(a);
    this.resolveDefaults();
  },
  defaultRegEx: /^default([+\-/\*]\d+(?:\.\d+)?)?$/,
  defaultOperators: {
    "*": function (b, a) {
      return b * a;
    },
    "+": function (b, a) {
      return b + a;
    },
    "-": function (b, a) {
      return b - a;
    }
  },
  resolveDefaults: function () {
    var a = this;
    Ext.onReady(function () {
      var g = Ext.clone(a.getSprites()),
        f = Ext.clone(a.getLegend()),
        e = Ext.clone(a.getAxis()),
        d = Ext.clone(a.getSeries()),
        h,
        c,
        b;
      if (!a.superclass.defaults) {
        h = Ext.getBody().createChild({ tag: "div", cls: "x-component" });
        a.superclass.defaults = {
          fontFamily: h.getStyle("fontFamily"),
          fontWeight: h.getStyle("fontWeight"),
          fontSize: parseFloat(h.getStyle("fontSize")),
          fontVariant: h.getStyle("fontVariant"),
          fontStyle: h.getStyle("fontStyle")
        };
        h.destroy();
      }
      a.replaceDefaults(g.text);
      a.setSprites(g);
      a.replaceDefaults(f.label);
      a.setLegend(f);
      for (c in e) {
        b = e[c];
        a.replaceDefaults(b.label);
        a.replaceDefaults(b.title);
      }
      a.setAxis(e);
      for (c in d) {
        b = d[c];
        a.replaceDefaults(b.label);
      }
      a.setSeries(d);
    });
  },
  replaceDefaults: function (h) {
    var e = this,
      g = e.superclass.defaults,
      a = e.defaultRegEx,
      d,
      f,
      c,
      b;
    if (Ext.isObject(h)) {
      for (d in g) {
        c = a.exec(h[d]);
        if (c) {
          f = g[d];
          c = c[1];
          if (c) {
            b = e.defaultOperators[c.charAt(0)];
            f = Math.round(b(f, parseFloat(c.substr(1))));
          }
          h[d] = f;
        }
      }
    }
  },
  applyBaseColor: function (c) {
    var a, b;
    if (c) {
      a = c.isColor ? c : Ext.util.Color.fromString(c);
      b = a.getHSL()[2];
      if (b < 0.15) {
        a = a.createLighter(0.3);
      } else {
        if (b < 0.3) {
          a = a.createLighter(0.15);
        } else {
          if (b > 0.85) {
            a = a.createDarker(0.3);
          } else {
            if (b > 0.7) {
              a = a.createDarker(0.15);
            }
          }
        }
      }
      this.setColors([
        a.createDarker(0.3).toString(),
        a.createDarker(0.15).toString(),
        a.toString(),
        a.createLighter(0.12).toString(),
        a.createLighter(0.24).toString(),
        a.createLighter(0.31).toString()
      ]);
    }
    return c;
  },
  applyColors: function (a) {
    return a || this.colorDefaults;
  },
  updateUseGradients: function (a) {
    if (a) {
      this.updateGradients({ type: "linear", degrees: 90 });
    }
  },
  updateBackground: function (a) {
    if (a) {
      var b = this.getChart();
      b.defaults.background = a;
      this.setChart(b);
    }
  },
  updateGradients: function (a) {
    var c = this.getColors(),
      e = [],
      h,
      b,
      d,
      f,
      g;
    if (Ext.isObject(a)) {
      for (f = 0, g = (c && c.length) || 0; f < g; f++) {
        b = Ext.util.Color.fromString(c[f]);
        if (b) {
          d = b.createLighter(0.15).toString();
          h = Ext.apply(Ext.Object.chain(a), {
            stops: [
              { offset: 1, color: b.toString() },
              { offset: 0, color: d.toString() }
            ]
          });
          e.push(h);
        }
      }
      this.setColors(e);
    }
  },
  applySeriesThemes: function (a) {
    this.getBaseColor();
    this.getUseGradients();
    this.getGradients();
    var b = this.getColors();
    if (!a) {
      a = {
        fillStyle: Ext.Array.clone(b),
        strokeStyle: Ext.Array.map(b, function (d) {
          var c = Ext.util.Color.fromString(d.stops ? d.stops[0].color : d);
          return c.createDarker(0.15).toString();
        })
      };
    }
    return a;
  }
});
Ext.define("Ext.chart.theme.Default", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.default", "chart.theme.Base"]
});
Ext.define("Ext.chart.Markers", {
  extend: "Ext.draw.sprite.Instancing",
  isMarkers: true,
  defaultCategory: "default",
  constructor: function () {
    this.callParent(arguments);
    this.categories = {};
    this.revisions = {};
  },
  destroy: function () {
    this.categories = null;
    this.revisions = null;
    this.callParent();
  },
  getMarkerFor: function (b, a) {
    if (b in this.categories) {
      var c = this.categories[b];
      if (a in c) {
        return this.get(c[a]);
      }
    }
  },
  clear: function (a) {
    a = a || this.defaultCategory;
    if (!(a in this.revisions)) {
      this.revisions[a] = 1;
    } else {
      this.revisions[a]++;
    }
  },
  putMarkerFor: function (e, b, c, h, f) {
    e = e || this.defaultCategory;
    var d = this,
      g = d.categories[e] || (d.categories[e] = {}),
      a;
    if (c in g) {
      d.setAttributesFor(g[c], b, h);
    } else {
      g[c] = d.getCount();
      d.add(b, h);
    }
    a = d.get(g[c]);
    if (a) {
      a.category = e;
      if (!f) {
        a.revision = d.revisions[e] || (d.revisions[e] = 1);
      }
    }
  },
  getMarkerBBoxFor: function (c, a, b) {
    if (c in this.categories) {
      var d = this.categories[c];
      if (a in d) {
        return this.getBBoxFor(d[a], b);
      }
    }
  },
  getBBox: function () {
    return null;
  },
  render: function (a, m, g) {
    var f = this,
      b = a.getRect(),
      l = f.revisions,
      k = f.attr.matrix,
      j = f.getTemplate(),
      d = j.attr,
      e = f.instances.length,
      h,
      c;
    k.toContext(m);
    j.preRender(a, m, g);
    j.useAttributes(m, b);
    for (c = 0; c < e; c++) {
      h = f.get(c);
      if (h.hidden || h.revision !== l[h.category]) {
        continue;
      }
      m.save();
      j.attr = h;
      j.useAttributes(m, b);
      j.render(a, m, g);
      m.restore();
    }
    j.attr = d;
  }
});
Ext.define("Ext.chart.modifier.Callout", {
  extend: "Ext.draw.modifier.Modifier",
  alternateClassName: "Ext.chart.label.Callout",
  prepareAttributes: function (a) {
    if (!a.hasOwnProperty("calloutOriginal")) {
      a.calloutOriginal = Ext.Object.chain(a);
      a.calloutOriginal.prototype = a;
    }
    if (this._lower) {
      this._lower.prepareAttributes(a.calloutOriginal);
    }
  },
  setAttrs: function (e, h) {
    var d = e.callout,
      i = e.calloutOriginal,
      l = e.bbox.plain,
      c = (l.width || 0) + e.labelOverflowPadding,
      m = (l.height || 0) + e.labelOverflowPadding,
      p,
      o;
    if ("callout" in h) {
      d = h.callout;
    }
    if (
      "callout" in h ||
      "calloutPlaceX" in h ||
      "calloutPlaceY" in h ||
      "x" in h ||
      "y" in h
    ) {
      var n =
          "rotationRads" in h
            ? (i.rotationRads = h.rotationRads)
            : i.rotationRads,
        g = "x" in h ? (i.x = h.x) : i.x,
        f = "y" in h ? (i.y = h.y) : i.y,
        b = "calloutPlaceX" in h ? h.calloutPlaceX : e.calloutPlaceX,
        a = "calloutPlaceY" in h ? h.calloutPlaceY : e.calloutPlaceY,
        k = "calloutVertical" in h ? h.calloutVertical : e.calloutVertical,
        j;
      n %= Math.PI * 2;
      if (Math.cos(n) < 0) {
        n = (n + Math.PI) % (Math.PI * 2);
      }
      if (n > Math.PI) {
        n -= Math.PI * 2;
      }
      if (k) {
        n = n * (1 - d) - (Math.PI / 2) * d;
        j = c;
        c = m;
        m = j;
      } else {
        n = n * (1 - d);
      }
      h.rotationRads = n;
      h.x = g * (1 - d) + b * d;
      h.y = f * (1 - d) + a * d;
      p = b - g;
      o = a - f;
      if (Math.abs(o * c) > Math.abs(p * m)) {
        if (o > 0) {
          h.calloutEndX = h.x - (m / 2) * (p / o) * d;
          h.calloutEndY = h.y - (m / 2) * d;
        } else {
          h.calloutEndX = h.x + (m / 2) * (p / o) * d;
          h.calloutEndY = h.y + (m / 2) * d;
        }
      } else {
        if (p > 0) {
          h.calloutEndX = h.x - c / 2;
          h.calloutEndY = h.y - (c / 2) * (o / p) * d;
        } else {
          h.calloutEndX = h.x + c / 2;
          h.calloutEndY = h.y + (c / 2) * (o / p) * d;
        }
      }
      if (h.calloutStartX && h.calloutStartY) {
        h.calloutHasLine =
          (p > 0 && h.calloutStartX < h.calloutEndX) ||
          (p <= 0 && h.calloutStartX > h.calloutEndX) ||
          (o > 0 && h.calloutStartY < h.calloutEndY) ||
          (o <= 0 && h.calloutStartY > h.calloutEndY);
      } else {
        h.calloutHasLine = true;
      }
    }
    return h;
  },
  pushDown: function (a, b) {
    b = this.callParent([a.calloutOriginal, b]);
    return this.setAttrs(a, b);
  },
  popUp: function (a, b) {
    a = a.prototype;
    b = this.setAttrs(a, b);
    if (this._upper) {
      return this._upper.popUp(a, b);
    } else {
      return Ext.apply(a, b);
    }
  }
});
Ext.define("Ext.chart.sprite.Label", {
  extend: "Ext.draw.sprite.Text",
  alternateClassName: "Ext.chart.label.Label",
  requires: ["Ext.chart.modifier.Callout"],
  inheritableStatics: {
    def: {
      processors: {
        callout: "limited01",
        calloutHasLine: "bool",
        calloutPlaceX: "number",
        calloutPlaceY: "number",
        calloutStartX: "number",
        calloutStartY: "number",
        calloutEndX: "number",
        calloutEndY: "number",
        calloutColor: "color",
        calloutWidth: "number",
        calloutVertical: "bool",
        labelOverflowPadding: "number",
        display:
          "enums(none,under,over,rotate,insideStart,insideEnd,inside,outside)",
        orientation: "enums(horizontal,vertical)",
        renderer: "default"
      },
      defaults: {
        callout: 0,
        calloutHasLine: true,
        calloutPlaceX: 0,
        calloutPlaceY: 0,
        calloutStartX: 0,
        calloutStartY: 0,
        calloutEndX: 0,
        calloutEndY: 0,
        calloutWidth: 1,
        calloutVertical: false,
        calloutColor: "black",
        labelOverflowPadding: 5,
        display: "none",
        orientation: "",
        renderer: null
      },
      triggers: {
        callout: "transform",
        calloutPlaceX: "transform",
        calloutPlaceY: "transform",
        labelOverflowPadding: "transform",
        calloutRotation: "transform",
        display: "hidden"
      },
      updaters: {
        hidden: function (a) {
          a.hidden = a.display === "none";
        }
      }
    }
  },
  config: {
    fx: { customDurations: { callout: 200 } },
    field: null,
    calloutLine: true
  },
  applyCalloutLine: function (a) {
    if (a) {
      return Ext.apply({}, a);
    }
  },
  prepareModifiers: function () {
    this.callParent(arguments);
    this.calloutModifier = new Ext.chart.modifier.Callout({ sprite: this });
    this.fx.setUpper(this.calloutModifier);
    this.calloutModifier.setUpper(this.topModifier);
  },
  render: function (b, c) {
    var e = this,
      a = e.attr,
      d = a.calloutColor;
    c.save();
    c.globalAlpha *= a.callout;
    if (c.globalAlpha > 0 && a.calloutHasLine) {
      if (d && d.isGradient) {
        d = d.getStops()[0].color;
      }
      c.strokeStyle = d;
      c.fillStyle = d;
      c.lineWidth = a.calloutWidth;
      c.beginPath();
      c.moveTo(e.attr.calloutStartX, e.attr.calloutStartY);
      c.lineTo(e.attr.calloutEndX, e.attr.calloutEndY);
      c.stroke();
      c.beginPath();
      c.arc(
        e.attr.calloutStartX,
        e.attr.calloutStartY,
        1 * a.calloutWidth,
        0,
        2 * Math.PI,
        true
      );
      c.fill();
      c.beginPath();
      c.arc(
        e.attr.calloutEndX,
        e.attr.calloutEndY,
        1 * a.calloutWidth,
        0,
        2 * Math.PI,
        true
      );
      c.fill();
    }
    c.restore();
    Ext.draw.sprite.Text.prototype.render.apply(e, arguments);
  }
});
Ext.define("Ext.chart.series.Series", {
  requires: ["Ext.chart.Markers", "Ext.chart.sprite.Label", "Ext.tip.ToolTip"],
  mixins: ["Ext.mixin.Observable", "Ext.mixin.Bindable"],
  isSeries: true,
  defaultBindProperty: "store",
  type: null,
  seriesType: "sprite",
  identifiablePrefix: "ext-line-",
  observableType: "series",
  darkerStrokeRatio: 0.15,
  config: {
    chart: null,
    title: null,
    renderer: null,
    showInLegend: true,
    triggerAfterDraw: false,
    style: {},
    subStyle: {},
    themeStyle: {},
    colors: null,
    useDarkerStrokeColor: true,
    store: null,
    label: {},
    labelOverflowPadding: null,
    showMarkers: true,
    marker: null,
    markerSubStyle: null,
    itemInstancing: null,
    background: null,
    highlightItem: null,
    surface: null,
    overlaySurface: null,
    hidden: false,
    highlight: false,
    highlightCfg: {
      merge: function (a) {
        return a;
      },
      $value: { fillStyle: "yellow", strokeStyle: "red" }
    },
    animation: null,
    tooltip: null
  },
  directions: [],
  sprites: null,
  themeColorCount: function () {
    return 1;
  },
  isStoreDependantColorCount: false,
  themeMarkerCount: function () {
    return 0;
  },
  getFields: function (f) {
    var e = this,
      a = [],
      c,
      b,
      d;
    for (b = 0, d = f.length; b < d; b++) {
      c = e["get" + f[b] + "Field"]();
      if (Ext.isArray(c)) {
        a.push.apply(a, c);
      } else {
        a.push(c);
      }
    }
    return a;
  },
  applyAnimation: function (a, b) {
    if (!a) {
      a = { duration: 0 };
    } else {
      if (a === true) {
        a = { easing: "easeInOut", duration: 500 };
      }
    }
    return b ? Ext.apply({}, a, b) : a;
  },
  getAnimation: function () {
    var a = this.getChart();
    if (a && a.animationSuspendCount) {
      return { duration: 0 };
    } else {
      return this.callParent();
    }
  },
  updateTitle: function () {
    var b = this,
      a = b.getChart();
    if (a && !a.isInitializing) {
      a.refreshLegendStore();
    }
  },
  applyHighlight: function (a, b) {
    if (Ext.isObject(a)) {
      a = Ext.merge({}, this.config.highlightCfg, a);
    } else {
      if (a === true) {
        a = this.config.highlightCfg;
      }
    }
    return Ext.apply(b || {}, a);
  },
  updateHighlight: function (a) {
    this.getStyle();
    if (!Ext.Object.isEmpty(a)) {
      this.addItemHighlight();
    }
  },
  updateHighlightCfg: function (a) {
    if (!Ext.Object.equals(a, this.defaultConfig.highlightCfg)) {
      this.addItemHighlight();
    }
  },
  applyItemInstancing: function (a, b) {
    return Ext.merge(b || {}, a);
  },
  setAttributesForItem: function (c, d) {
    var b = c && c.sprite,
      a;
    if (b) {
      if (b.itemsMarker && c.category === "items") {
        b.putMarker(c.category, d, c.index, false, true);
      }
      if (b.isMarkerHolder && c.category === "markers") {
        b.putMarker(c.category, d, c.index, false, true);
      } else {
        if (b.isInstancing) {
          b.setAttributesFor(c.index, d);
        } else {
          if (Ext.isArray(b)) {
            for (a = 0; a < b.length; a++) {
              b[a].setAttributes(d);
            }
          } else {
            b.setAttributes(d);
          }
        }
      }
    }
  },
  getBBoxForItem: function (a) {
    if (a && a.sprite) {
      if (a.sprite.itemsMarker && a.category === "items") {
        return a.sprite.getMarkerBBox(a.category, a.index);
      } else {
        if (a.sprite instanceof Ext.draw.sprite.Instancing) {
          return a.sprite.getBBoxFor(a.index);
        } else {
          return a.sprite.getBBox();
        }
      }
    }
    return null;
  },
  applyHighlightItem: function (d, a) {
    if (d === a) {
      return;
    }
    if (Ext.isObject(d) && Ext.isObject(a)) {
      var c = d.sprite === a.sprite,
        b = d.index === a.index;
      if (c && b) {
        return;
      }
    }
    return d;
  },
  updateHighlightItem: function (b, a) {
    this.setAttributesForItem(a, { highlighted: false });
    this.setAttributesForItem(b, { highlighted: true });
  },
  constructor: function (a) {
    var b = this,
      c;
    a = a || {};
    if (a.tips) {
      a = Ext.apply({ tooltip: a.tips }, a);
    }
    if (a.highlightCfg) {
      a = Ext.apply({ highlight: a.highlightCfg }, a);
    }
    if ("id" in a) {
      c = a.id;
    } else {
      if ("id" in b.config) {
        c = b.config.id;
      } else {
        c = b.getId();
      }
    }
    b.setId(c);
    b.sprites = [];
    b.dataRange = [];
    b.mixins.observable.constructor.call(b, a);
    b.initBindable();
  },
  lookupViewModel: function (a) {
    var b = this.getChart();
    return b ? b.lookupViewModel(a) : null;
  },
  applyTooltip: function (c, b) {
    var a = Ext.apply(
      {
        xtype: "tooltip",
        renderer: Ext.emptyFn,
        constrainPosition: true,
        shrinkWrapDock: true,
        autoHide: true,
        mouseOffset: [20, 20]
      },
      c
    );
    return Ext.create(a);
  },
  updateTooltip: function () {
    this.addItemHighlight();
  },
  addItemHighlight: function () {
    var d = this.getChart();
    if (!d) {
      return;
    }
    var e = d.getInteractions(),
      c,
      a,
      b;
    for (c = 0; c < e.length; c++) {
      a = e[c];
      if (a.isItemHighlight || a.isItemEdit) {
        b = true;
        break;
      }
    }
    if (!b) {
      e.push("itemhighlight");
      d.setInteractions(e);
    }
  },
  showTooltip: function (c, b) {
    var a = this,
      d = a.getTooltip();
    if (!d) {
      return;
    }
    clearTimeout(a.tooltipTimeout);
    d.pointerEvent = b;
    d.currentTarget.attach(
      (c.sprite.length ? c.sprite[0] : c.sprite).getSurface().el.dom
    );
    Ext.callback(d.renderer, d.scope, [d, c.record, c], 0, a);
    if (d.isVisible()) {
      d.handleAfterShow();
    } else {
      d.show();
    }
  },
  hideTooltip: function (b) {
    var a = this,
      c = a.getTooltip();
    if (!c) {
      return;
    }
    clearTimeout(a.tooltipTimeout);
    a.tooltipTimeout = Ext.defer(function () {
      c.hide();
    }, 1);
  },
  applyStore: function (a) {
    return a && Ext.StoreManager.lookup(a);
  },
  getStore: function () {
    return this._store || (this.getChart() && this.getChart().getStore());
  },
  updateStore: function (b, a) {
    var h = this,
      g = h.getChart(),
      c = g && g.getStore(),
      f,
      j,
      e,
      d;
    a = a || c;
    if (a && a !== b) {
      a.un({ datachanged: "onDataChanged", update: "onDataChanged", scope: h });
    }
    if (b) {
      b.on({ datachanged: "onDataChanged", update: "onDataChanged", scope: h });
      f = h.getSprites();
      for (d = 0, e = f.length; d < e; d++) {
        j = f[d];
        if (j.setStore) {
          j.setStore(b);
        }
      }
      h.onDataChanged();
    }
    h.fireEvent("storechange", h, b, a);
  },
  onStoreChange: function (b, a, c) {
    if (!this._store) {
      this.updateStore(a, c);
    }
  },
  coordinate: function (o, m, e) {
    var l = this,
      p = l.getStore(),
      h = l.getHidden(),
      k = p.getData().items,
      b = l["get" + o + "Axis"](),
      f = { min: Infinity, max: -Infinity },
      q = l["fieldCategory" + o] || [o],
      g = l.getFields(q),
      d,
      n,
      c,
      a = {},
      j = l.getSprites();
    if (j.length > 0) {
      if (!Ext.isBoolean(h) || !h) {
        for (d = 0; d < q.length; d++) {
          n = g[d];
          c = l.coordinateData(k, n, b);
          l.getRangeOfData(c, f);
          a["data" + q[d]] = c;
        }
      }
      l.dataRange[m] = f.min;
      l.dataRange[m + e] = f.max;
      a["dataMin" + o] = f.min;
      a["dataMax" + o] = f.max;
      if (b) {
        b.range = null;
        a["range" + o] = b.getRange();
      }
      for (d = 0; d < j.length; d++) {
        j[d].setAttributes(a);
      }
    }
  },
  coordinateData: function (b, h, d) {
    var g = [],
      f = b.length,
      e = d && d.getLayout(),
      c,
      a;
    for (c = 0; c < f; c++) {
      a = b[c].data[h];
      if (!Ext.isEmpty(a, true)) {
        if (e) {
          g[c] = e.getCoordFor(a, h, c, b);
        } else {
          g[c] = +a;
        }
      } else {
        g[c] = a;
      }
    }
    return g;
  },
  getRangeOfData: function (g, b) {
    var e = g.length,
      d = b.min,
      a = b.max,
      c,
      f;
    for (c = 0; c < e; c++) {
      f = g[c];
      if (f < d) {
        d = f;
      }
      if (f > a) {
        a = f;
      }
    }
    b.min = d;
    b.max = a;
  },
  updateLabelData: function () {
    var h = this,
      l = h.getStore(),
      g = l.getData().items,
      f = h.getSprites(),
      a = h.getLabel().getTemplate(),
      n = Ext.Array.from(a.getField()),
      c,
      b,
      e,
      d,
      m,
      k;
    if (!f.length || !n.length) {
      return;
    }
    for (c = 0; c < f.length; c++) {
      d = [];
      m = f[c];
      k = m.getField();
      if (Ext.Array.indexOf(n, k) < 0) {
        k = n[c];
      }
      for (b = 0, e = g.length; b < e; b++) {
        d.push(g[b].get(k));
      }
      m.setAttributes({ labels: d });
    }
  },
  processData: function () {
    var d = this;
    if (d.isProcessingData || !d.getStore()) {
      return;
    }
    var f = this.directions,
      a,
      c = f.length,
      e,
      b;
    d.isProcessingData = true;
    for (a = 0; a < c; a++) {
      e = f[a];
      b = d["get" + e + "Axis"]();
      if (b) {
        b.processData(d);
        continue;
      }
      if (d["coordinate" + e]) {
        d["coordinate" + e]();
      }
    }
    d.updateLabelData();
    d.isProcessingData = false;
  },
  applyBackground: function (a) {
    if (this.getChart()) {
      this.getSurface().setBackground(a);
      return this.getSurface().getBackground();
    } else {
      return a;
    }
  },
  updateChart: function (d, a) {
    var c = this,
      b = c._store;
    if (a) {
      a.un("axeschange", "onAxesChange", c);
      c.clearSprites();
      c.setSurface(null);
      c.setOverlaySurface(null);
      a.unregister(c);
      c.onChartDetached(a);
      if (!b) {
        c.updateStore(null);
      }
    }
    if (d) {
      c.setSurface(d.getSurface("series"));
      c.setOverlaySurface(d.getSurface("overlay"));
      d.on("axeschange", "onAxesChange", c);
      if (d.getAxes()) {
        c.onAxesChange(d);
      }
      c.onChartAttached(d);
      d.register(c);
      if (!b) {
        c.updateStore(d.getStore());
      }
    }
  },
  onAxesChange: function (h) {
    var k = this,
      g = h.getAxes(),
      c,
      a = {},
      b = {},
      e = false,
      j = this.directions,
      l,
      d,
      f;
    for (d = 0, f = j.length; d < f; d++) {
      l = j[d];
      b[l] = k.getFields(k["fieldCategory" + l]);
    }
    for (d = 0, f = g.length; d < f; d++) {
      c = g[d];
      if (!a[c.getDirection()]) {
        a[c.getDirection()] = [c];
      } else {
        a[c.getDirection()].push(c);
      }
    }
    for (d = 0, f = j.length; d < f; d++) {
      l = j[d];
      if (k["get" + l + "Axis"]()) {
        continue;
      }
      if (a[l]) {
        c = k.findMatchingAxis(a[l], b[l]);
        if (c) {
          k["set" + l + "Axis"](c);
          if (c.getNeedHighPrecision()) {
            e = true;
          }
        }
      }
    }
    this.getSurface().setHighPrecision(e);
  },
  findMatchingAxis: function (f, e) {
    var d, c, b, a;
    for (b = 0; b < f.length; b++) {
      d = f[b];
      c = d.getFields();
      if (!c.length) {
        return d;
      } else {
        if (e) {
          for (a = 0; a < e.length; a++) {
            if (Ext.Array.indexOf(c, e[a]) >= 0) {
              return d;
            }
          }
        }
      }
    }
  },
  onChartDetached: function (a) {
    var b = this;
    b.fireEvent("chartdetached", a, b);
    a.un("storechange", "onStoreChange", b);
  },
  onChartAttached: function (a) {
    var b = this;
    b.setBackground(b.getBackground());
    b.fireEvent("chartattached", a, b);
    a.on("storechange", "onStoreChange", b);
    b.processData();
  },
  updateOverlaySurface: function (a) {
    var b = this;
    if (a) {
      if (b.getLabel()) {
        b.getOverlaySurface().add(b.getLabel());
      }
    }
  },
  applyLabel: function (a, d) {
    var c, b;
    if (!d) {
      d = new Ext.chart.Markers({ zIndex: 10 });
      d.setTemplate(new Ext.chart.sprite.Label(a));
    } else {
      c = d.getTemplate();
      c.setAttributes(a);
      if (a) {
        if (a.field) {
          c.setField(a.field);
          this.updateLabelData();
        }
        if (a.display) {
          d.setAttributes({ hidden: a.display === "none" });
        }
      }
      d.setDirty(true);
      this.updateLabel();
    }
    return d;
  },
  updateLabel: function () {
    var a = this.getChart();
    if (a && !a.isInitializing) {
      a.redraw();
    }
  },
  createItemInstancingSprite: function (c, b) {
    var e = this,
      f = new Ext.chart.Markers(),
      a,
      d;
    f.setAttributes({ zIndex: Number.MAX_VALUE });
    a = Ext.apply({}, b);
    if (e.getHighlight()) {
      a.highlight = e.getHighlight();
      a.modifiers = ["highlight"];
    }
    f.setTemplate(a);
    d = f.getTemplate();
    d.setAttributes(e.getStyle());
    d.fx.on("animationstart", "onSpriteAnimationStart", this);
    d.fx.on("animationend", "onSpriteAnimationEnd", this);
    c.bindMarker("items", f);
    e.getSurface().add(f);
    return f;
  },
  getDefaultSpriteConfig: function () {
    return { type: this.seriesType, renderer: this.getRenderer() };
  },
  updateRenderer: function (c) {
    var b = this,
      a = b.getChart(),
      d;
    if (a && a.isInitializing) {
      return;
    }
    d = b.getSprites();
    if (d.length) {
      d[0].setAttributes({ renderer: c || null });
      if (a && !a.isInitializing) {
        a.redraw();
      }
    }
  },
  updateShowMarkers: function (a) {
    var d = this.getSprites(),
      b = d && d[0],
      c = b && b.getMarker("markers");
    if (c) {
      c.getTemplate().setAttributes({ hidden: !a });
    }
  },
  createSprite: function () {
    var f = this,
      a = f.getSurface(),
      e = f.getItemInstancing(),
      d = a.add(f.getDefaultSpriteConfig()),
      b = f.getMarker(),
      g,
      c;
    d.setAttributes(f.getStyle());
    d.setSeries(f);
    if (e) {
      d.itemsMarker = f.createItemInstancingSprite(d, e);
    }
    if (d.bindMarker) {
      if (b) {
        g = new Ext.chart.Markers();
        c = Ext.Object.merge({}, b);
        if (f.getHighlight()) {
          c.highlight = f.getHighlight();
          c.modifiers = ["highlight"];
        }
        g.setTemplate(c);
        g.getTemplate().fx.setCustomDurations({
          translationX: 0,
          translationY: 0
        });
        d.dataMarker = g;
        d.bindMarker("markers", g);
        f.getOverlaySurface().add(g);
      }
      if (f.getLabel().getTemplate().getField()) {
        d.bindMarker("labels", f.getLabel());
      }
    }
    if (d.setStore) {
      d.setStore(f.getStore());
    }
    d.fx.on("animationstart", "onSpriteAnimationStart", f);
    d.fx.on("animationend", "onSpriteAnimationEnd", f);
    f.sprites.push(d);
    return d;
  },
  getSprites: Ext.emptyFn,
  onDataChanged: function () {
    var d = this,
      c = d.getChart(),
      b = c && c.getStore(),
      a = d.getStore();
    if (a !== b) {
      d.processData();
    }
  },
  isXType: function (a) {
    return a === "series";
  },
  getItemId: function () {
    return this.getId();
  },
  applyThemeStyle: function (e, a) {
    var b = this,
      d,
      c;
    d = e && e.subStyle && e.subStyle.fillStyle;
    c = d && e.subStyle.strokeStyle;
    if (d && !c) {
      e.subStyle.strokeStyle = b.getStrokeColorsFromFillColors(d);
    }
    d = e && e.markerSubStyle && e.markerSubStyle.fillStyle;
    c = d && e.markerSubStyle.strokeStyle;
    if (d && !c) {
      e.markerSubStyle.strokeStyle = b.getStrokeColorsFromFillColors(d);
    }
    return Ext.apply(a || {}, e);
  },
  applyStyle: function (c, b) {
    var a = Ext.ClassManager.get(
      Ext.ClassManager.getNameByAlias("sprite." + this.seriesType)
    );
    if (a && a.def) {
      c = a.def.normalize(c);
    }
    return Ext.apply({}, c, b);
  },
  applySubStyle: function (b, c) {
    var a = Ext.ClassManager.get(
      Ext.ClassManager.getNameByAlias("sprite." + this.seriesType)
    );
    if (a && a.def) {
      b = a.def.batchedNormalize(b, true);
    }
    return Ext.merge({}, c, b);
  },
  applyMarker: function (c, a) {
    var d = (c && c.type) || (a && a.type) || "circle",
      b = Ext.ClassManager.get(Ext.ClassManager.getNameByAlias("sprite." + d));
    if (b && b.def) {
      c = b.def.normalize(Ext.isObject(c) ? c : {}, true);
      c.type = d;
    }
    return Ext.merge(a || {}, c);
  },
  applyMarkerSubStyle: function (c, a) {
    var d = (c && c.type) || (a && a.type) || "circle",
      b = Ext.ClassManager.get(Ext.ClassManager.getNameByAlias("sprite." + d));
    if (b && b.def) {
      c = b.def.batchedNormalize(c, true);
    }
    return Ext.merge(a || {}, c);
  },
  updateHidden: function (b) {
    var a = this;
    a.getColors();
    a.getSubStyle();
    a.setSubStyle({ hidden: b });
    a.processData();
    a.doUpdateStyles();
    if (!Ext.isArray(b)) {
      a.updateLegendStore(b);
    }
  },
  updateLegendStore: function (f, b) {
    var e = this,
      d = e.getChart(),
      c = d.getLegendStore(),
      g = e.getId(),
      a;
    if (c) {
      if (arguments.length > 1) {
        a = c.findBy(function (h) {
          return h.get("series") === g && h.get("index") === b;
        });
        if (a !== -1) {
          a = c.getAt(a);
        }
      } else {
        a = c.findRecord("series", g);
      }
      if (a && a.get("disabled") !== f) {
        a.set("disabled", f);
      }
    }
  },
  setHiddenByIndex: function (a, c) {
    var b = this;
    if (Ext.isArray(b.getHidden())) {
      b.getHidden()[a] = c;
      b.updateHidden(b.getHidden());
      b.updateLegendStore(c, a);
    } else {
      b.setHidden(c);
    }
  },
  getStrokeColorsFromFillColors: function (a) {
    var c = this,
      e = c.getUseDarkerStrokeColor(),
      b = Ext.isNumber(e) ? e : c.darkerStrokeRatio,
      d;
    if (e) {
      d = Ext.Array.map(a, function (f) {
        f = Ext.isString(f) ? f : f.stops[0].color;
        f = Ext.util.Color.fromString(f);
        return f.createDarker(b).toString();
      });
    } else {
      d = Ext.Array.clone(a);
    }
    return d;
  },
  updateThemeColors: function (b) {
    var c = this,
      d = c.getThemeStyle(),
      a = Ext.Array.clone(b),
      f = c.getStrokeColorsFromFillColors(b),
      e = { fillStyle: a, strokeStyle: f };
    d.subStyle = Ext.apply(d.subStyle || {}, e);
    d.markerSubStyle = Ext.apply(d.markerSubStyle || {}, e);
    c.doUpdateStyles();
  },
  themeOnlyIfConfigured: {},
  updateTheme: function (d) {
    var h = this,
      a = d.getSeries(),
      n = h.getInitialConfig(),
      c = h.defaultConfig,
      f = h.self.getConfigurator().configs,
      j = a.defaults,
      k = a[h.type],
      g = h.themeOnlyIfConfigured,
      l,
      i,
      o,
      b,
      m,
      e;
    a = Ext.merge({}, j, k);
    for (l in a) {
      i = a[l];
      e = f[l];
      if (i !== null && i !== undefined && e) {
        m = n[l];
        o = Ext.isObject(i);
        b = m === c[l];
        if (o) {
          if (b && g[l]) {
            continue;
          }
          i = Ext.merge({}, i, m);
        }
        if (b || o) {
          h[e.names.set](i);
        }
      }
    }
  },
  updateChartColors: function (a) {
    var b = this;
    if (!b.getColors()) {
      b.updateThemeColors(a);
    }
  },
  updateColors: function (a) {
    this.updateThemeColors(a);
  },
  updateStyle: function () {
    this.doUpdateStyles();
  },
  updateSubStyle: function () {
    this.doUpdateStyles();
  },
  updateThemeStyle: function () {
    this.doUpdateStyles();
  },
  doUpdateStyles: function () {
    var g = this,
      h = g.sprites,
      d = g.getItemInstancing(),
      c = 0,
      f = h && h.length,
      a = g.getConfig("showMarkers", true),
      b = g.getMarker(),
      e;
    for (; c < f; c++) {
      e = g.getStyleByIndex(c);
      if (d) {
        h[c].itemsMarker.getTemplate().setAttributes(e);
      }
      h[c].setAttributes(e);
      if (b && h[c].dataMarker) {
        h[c].dataMarker.getTemplate().setAttributes(g.getMarkerStyleByIndex(c));
      }
    }
  },
  getStyleWithTheme: function () {
    var b = this,
      c = b.getThemeStyle(),
      d = (c && c.style) || {},
      a = Ext.applyIf(Ext.apply({}, b.getStyle()), d);
    return a;
  },
  getSubStyleWithTheme: function () {
    var c = this,
      d = c.getThemeStyle(),
      a = (d && d.subStyle) || {},
      b = Ext.applyIf(Ext.apply({}, c.getSubStyle()), a);
    return b;
  },
  getStyleByIndex: function (b) {
    var e = this,
      h = e.getThemeStyle(),
      d,
      g,
      c,
      f,
      a = {};
    d = e.getStyle();
    g = (h && h.style) || {};
    c = e.styleDataForIndex(e.getSubStyle(), b);
    f = e.styleDataForIndex(h && h.subStyle, b);
    Ext.apply(a, g);
    Ext.apply(a, f);
    Ext.apply(a, d);
    Ext.apply(a, c);
    return a;
  },
  getMarkerStyleByIndex: function (d) {
    var g = this,
      c = g.getThemeStyle(),
      a,
      e,
      k,
      j,
      b,
      l,
      h,
      f,
      m = {};
    a = g.getStyle();
    e = (c && c.style) || {};
    k = g.styleDataForIndex(g.getSubStyle(), d);
    if (k.hasOwnProperty("hidden")) {
      k.hidden = k.hidden || !this.getConfig("showMarkers", true);
    }
    j = g.styleDataForIndex(c && c.subStyle, d);
    b = g.getMarker();
    l = (c && c.marker) || {};
    h = g.getMarkerSubStyle();
    f = g.styleDataForIndex(c && c.markerSubStyle, d);
    Ext.apply(m, e);
    Ext.apply(m, j);
    Ext.apply(m, l);
    Ext.apply(m, f);
    Ext.apply(m, a);
    Ext.apply(m, k);
    Ext.apply(m, b);
    Ext.apply(m, h);
    return m;
  },
  styleDataForIndex: function (d, c) {
    var e,
      b,
      a = {};
    if (d) {
      for (b in d) {
        e = d[b];
        if (Ext.isArray(e)) {
          a[b] = e[c % e.length];
        } else {
          a[b] = e;
        }
      }
    }
    return a;
  },
  getItemForPoint: Ext.emptyFn,
  getItemByIndex: function (a, e) {
    var d = this,
      f = d.getSprites(),
      b = f && f[0],
      c;
    if (!b) {
      return;
    }
    if (e === undefined && b.isMarkerHolder) {
      e = d.getItemInstancing() ? "items" : "markers";
    } else {
      if (!e || e === "" || e === "sprites") {
        b = f[a];
      }
    }
    if (b) {
      c = {
        series: d,
        category: e,
        index: a,
        record: d.getStore().getData().items[a],
        field: d.getYField(),
        sprite: b
      };
      return c;
    }
  },
  onSpriteAnimationStart: function (a) {
    this.fireEvent("animationstart", this, a);
  },
  onSpriteAnimationEnd: function (a) {
    this.fireEvent("animationend", this, a);
  },
  resolveListenerScope: function (e) {
    var d = this,
      a = Ext._namedScopes[e],
      c = d.getChart(),
      b;
    if (!a) {
      b = c ? c.resolveListenerScope(e, false) : e || d;
    } else {
      if (a.isThis) {
        b = d;
      } else {
        if (a.isController) {
          b = c ? c.resolveListenerScope(e, false) : d;
        } else {
          if (a.isSelf) {
            b = c ? c.resolveListenerScope(e, false) : d;
            if (b === c && !c.getInheritedConfig("defaultListenerScope")) {
              b = d;
            }
          }
        }
      }
    }
    return b;
  },
  provideLegendInfo: function (a) {
    a.push({
      name: this.getTitle() || this.getId(),
      mark: "black",
      disabled: this.getHidden(),
      series: this.getId(),
      index: 0
    });
  },
  clearSprites: function () {
    var d = this.sprites,
      b,
      a,
      c;
    for (a = 0, c = d.length; a < c; a++) {
      b = d[a];
      if (b && b.isSprite) {
        b.destroy();
      }
    }
    this.sprites = [];
  },
  destroy: function () {
    var b = this,
      a = b._store,
      c = b.getConfig("tooltip", true);
    if (a && a.getAutoDestroy()) {
      Ext.destroy(a);
    }
    b.setChart(null);
    b.clearListeners();
    if (c) {
      Ext.destroy(c);
      clearTimeout(b.tooltipTimeout);
    }
    b.callParent();
  }
});
Ext.define(
  "Ext.chart.interactions.Abstract",
  {
    xtype: "interaction",
    mixins: { observable: "Ext.mixin.Observable" },
    config: { gestures: { tap: "onGesture" }, chart: null, enabled: true },
    throttleGap: 0,
    stopAnimationBeforeSync: false,
    constructor: function (a) {
      var b = this,
        c;
      a = a || {};
      if ("id" in a) {
        c = a.id;
      } else {
        if ("id" in b.config) {
          c = b.config.id;
        } else {
          c = b.getId();
        }
      }
      b.setId(c);
      b.mixins.observable.constructor.call(b, a);
    },
    updateChart: function (c, a) {
      var b = this;
      if (a === c) {
        return;
      }
      if (a) {
        a.unregister(b);
        b.removeChartListener(a);
      }
      if (c) {
        c.register(b);
        b.addChartListener();
      }
    },
    updateEnabled: function (a) {
      var c = this,
        b = c.getChart();
      if (b) {
        if (a) {
          c.addChartListener();
        } else {
          c.removeChartListener(b);
        }
      }
    },
    onGesture: Ext.emptyFn,
    getItemForEvent: function (d) {
      var b = this,
        a = b.getChart(),
        c = a.getEventXY(d);
      return a.getItemForPoint(c[0], c[1]);
    },
    getItemsForEvent: function (d) {
      var b = this,
        a = b.getChart(),
        c = a.getEventXY(d);
      return a.getItemsForPoint(c[0], c[1]);
    },
    addChartListener: function () {
      var c = this,
        b = c.getChart(),
        e = c.getGestures(),
        a;
      if (!c.getEnabled()) {
        return;
      }
      function d(f, g) {
        b.addElementListener(
          f,
          (c.listeners[f] = function (j) {
            var i = c.getLocks(),
              h;
            if (c.getEnabled() && (!(f in i) || i[f] === c)) {
              h = (Ext.isFunction(g) ? g : c[g]).apply(this, arguments);
              if (h === false && j && j.stopPropagation) {
                j.stopPropagation();
              }
              return h;
            }
          }),
          c
        );
      }
      c.listeners = c.listeners || {};
      for (a in e) {
        d(a, e[a]);
      }
    },
    removeChartListener: function (c) {
      var d = this,
        e = d.getGestures(),
        b;
      function a(f) {
        var g = d.listeners[f];
        if (g) {
          c.removeElementListener(f, g);
          delete d.listeners[f];
        }
      }
      if (d.listeners) {
        for (b in e) {
          a(b);
        }
      }
    },
    lockEvents: function () {
      var d = this,
        c = d.getLocks(),
        a = Array.prototype.slice.call(arguments),
        b = a.length;
      while (b--) {
        c[a[b]] = d;
      }
    },
    unlockEvents: function () {
      var c = this.getLocks(),
        a = Array.prototype.slice.call(arguments),
        b = a.length;
      while (b--) {
        delete c[a[b]];
      }
    },
    getLocks: function () {
      var a = this.getChart();
      return a.lockedEvents || (a.lockedEvents = {});
    },
    doSync: function () {
      var b = this,
        a = b.getChart();
      if (b.syncTimer) {
        clearTimeout(b.syncTimer);
        b.syncTimer = null;
      }
      if (b.stopAnimationBeforeSync) {
        a.animationSuspendCount++;
      }
      a.redraw();
      if (b.stopAnimationBeforeSync) {
        a.animationSuspendCount--;
      }
      b.syncThrottle = Date.now() + b.throttleGap;
    },
    sync: function () {
      var a = this;
      if (a.throttleGap && Ext.frameStartTime < a.syncThrottle) {
        if (a.syncTimer) {
          return;
        }
        a.syncTimer = Ext.defer(function () {
          a.doSync();
        }, a.throttleGap);
      } else {
        a.doSync();
      }
    },
    getItemId: function () {
      return this.getId();
    },
    isXType: function (a) {
      return a === "interaction";
    },
    destroy: function () {
      var a = this;
      a.setChart(null);
      delete a.listeners;
      a.callParent();
    }
  },
  function () {
    if (Ext.os.is.Android4) {
      this.prototype.throttleGap = 40;
    }
  }
);
Ext.define("Ext.chart.MarkerHolder", {
  extend: "Ext.Mixin",
  mixinConfig: {
    id: "markerHolder",
    after: { constructor: "constructor", preRender: "preRender" },
    before: { destroy: "destroy" }
  },
  isMarkerHolder: true,
  surfaceMatrix: null,
  inverseSurfaceMatrix: null,
  deprecated: {
    6: {
      methods: {
        getBoundMarker: {
          message: "Please use the 'getMarker' method instead.",
          fn: function (b) {
            var a = this.boundMarkers[b];
            return a ? [a] : a;
          }
        }
      }
    }
  },
  constructor: function () {
    this.boundMarkers = {};
    this.cleanRedraw = false;
  },
  bindMarker: function (b, a) {
    var c = this,
      d = c.boundMarkers;
    if (a && a.isMarkers) {
      c.releaseMarker(b);
      d[b] = a;
      a.on("destroy", c.onMarkerDestroy, c);
    }
  },
  onMarkerDestroy: function (a) {
    this.releaseMarker(a);
  },
  releaseMarker: function (a) {
    var c = this.boundMarkers,
      b;
    if (a && a.isMarkers) {
      for (b in c) {
        if (c[b] === a) {
          delete c[b];
          break;
        }
      }
    } else {
      b = a;
      a = c[b];
      delete c[b];
    }
    return a || null;
  },
  getMarker: function (a) {
    return this.boundMarkers[a] || null;
  },
  preRender: function (c, j, g) {
    var f = this,
      b = f.getId(),
      e = f.boundMarkers,
      i = f.getParent(),
      a,
      d,
      h;
    if (f.surfaceMatrix) {
      h = f.surfaceMatrix.set(1, 0, 0, 1, 0, 0);
    } else {
      h = f.surfaceMatrix = new Ext.draw.Matrix();
    }
    f.cleanRedraw = !f.attr.dirty;
    if (!f.cleanRedraw) {
      for (a in e) {
        d = e[a];
        if (d) {
          d.clear(b);
        }
      }
    }
    while (i && i.attr && i.attr.matrix) {
      h.prependMatrix(i.attr.matrix);
      i = i.getParent();
    }
    h.prependMatrix(i.matrix);
    f.surfaceMatrix = h;
    f.inverseSurfaceMatrix = h.inverse(f.inverseSurfaceMatrix);
  },
  putMarker: function (d, a, c, g, e) {
    var b = this.boundMarkers[d],
      f = this.getId();
    if (b) {
      b.putMarkerFor(f, a, c, g, e);
    }
  },
  getMarkerBBox: function (c, b, d) {
    var a = this.boundMarkers[c],
      e = this.getId();
    if (a) {
      return a.getMarkerBBoxFor(e, b, d);
    }
  },
  destroy: function () {
    var c = this.boundMarkers,
      b,
      a;
    for (b in c) {
      a = c[b];
      a.destroy();
    }
  }
});
Ext.define("Ext.chart.axis.sprite.Axis", {
  extend: "Ext.draw.sprite.Sprite",
  alias: "sprite.axis",
  type: "axis",
  mixins: { markerHolder: "Ext.chart.MarkerHolder" },
  requires: ["Ext.draw.sprite.Text"],
  inheritableStatics: {
    def: {
      processors: {
        grid: "bool",
        axisLine: "bool",
        minorTicks: "bool",
        minorTickSize: "number",
        majorTicks: "bool",
        majorTickSize: "number",
        length: "number",
        startGap: "number",
        endGap: "number",
        dataMin: "number",
        dataMax: "number",
        visibleMin: "number",
        visibleMax: "number",
        position: "enums(left,right,top,bottom,angular,radial,gauge)",
        minStepSize: "number",
        estStepSize: "number",
        titleOffset: "number",
        textPadding: "number",
        min: "number",
        max: "number",
        centerX: "number",
        centerY: "number",
        radius: "number",
        totalAngle: "number",
        baseRotation: "number",
        data: "default",
        enlargeEstStepSizeByText: "bool"
      },
      defaults: {
        grid: false,
        axisLine: true,
        minorTicks: false,
        minorTickSize: 3,
        majorTicks: true,
        majorTickSize: 5,
        length: 0,
        startGap: 0,
        endGap: 0,
        visibleMin: 0,
        visibleMax: 1,
        dataMin: 0,
        dataMax: 1,
        position: "",
        minStepSize: 0,
        estStepSize: 20,
        min: 0,
        max: 1,
        centerX: 0,
        centerY: 0,
        radius: 1,
        baseRotation: 0,
        data: null,
        titleOffset: 0,
        textPadding: 0,
        scalingCenterY: 0,
        scalingCenterX: 0,
        strokeStyle: "black",
        enlargeEstStepSizeByText: false
      },
      triggers: {
        minorTickSize: "bbox",
        majorTickSize: "bbox",
        position: "bbox,layout",
        axisLine: "bbox,layout",
        minorTicks: "layout",
        min: "layout",
        max: "layout",
        length: "layout",
        minStepSize: "layout",
        estStepSize: "layout",
        data: "layout",
        dataMin: "layout",
        dataMax: "layout",
        visibleMin: "layout",
        visibleMax: "layout",
        enlargeEstStepSizeByText: "layout"
      },
      updaters: { layout: "layoutUpdater" }
    }
  },
  config: {
    label: null,
    labelOffset: 10,
    layout: null,
    segmenter: null,
    renderer: null,
    layoutContext: null,
    axis: null
  },
  thickness: 0,
  stepSize: 0,
  getBBox: function () {
    return null;
  },
  defaultRenderer: function (a) {
    return this.segmenter.renderer(a, this);
  },
  layoutUpdater: function () {
    var h = this,
      f = h.getAxis().getChart();
    if (f.isInitializing) {
      return;
    }
    var e = h.attr,
      d = h.getLayout(),
      g = f.getInherited().rtl,
      b = e.dataMin + (e.dataMax - e.dataMin) * e.visibleMin,
      i = e.dataMin + (e.dataMax - e.dataMin) * e.visibleMax,
      c = e.position,
      a = { attr: e, segmenter: h.getSegmenter(), renderer: h.defaultRenderer };
    if (c === "left" || c === "right") {
      e.translationX = 0;
      e.translationY = (i * e.length) / (i - b);
      e.scalingX = 1;
      e.scalingY = -e.length / (i - b);
      e.scalingCenterY = 0;
      e.scalingCenterX = 0;
      h.applyTransformations(true);
    } else {
      if (c === "top" || c === "bottom") {
        if (g) {
          e.translationX = e.length + (b * e.length) / (i - b) + 1;
        } else {
          e.translationX = (-b * e.length) / (i - b);
        }
        e.translationY = 0;
        e.scalingX = ((g ? -1 : 1) * e.length) / (i - b);
        e.scalingY = 1;
        e.scalingCenterY = 0;
        e.scalingCenterX = 0;
        h.applyTransformations(true);
      }
    }
    if (d) {
      d.calculateLayout(a);
      h.setLayoutContext(a);
    }
  },
  iterate: function (e, j) {
    var c,
      g,
      a,
      b,
      h,
      d,
      k = Ext.Array.some,
      m = Math.abs,
      f;
    if (e.getLabel) {
      if (e.min < e.from) {
        j.call(this, e.min, e.getLabel(e.min), -1, e);
      }
      for (c = 0; c <= e.steps; c++) {
        j.call(this, e.get(c), e.getLabel(c), c, e);
      }
      if (e.max > e.to) {
        j.call(this, e.max, e.getLabel(e.max), e.steps + 1, e);
      }
    } else {
      b = this.getAxis();
      h = b.floatingAxes;
      d = [];
      f = (e.to - e.from) / (e.steps + 1);
      if (b.getFloating()) {
        for (a in h) {
          d.push(h[a]);
        }
      }
      function l(i) {
        return (
          !d.length ||
          k(d, function (n) {
            return m(n - i) > f;
          })
        );
      }
      if (e.min < e.from && l(e.min)) {
        j.call(this, e.min, e.min, -1, e);
      }
      for (c = 0; c <= e.steps; c++) {
        g = e.get(c);
        if (l(g)) {
          j.call(this, g, g, c, e);
        }
      }
      if (e.max > e.to && l(e.max)) {
        j.call(this, e.max, e.max, e.steps + 1, e);
      }
    }
  },
  renderTicks: function (l, m, s, p) {
    var v = this,
      k = v.attr,
      u = k.position,
      n = k.matrix,
      e = 0.5 * k.lineWidth,
      f = n.getXX(),
      i = n.getDX(),
      j = n.getYY(),
      h = n.getDY(),
      o = s.majorTicks,
      d = k.majorTickSize,
      a = s.minorTicks,
      r = k.minorTickSize;
    if (o) {
      switch (u) {
        case "right":
          function q(w) {
            return function (x, z, y) {
              x = l.roundPixel(x * j + h) + e;
              m.moveTo(0, x);
              m.lineTo(w, x);
            };
          }
          v.iterate(o, q(d));
          a && v.iterate(a, q(r));
          break;
        case "left":
          function t(w) {
            return function (x, z, y) {
              x = l.roundPixel(x * j + h) + e;
              m.moveTo(p[2] - w, x);
              m.lineTo(p[2], x);
            };
          }
          v.iterate(o, t(d));
          a && v.iterate(a, t(r));
          break;
        case "bottom":
          function c(w) {
            return function (x, z, y) {
              x = l.roundPixel(x * f + i) - e;
              m.moveTo(x, 0);
              m.lineTo(x, w);
            };
          }
          v.iterate(o, c(d));
          a && v.iterate(a, c(r));
          break;
        case "top":
          function b(w) {
            return function (x, z, y) {
              x = l.roundPixel(x * f + i) - e;
              m.moveTo(x, p[3]);
              m.lineTo(x, p[3] - w);
            };
          }
          v.iterate(o, b(d));
          a && v.iterate(a, b(r));
          break;
        case "angular":
          v.iterate(o, function (w, y, x) {
            w = (w / (k.max + 1)) * Math.PI * 2 + k.baseRotation;
            m.moveTo(
              k.centerX + k.length * Math.cos(w),
              k.centerY + k.length * Math.sin(w)
            );
            m.lineTo(
              k.centerX + (k.length + d) * Math.cos(w),
              k.centerY + (k.length + d) * Math.sin(w)
            );
          });
          break;
        case "gauge":
          var g = v.getGaugeAngles();
          v.iterate(o, function (w, y, x) {
            w =
              ((w - k.min) / (k.max - k.min + 1)) * k.totalAngle -
              k.totalAngle +
              g.start;
            m.moveTo(
              k.centerX + k.length * Math.cos(w),
              k.centerY + k.length * Math.sin(w)
            );
            m.lineTo(
              k.centerX + (k.length + d) * Math.cos(w),
              k.centerY + (k.length + d) * Math.sin(w)
            );
          });
          break;
      }
    }
  },
  renderLabels: function (E, q, D, K) {
    var o = this,
      k = o.attr,
      i = 0.5 * k.lineWidth,
      u = k.position,
      y = k.matrix,
      A = k.textPadding,
      x = y.getXX(),
      d = y.getDX(),
      g = y.getYY(),
      c = y.getDY(),
      n = 0,
      I = D.majorTicks,
      G = Math.max(k.majorTickSize, k.minorTickSize) + k.lineWidth,
      f = Ext.draw.Draw.isBBoxIntersect,
      F = o.getLabel(),
      J,
      s = o.getLabelOffset(),
      r = null,
      w = 0,
      b = 0,
      m = D.segmenter,
      B = o.getRenderer(),
      t = o.getAxis(),
      z = t.getTitle(),
      a = z && z.attr.text !== "" && z.getBBox(),
      l,
      h = null,
      p,
      C,
      v,
      e,
      H,
      j;
    if (I && F && !F.attr.hidden) {
      J = F.attr.font;
      if (q.font !== J) {
        q.font = J;
      }
      F.setAttributes({ translationX: 0, translationY: 0 }, true);
      F.applyTransformations();
      l = F.attr.inverseMatrix.elements.slice(0);
      switch (u) {
        case "left":
          e = a ? a.x + a.width : 0;
          switch (F.attr.textAlign) {
            case "start":
              H = E.roundPixel(e + d) - i;
              break;
            case "end":
              H = E.roundPixel(K[2] - G + d) - i;
              break;
            default:
              H = E.roundPixel(e + (K[2] - e - G) / 2 + d) - i;
          }
          F.setAttributes({ translationX: H }, true);
          break;
        case "right":
          e = a ? K[2] - a.x : 0;
          switch (F.attr.textAlign) {
            case "start":
              H = E.roundPixel(G + d) + i;
              break;
            case "end":
              H = E.roundPixel(K[2] - e + d) + i;
              break;
            default:
              H = E.roundPixel(G + (K[2] - G - e) / 2 + d) + i;
          }
          F.setAttributes({ translationX: H }, true);
          break;
        case "top":
          e = a ? a.y + a.height : 0;
          F.setAttributes(
            { translationY: E.roundPixel(e + (K[3] - e - G) / 2) - i },
            true
          );
          break;
        case "bottom":
          e = a ? K[3] - a.y : 0;
          F.setAttributes(
            { translationY: E.roundPixel(G + (K[3] - G - e) / 2) + i },
            true
          );
          break;
        case "radial":
          F.setAttributes({ translationX: k.centerX }, true);
          break;
        case "angular":
          F.setAttributes({ translationY: k.centerY }, true);
          break;
        case "gauge":
          F.setAttributes({ translationY: k.centerY }, true);
          break;
      }
      if (u === "left" || u === "right") {
        o.iterate(I, function (L, N, M) {
          if (N === undefined) {
            return;
          }
          if (B) {
            v = Ext.callback(B, null, [t, N, D, r], 0, t);
          } else {
            v = m.renderer(N, D, r);
          }
          r = N;
          F.setAttributes(
            { text: String(v), translationY: E.roundPixel(L * g + c) },
            true
          );
          F.applyTransformations();
          n = Math.max(n, F.getBBox().width + G);
          if (n <= o.thickness) {
            C = Ext.draw.Matrix.fly(F.attr.matrix.elements.slice(0));
            p = C.prepend.apply(C, l).transformBBox(F.getBBox(true));
            if (h && !f(p, h, A)) {
              return;
            }
            E.renderSprite(F);
            h = p;
            w += p.height;
            b++;
          }
        });
      } else {
        if (u === "top" || u === "bottom") {
          o.iterate(I, function (L, N, M) {
            if (N === undefined) {
              return;
            }
            if (B) {
              v = Ext.callback(B, null, [t, N, D, r], 0, t);
            } else {
              v = m.renderer(N, D, r);
            }
            r = N;
            F.setAttributes(
              { text: String(v), translationX: E.roundPixel(L * x + d) },
              true
            );
            F.applyTransformations();
            n = Math.max(n, F.getBBox().height + G);
            if (n <= o.thickness) {
              C = Ext.draw.Matrix.fly(F.attr.matrix.elements.slice(0));
              p = C.prepend.apply(C, l).transformBBox(F.getBBox(true));
              if (h && !f(p, h, A)) {
                return;
              }
              E.renderSprite(F);
              h = p;
              w += p.width;
              b++;
            }
          });
        } else {
          if (u === "radial") {
            o.iterate(I, function (L, N, M) {
              if (N === undefined) {
                return;
              }
              if (B) {
                v = Ext.callback(B, null, [t, N, D, r], 0, t);
              } else {
                v = m.renderer(N, D, r);
              }
              r = N;
              if (typeof v !== "undefined") {
                F.setAttributes(
                  {
                    text: String(v),
                    translationX:
                      k.centerX -
                      (E.roundPixel(L) / k.max) *
                        k.length *
                        Math.cos(k.baseRotation + Math.PI / 2),
                    translationY:
                      k.centerY -
                      (E.roundPixel(L) / k.max) *
                        k.length *
                        Math.sin(k.baseRotation + Math.PI / 2)
                  },
                  true
                );
                F.applyTransformations();
                p = F.attr.matrix.transformBBox(F.getBBox(true));
                if (h && !f(p, h)) {
                  return;
                }
                E.renderSprite(F);
                h = p;
                w += p.width;
                b++;
              }
            });
          } else {
            if (u === "angular") {
              s += k.majorTickSize + k.lineWidth * 0.5;
              o.iterate(I, function (L, N, M) {
                if (N === undefined) {
                  return;
                }
                if (B) {
                  v = Ext.callback(B, null, [t, N, D, r], 0, t);
                } else {
                  v = m.renderer(N, D, r);
                }
                r = N;
                n = Math.max(
                  n,
                  Math.max(k.majorTickSize, k.minorTickSize) +
                    (k.lineCap !== "butt" ? k.lineWidth * 0.5 : 0)
                );
                if (typeof v !== "undefined") {
                  var O = (L / (k.max + 1)) * Math.PI * 2 + k.baseRotation;
                  F.setAttributes(
                    {
                      text: String(v),
                      translationX: k.centerX + (k.length + s) * Math.cos(O),
                      translationY: k.centerY + (k.length + s) * Math.sin(O)
                    },
                    true
                  );
                  F.applyTransformations();
                  p = F.attr.matrix.transformBBox(F.getBBox(true));
                  if (h && !f(p, h)) {
                    return;
                  }
                  E.renderSprite(F);
                  h = p;
                  w += p.width;
                  b++;
                }
              });
            } else {
              if (u === "gauge") {
                j = o.getGaugeAngles();
                s += k.majorTickSize + k.lineWidth * 0.5;
                o.iterate(I, function (L, N, M) {
                  if (N === undefined) {
                    return;
                  }
                  if (B) {
                    v = Ext.callback(B, null, [t, N, D, r], 0, t);
                  } else {
                    v = m.renderer(N, D, r);
                  }
                  r = N;
                  if (typeof v !== "undefined") {
                    var O =
                      ((L - k.min) / (k.max - k.min + 1)) * k.totalAngle -
                      k.totalAngle +
                      j.start;
                    F.setAttributes(
                      {
                        text: String(v),
                        translationX: k.centerX + (k.length + s) * Math.cos(O),
                        translationY: k.centerY + (k.length + s) * Math.sin(O)
                      },
                      true
                    );
                    F.applyTransformations();
                    p = F.attr.matrix.transformBBox(F.getBBox(true));
                    if (h && !f(p, h)) {
                      return;
                    }
                    E.renderSprite(F);
                    h = p;
                    w += p.width;
                    b++;
                  }
                });
              }
            }
          }
        }
      }
      if (k.enlargeEstStepSizeByText && b) {
        w /= b;
        w += G;
        w *= 2;
        if (k.estStepSize < w) {
          k.estStepSize = w;
        }
      }
      if (Math.abs(o.thickness - n) > 1) {
        o.thickness = n;
        k.bbox.plain.dirty = true;
        k.bbox.transform.dirty = true;
        o.doThicknessChanged();
        return false;
      }
    }
  },
  renderAxisLine: function (a, i, e, c) {
    var h = this,
      g = h.attr,
      b = g.lineWidth * 0.5,
      j = g.position,
      d,
      f;
    if (g.axisLine && g.length) {
      switch (j) {
        case "left":
          d = a.roundPixel(c[2]) - b;
          i.moveTo(d, -g.endGap);
          i.lineTo(d, g.length + g.startGap + 1);
          break;
        case "right":
          i.moveTo(b, -g.endGap);
          i.lineTo(b, g.length + g.startGap + 1);
          break;
        case "bottom":
          i.moveTo(-g.startGap, b);
          i.lineTo(g.length + g.endGap, b);
          break;
        case "top":
          d = a.roundPixel(c[3]) - b;
          i.moveTo(-g.startGap, d);
          i.lineTo(g.length + g.endGap, d);
          break;
        case "angular":
          i.moveTo(g.centerX + g.length, g.centerY);
          i.arc(g.centerX, g.centerY, g.length, 0, Math.PI * 2, true);
          break;
        case "gauge":
          f = h.getGaugeAngles();
          i.moveTo(
            g.centerX + Math.cos(f.start) * g.length,
            g.centerY + Math.sin(f.start) * g.length
          );
          i.arc(g.centerX, g.centerY, g.length, f.start, f.end, true);
          break;
      }
    }
  },
  getGaugeAngles: function () {
    var a = this,
      c = a.attr.totalAngle,
      b;
    if (c <= Math.PI) {
      b = (Math.PI - c) * 0.5;
    } else {
      b = -(Math.PI * 2 - c) * 0.5;
    }
    b = Math.PI * 2 - b;
    return { start: b, end: b - c };
  },
  renderGridLines: function (m, n, s, r) {
    var t = this,
      b = t.getAxis(),
      l = t.attr,
      p = l.matrix,
      d = l.startGap,
      a = l.endGap,
      c = p.getXX(),
      k = p.getYY(),
      h = p.getDX(),
      g = p.getDY(),
      u = l.position,
      f = b.getGridAlignment(),
      q = s.majorTicks,
      e,
      o,
      i;
    if (l.grid) {
      if (q) {
        if (u === "left" || u === "right") {
          i = l.min * k + g + a + d;
          t.iterate(q, function (j, w, v) {
            e = j * k + g + a;
            t.putMarker(
              f + "-" + (v % 2 ? "odd" : "even"),
              { y: e, height: i - e },
              (o = v),
              true
            );
            i = e;
          });
          o++;
          e = 0;
          t.putMarker(
            f + "-" + (o % 2 ? "odd" : "even"),
            { y: e, height: i - e },
            o,
            true
          );
        } else {
          if (u === "top" || u === "bottom") {
            i = l.min * c + h + d;
            if (d) {
              t.putMarker(f + "-even", { x: 0, width: i }, -1, true);
            }
            t.iterate(q, function (j, w, v) {
              e = j * c + h + d;
              t.putMarker(
                f + "-" + (v % 2 ? "odd" : "even"),
                { x: e, width: i - e },
                (o = v),
                true
              );
              i = e;
            });
            o++;
            e = l.length + l.startGap + l.endGap;
            t.putMarker(
              f + "-" + (o % 2 ? "odd" : "even"),
              { x: e, width: i - e },
              o,
              true
            );
          } else {
            if (u === "radial") {
              t.iterate(q, function (j, w, v) {
                if (!j) {
                  return;
                }
                e = (j / l.max) * l.length;
                t.putMarker(
                  f + "-" + (v % 2 ? "odd" : "even"),
                  { scalingX: e, scalingY: e },
                  v,
                  true
                );
                i = e;
              });
            } else {
              if (u === "angular") {
                t.iterate(q, function (j, w, v) {
                  if (!l.length) {
                    return;
                  }
                  e = (j / (l.max + 1)) * Math.PI * 2 + l.baseRotation;
                  t.putMarker(
                    f + "-" + (v % 2 ? "odd" : "even"),
                    {
                      rotationRads: e,
                      rotationCenterX: 0,
                      rotationCenterY: 0,
                      scalingX: l.length,
                      scalingY: l.length
                    },
                    v,
                    true
                  );
                  i = e;
                });
              }
            }
          }
        }
      }
    }
  },
  renderLimits: function (o) {
    var t = this,
      a = t.getAxis(),
      h = a.getChart(),
      p = h.getInnerPadding(),
      d = Ext.Array.from(a.getLimits());
    if (!d.length) {
      return;
    }
    var r = a.limits.surface.getRect(),
      m = t.attr,
      n = m.matrix,
      u = m.position,
      k = Ext.Object.chain,
      v = a.limits.titles,
      c,
      j,
      b,
      s,
      l,
      q,
      f,
      g,
      e;
    v.instances = [];
    v.position = 0;
    if (u === "left" || u === "right") {
      for (q = 0, f = d.length; q < f; q++) {
        s = k(d[q]);
        !s.line && (s.line = {});
        l = Ext.isString(s.value) ? a.getCoordFor(s.value) : s.value;
        l = l * n.getYY() + n.getDY();
        s.line.y = l + p.top;
        s.line.strokeStyle = s.line.strokeStyle || m.strokeStyle;
        t.putMarker("horizontal-limit-lines", s.line, q, true);
        if (s.line.title) {
          v.add(s.line.title);
          c = v.getBBoxFor(v.position - 1);
          j = s.line.title.position || (u === "left" ? "start" : "end");
          switch (j) {
            case "start":
              g = 10;
              break;
            case "end":
              g = r[2] - 10;
              break;
            case "middle":
              g = r[2] / 2;
              break;
          }
          v.setAttributesFor(v.position - 1, {
            x: g,
            y: s.line.y - c.height / 2,
            textAlign: j,
            fillStyle: s.line.title.fillStyle || s.line.strokeStyle
          });
        }
      }
    } else {
      if (u === "top" || u === "bottom") {
        for (q = 0, f = d.length; q < f; q++) {
          s = k(d[q]);
          !s.line && (s.line = {});
          l = Ext.isString(s.value) ? a.getCoordFor(s.value) : s.value;
          l = l * n.getXX() + n.getDX();
          s.line.x = l + p.left;
          s.line.strokeStyle = s.line.strokeStyle || m.strokeStyle;
          t.putMarker("vertical-limit-lines", s.line, q, true);
          if (s.line.title) {
            v.add(s.line.title);
            c = v.getBBoxFor(v.position - 1);
            j = s.line.title.position || (u === "top" ? "end" : "start");
            switch (j) {
              case "start":
                e = r[3] - c.width / 2 - 10;
                break;
              case "end":
                e = c.width / 2 + 10;
                break;
              case "middle":
                e = r[3] / 2;
                break;
            }
            v.setAttributesFor(v.position - 1, {
              x: s.line.x + c.height / 2,
              y: e,
              fillStyle: s.line.title.fillStyle || s.line.strokeStyle,
              rotationRads: Math.PI / 2
            });
          }
        }
      } else {
        if (u === "radial") {
          for (q = 0, f = d.length; q < f; q++) {
            s = k(d[q]);
            !s.line && (s.line = {});
            l = Ext.isString(s.value) ? a.getCoordFor(s.value) : s.value;
            if (l > m.max) {
              continue;
            }
            l = (l / m.max) * m.length;
            s.line.cx = m.centerX;
            s.line.cy = m.centerY;
            s.line.scalingX = l;
            s.line.scalingY = l;
            s.line.strokeStyle = s.line.strokeStyle || m.strokeStyle;
            t.putMarker("circular-limit-lines", s.line, q, true);
            if (s.line.title) {
              v.add(s.line.title);
              c = v.getBBoxFor(v.position - 1);
              v.setAttributesFor(v.position - 1, {
                x: m.centerX,
                y: m.centerY - l - c.height / 2,
                fillStyle: s.line.title.fillStyle || s.line.strokeStyle
              });
            }
          }
        } else {
          if (u === "angular") {
            for (q = 0, f = d.length; q < f; q++) {
              s = k(d[q]);
              !s.line && (s.line = {});
              l = Ext.isString(s.value) ? a.getCoordFor(s.value) : s.value;
              l = (l / (m.max + 1)) * Math.PI * 2 + m.baseRotation;
              s.line.translationX = m.centerX;
              s.line.translationY = m.centerY;
              s.line.rotationRads = l;
              s.line.rotationCenterX = 0;
              s.line.rotationCenterY = 0;
              s.line.scalingX = m.length;
              s.line.scalingY = m.length;
              s.line.strokeStyle = s.line.strokeStyle || m.strokeStyle;
              t.putMarker("radial-limit-lines", s.line, q, true);
              if (s.line.title) {
                v.add(s.line.title);
                c = v.getBBoxFor(v.position - 1);
                b =
                  (l > -0.5 * Math.PI && l < 0.5 * Math.PI) ||
                  (l > 1.5 * Math.PI && l < 2 * Math.PI)
                    ? 1
                    : -1;
                v.setAttributesFor(v.position - 1, {
                  x:
                    m.centerX +
                    0.5 * m.length * Math.cos(l) +
                    ((b * c.height) / 2) * Math.sin(l),
                  y:
                    m.centerY +
                    0.5 * m.length * Math.sin(l) -
                    ((b * c.height) / 2) * Math.cos(l),
                  rotationRads: b === 1 ? l : l - Math.PI,
                  fillStyle: s.line.title.fillStyle || s.line.strokeStyle
                });
              }
            }
          } else {
            if (u === "gauge") {
            }
          }
        }
      }
    }
  },
  doThicknessChanged: function () {
    var a = this.getAxis();
    if (a) {
      a.onThicknessChanged();
    }
  },
  render: function (a, c, e) {
    var d = this,
      b = d.getLayoutContext();
    if (b) {
      if (false === d.renderLabels(a, c, b, e)) {
        return false;
      }
      c.beginPath();
      d.renderTicks(a, c, b, e);
      d.renderAxisLine(a, c, b, e);
      d.renderGridLines(a, c, b, e);
      d.renderLimits(e);
      c.stroke();
    }
  }
});
Ext.define("Ext.chart.axis.segmenter.Segmenter", {
  config: { axis: null },
  constructor: function (a) {
    this.initConfig(a);
  },
  renderer: function (b, a) {
    return String(b);
  },
  from: function (a) {
    return a;
  },
  diff: Ext.emptyFn,
  align: Ext.emptyFn,
  add: Ext.emptyFn,
  preferredStep: Ext.emptyFn
});
Ext.define("Ext.chart.axis.segmenter.Names", {
  extend: "Ext.chart.axis.segmenter.Segmenter",
  alias: "segmenter.names",
  renderer: function (b, a) {
    return b;
  },
  diff: function (b, a, c) {
    return Math.floor(a - b);
  },
  align: function (c, b, a) {
    return Math.floor(c);
  },
  add: function (c, b, a) {
    return c + b;
  },
  preferredStep: function (c, a, b, d) {
    return { unit: 1, step: 1 };
  }
});
Ext.define("Ext.chart.axis.segmenter.Numeric", {
  extend: "Ext.chart.axis.segmenter.Segmenter",
  alias: "segmenter.numeric",
  isNumeric: true,
  renderer: function (b, a) {
    return b.toFixed(Math.max(0, a.majorTicks.unit.fixes));
  },
  diff: function (b, a, c) {
    return Math.floor((a - b) / c.scale);
  },
  align: function (d, c, b) {
    var a = b.scale * c;
    return Math.floor(d / a) * a;
  },
  add: function (c, b, a) {
    return c + b * a.scale;
  },
  preferredStep: function (c, b) {
    var a = Math.floor(Math.log(b) * Math.LOG10E),
      d = Math.pow(10, a);
    b /= d;
    if (b < 2) {
      b = 2;
    } else {
      if (b < 5) {
        b = 5;
      } else {
        if (b < 10) {
          b = 10;
          a++;
        }
      }
    }
    return { unit: { fixes: -a, scale: d }, step: b };
  },
  leadingZeros: function (a) {
    return -Math.floor(Ext.Number.log10(Math.abs(a)));
  },
  exactStep: function (b, a) {
    var c = this.leadingZeros(a),
      d = Math.pow(10, c);
    return {
      unit: { fixes: c + (a % d === 0 ? 0 : 1), scale: a < 1 ? a : 1 },
      step: a < 1 ? 1 : a
    };
  },
  adjustByMajorUnit: function (e, g, c) {
    var d = c[0],
      b = c[1],
      a = e * g,
      f = d % a;
    if (f !== 0) {
      c[0] = d - f + (d < 0 ? -a : 0);
    }
    f = b % a;
    if (f !== 0) {
      c[1] = b - f + (b > 0 ? a : 0);
    }
  }
});
Ext.define("Ext.chart.axis.segmenter.Time", {
  extend: "Ext.chart.axis.segmenter.Segmenter",
  alias: "segmenter.time",
  config: { step: null },
  renderer: function (c, b) {
    var a = Ext.Date;
    switch (b.majorTicks.unit) {
      case "y":
        return a.format(c, "Y");
      case "mo":
        return a.format(c, "Y-m");
      case "d":
        return a.format(c, "Y-m-d");
    }
    return a.format(c, "Y-m-d\nH:i:s");
  },
  from: function (a) {
    return new Date(a);
  },
  diff: function (b, a, c) {
    if (isFinite(b)) {
      b = new Date(b);
    }
    if (isFinite(a)) {
      a = new Date(a);
    }
    return Ext.Date.diff(b, a, c);
  },
  updateStep: function () {
    var a = this.getAxis();
    if (a && !this.isConfiguring) {
      a.performLayout();
    }
  },
  align: function (a, c, b) {
    if (b === "d" && c >= 7) {
      a = Ext.Date.align(a, "d", c);
      a.setDate(a.getDate() - a.getDay() + 1);
      return a;
    } else {
      return Ext.Date.align(a, b, c);
    }
  },
  add: function (c, b, a) {
    return Ext.Date.add(new Date(c), a, b);
  },
  stepUnits: [
    [Ext.Date.YEAR, 1, 2, 5, 10, 20, 50, 100, 200, 500],
    [Ext.Date.MONTH, 1, 3, 6],
    [Ext.Date.DAY, 1, 7, 14],
    [Ext.Date.HOUR, 1, 6, 12],
    [Ext.Date.MINUTE, 1, 5, 15, 30],
    [Ext.Date.SECOND, 1, 5, 15, 30],
    [Ext.Date.MILLI, 1, 2, 5, 10, 20, 50, 100, 200, 500]
  ],
  preferredStep: function (b, e) {
    if (this.getStep()) {
      return this.getStep();
    }
    var f = new Date(+b),
      g = new Date(+b + Math.ceil(e)),
      d = this.stepUnits,
      l,
      k,
      h,
      c,
      a;
    for (c = 0; c < d.length; c++) {
      k = d[c][0];
      h = this.diff(f, g, k);
      if (h > 0) {
        for (a = 1; a < d[c].length; a++) {
          if (h <= d[c][a]) {
            l = { unit: k, step: d[c][a] };
            break;
          }
        }
        if (!l) {
          c--;
          l = { unit: d[c][0], step: 1 };
        }
        break;
      }
    }
    if (!l) {
      l = { unit: Ext.Date.DAY, step: 1 };
    }
    return l;
  }
});
Ext.define("Ext.chart.axis.layout.Layout", {
  mixins: { observable: "Ext.mixin.Observable" },
  config: { axis: null },
  constructor: function (a) {
    this.mixins.observable.constructor.call(this, a);
  },
  processData: function (b) {
    var e = this,
      c = e.getAxis(),
      f = c.getDirection(),
      g = c.boundSeries,
      a,
      d;
    if (b) {
      b["coordinate" + f]();
    } else {
      for (a = 0, d = g.length; a < d; a++) {
        g[a]["coordinate" + f]();
      }
    }
  },
  calculateMajorTicks: function (a) {
    var f = this,
      e = a.attr,
      d = e.max - e.min,
      i = (d / Math.max(1, e.length)) * (e.visibleMax - e.visibleMin),
      h = e.min + d * e.visibleMin,
      b = e.min + d * e.visibleMax,
      g = e.estStepSize * i,
      c = f.snapEnds(a, e.min, e.max, g);
    if (c) {
      f.trimByRange(a, c, h, b);
      a.majorTicks = c;
    }
  },
  calculateMinorTicks: function (a) {
    if (this.snapMinorEnds) {
      a.minorTicks = this.snapMinorEnds(a);
    }
  },
  calculateLayout: function (b) {
    var c = this,
      a = b.attr;
    if (a.length === 0) {
      return null;
    }
    if (a.majorTicks) {
      c.calculateMajorTicks(b);
      if (a.minorTicks) {
        c.calculateMinorTicks(b);
      }
    }
  },
  snapEnds: Ext.emptyFn,
  trimByRange: function (b, f, i, a) {
    var g = b.segmenter,
      j = f.unit,
      h = g.diff(f.from, i, j),
      d = g.diff(f.from, a, j),
      c = Math.max(0, Math.ceil(h / f.step)),
      e = Math.min(f.steps, Math.floor(d / f.step));
    if (e < f.steps) {
      f.to = g.add(f.from, e * f.step, j);
    }
    if (f.max > a) {
      f.max = f.to;
    }
    if (f.from < i) {
      f.from = g.add(f.from, c * f.step, j);
      while (f.from < i) {
        c++;
        f.from = g.add(f.from, f.step, j);
      }
    }
    if (f.min < i) {
      f.min = f.from;
    }
    f.steps = e - c;
  }
});
Ext.define("Ext.chart.axis.layout.Discrete", {
  extend: "Ext.chart.axis.layout.Layout",
  alias: "axisLayout.discrete",
  isDiscrete: true,
  processData: function () {
    var f = this,
      d = f.getAxis(),
      c = d.boundSeries,
      g = d.getDirection(),
      b,
      e,
      a;
    f.labels = [];
    f.labelMap = {};
    for (b = 0, e = c.length; b < e; b++) {
      a = c[b];
      if (a["get" + g + "Axis"]() === d) {
        a["coordinate" + g]();
      }
    }
    d.getSprites()[0].setAttributes({ data: f.labels });
    f.fireEvent("datachange", f.labels);
  },
  calculateLayout: function (a) {
    a.data = this.labels;
    this.callParent([a]);
  },
  calculateMajorTicks: function (e) {
    var f = this,
      a = e.attr,
      h = e.data,
      b = a.max - a.min,
      g = a.min + b * a.visibleMin,
      d = a.min + b * a.visibleMax,
      c;
    c = f.snapEnds(e, Math.max(0, a.min), Math.min(a.max, h.length - 1), 1);
    if (c) {
      f.trimByRange(e, c, g, d);
      e.majorTicks = c;
    }
  },
  snapEnds: function (e, d, a, b) {
    b = Math.ceil(b);
    var c = Math.floor((a - d) / b),
      f = e.data;
    return {
      min: d,
      max: a,
      from: d,
      to: c * b + d,
      step: b,
      steps: c,
      unit: 1,
      getLabel: function (g) {
        return f[this.from + this.step * g];
      },
      get: function (g) {
        return this.from + this.step * g;
      }
    };
  },
  trimByRange: function (b, f, h, a) {
    var i = f.unit,
      g = Math.ceil((h - f.from) / i) * i,
      d = Math.floor((a - f.from) / i) * i,
      c = Math.max(0, Math.ceil(g / f.step)),
      e = Math.min(f.steps, Math.floor(d / f.step));
    if (e < f.steps) {
      f.to = e;
    }
    if (f.max > a) {
      f.max = f.to;
    }
    if (f.from < h && f.step > 0) {
      f.from = f.from + c * f.step * i;
      while (f.from < h) {
        c++;
        f.from += f.step * i;
      }
    }
    if (f.min < h) {
      f.min = f.from;
    }
    f.steps = e - c;
  },
  getCoordFor: function (c, d, a, b) {
    this.labels.push(c);
    return this.labels.length - 1;
  }
});
Ext.define("Ext.chart.axis.layout.CombineDuplicate", {
  extend: "Ext.chart.axis.layout.Discrete",
  alias: "axisLayout.combineDuplicate",
  getCoordFor: function (d, e, b, c) {
    if (!(d in this.labelMap)) {
      var a = (this.labelMap[d] = this.labels.length);
      this.labels.push(d);
      return a;
    }
    return this.labelMap[d];
  }
});
Ext.define("Ext.chart.axis.layout.Continuous", {
  extend: "Ext.chart.axis.layout.Layout",
  alias: "axisLayout.continuous",
  isContinuous: true,
  config: { adjustMinimumByMajorUnit: false, adjustMaximumByMajorUnit: false },
  getCoordFor: function (c, d, a, b) {
    return +c;
  },
  snapEnds: function (a, d, i, h) {
    var f = a.segmenter,
      c = this.getAxis(),
      l = c.getMajorTickSteps(),
      e =
        l && f.exactStep ? f.exactStep(d, (i - d) / l) : f.preferredStep(d, h),
      k = e.unit,
      b = e.step,
      j = l ? d : f.align(d, b, k),
      g = (l || f.diff(d, i, k)) + 1;
    return {
      min: f.from(d),
      max: f.from(i),
      from: j,
      to: f.add(j, g * b, k),
      step: b,
      steps: g,
      unit: k,
      get: function (m) {
        return f.add(this.from, this.step * m, this.unit);
      }
    };
  },
  snapMinorEnds: function (a) {
    var e = a.majorTicks,
      m = this.getAxis().getMinorTickSteps(),
      f = a.segmenter,
      d = e.min,
      i = e.max,
      k = e.from,
      l = e.unit,
      b = e.step / m,
      n = b * l.scale,
      j = k - d,
      c = Math.floor(j / n),
      h = c + Math.floor((i - e.to) / n) + 1,
      g = e.steps * m + h;
    return {
      min: d,
      max: i,
      from: d + (j % n),
      to: f.add(k, g * b, l),
      step: b,
      steps: g,
      unit: l,
      get: function (o) {
        return (o % m) + c + 1 !== 0
          ? f.add(this.from, this.step * o, l)
          : null;
      }
    };
  }
});
Ext.define("Ext.chart.axis.Axis", {
  xtype: "axis",
  mixins: { observable: "Ext.mixin.Observable" },
  requires: [
    "Ext.chart.axis.sprite.Axis",
    "Ext.chart.axis.segmenter.*",
    "Ext.chart.axis.layout.*"
  ],
  isAxis: true,
  config: {
    position: "bottom",
    fields: [],
    label: undefined,
    grid: false,
    limits: null,
    renderer: null,
    chart: null,
    style: null,
    margin: 0,
    titleMargin: 4,
    background: null,
    minimum: NaN,
    maximum: NaN,
    reconcileRange: false,
    minZoom: 1,
    maxZoom: 10000,
    layout: "continuous",
    segmenter: "numeric",
    hidden: false,
    majorTickSteps: 0,
    minorTickSteps: 0,
    adjustByMajorUnit: true,
    title: null,
    increment: 0.5,
    length: 0,
    center: null,
    radius: null,
    totalAngle: Math.PI,
    rotation: null,
    labelInSpan: null,
    visibleRange: [0, 1],
    needHighPrecision: false,
    linkedTo: null,
    floating: null
  },
  titleOffset: 0,
  spriteAnimationCount: 0,
  prevMin: 0,
  prevMax: 1,
  boundSeries: [],
  sprites: null,
  surface: null,
  range: null,
  xValues: [],
  yValues: [],
  masterAxis: null,
  applyRotation: function (b) {
    var a = Math.PI * 2;
    return (((b % a) + Math.PI) % a) - Math.PI;
  },
  updateRotation: function (b) {
    var c = this.getSprites(),
      a = this.getPosition();
    if (!this.getHidden() && a === "angular" && c[0]) {
      c[0].setAttributes({ baseRotation: b });
    }
  },
  applyTitle: function (c, b) {
    var a;
    if (Ext.isString(c)) {
      c = { text: c };
    }
    if (!b) {
      b = Ext.create("sprite.text", c);
      if ((a = this.getSurface())) {
        a.add(b);
      }
    } else {
      b.setAttributes(c);
    }
    return b;
  },
  applyFloating: function (b, a) {
    if (b === null) {
      b = { value: null, alongAxis: null };
    } else {
      if (Ext.isNumber(b)) {
        b = { value: b, alongAxis: null };
      }
    }
    if (Ext.isObject(b)) {
      if (a && a.alongAxis) {
        delete this.getChart().getAxis(a.alongAxis).floatingAxes[this.getId()];
      }
      return b;
    }
    return a;
  },
  constructor: function (a) {
    var b = this,
      c;
    b.sprites = [];
    b.labels = [];
    b.floatingAxes = {};
    a = a || {};
    if (a.position === "angular") {
      a.style = a.style || {};
      a.style.estStepSize = 1;
    }
    if ("id" in a) {
      c = a.id;
    } else {
      if ("id" in b.config) {
        c = b.config.id;
      } else {
        c = b.getId();
      }
    }
    b.setId(c);
    b.mixins.observable.constructor.apply(b, arguments);
  },
  getAlignment: function () {
    switch (this.getPosition()) {
      case "left":
      case "right":
        return "vertical";
      case "top":
      case "bottom":
        return "horizontal";
      case "radial":
        return "radial";
      case "angular":
        return "angular";
    }
  },
  getGridAlignment: function () {
    switch (this.getPosition()) {
      case "left":
      case "right":
        return "horizontal";
      case "top":
      case "bottom":
        return "vertical";
      case "radial":
        return "circular";
      case "angular":
        return "radial";
    }
  },
  getSurface: function () {
    var e = this,
      d = e.getChart();
    if (d && !e.surface) {
      var b = (e.surface = d.getSurface(e.getId(), "axis")),
        c = (e.gridSurface = d.getSurface("main")),
        a = e.getSprites()[0],
        f = e.getGridAlignment();
      c.waitFor(b);
      e.getGrid();
      if (e.getLimits() && f) {
        f = f.replace("3d", "");
        e.limits = {
          surface: d.getSurface("overlay"),
          lines: new Ext.chart.Markers(),
          titles: new Ext.draw.sprite.Instancing()
        };
        e.limits.lines.setTemplate({ xclass: "grid." + f });
        e.limits.lines
          .getTemplate()
          .setAttributes({ strokeStyle: "black" }, true);
        e.limits.surface.add(e.limits.lines);
        a.bindMarker(f + "-limit-lines", e.limits.lines);
        e.limitTitleTpl = new Ext.draw.sprite.Text();
        e.limits.titles.setTemplate(e.limitTitleTpl);
        e.limits.surface.add(e.limits.titles);
        d.on("redraw", e.renderLimits, e);
      }
    }
    return e.surface;
  },
  applyGrid: function (a) {
    if (a === true) {
      return {};
    }
    return a;
  },
  updateGrid: function (b) {
    var e = this,
      d = e.getChart();
    if (!d) {
      e.on({ chartattached: Ext.bind(e.updateGrid, e, [b]), single: true });
      return;
    }
    var c = e.gridSurface,
      a = e.getSprites()[0],
      f = e.getGridAlignment(),
      g;
    if (b) {
      g = e.gridSpriteEven;
      if (!g) {
        g = e.gridSpriteEven = new Ext.chart.Markers();
        g.setTemplate({ xclass: "grid." + f });
        c.add(g);
        a.bindMarker(f + "-even", g);
      }
      if (Ext.isObject(b)) {
        g.getTemplate().setAttributes(b);
        if (Ext.isObject(b.even)) {
          g.getTemplate().setAttributes(b.even);
        }
      }
      g = e.gridSpriteOdd;
      if (!g) {
        g = e.gridSpriteOdd = new Ext.chart.Markers();
        g.setTemplate({ xclass: "grid." + f });
        c.add(g);
        a.bindMarker(f + "-odd", g);
      }
      if (Ext.isObject(b)) {
        g.getTemplate().setAttributes(b);
        if (Ext.isObject(b.odd)) {
          g.getTemplate().setAttributes(b.odd);
        }
      }
    }
  },
  updateMinorTickSteps: function (d) {
    var c = this,
      e = c.getSprites(),
      b = e && e[0],
      a;
    if (b) {
      b.setAttributes({ minorTicks: !!d });
      a = c.getSurface();
      if (!c.isConfiguring && a) {
        a.renderFrame();
      }
    }
  },
  renderLimits: function () {
    this.getSprites()[0].renderLimits();
  },
  getCoordFor: function (c, d, a, b) {
    return this.getLayout().getCoordFor(c, d, a, b);
  },
  applyPosition: function (a) {
    return a.toLowerCase();
  },
  applyLength: function (b, a) {
    return b > 0 ? b : a;
  },
  applyLabel: function (b, a) {
    if (!a) {
      a = new Ext.draw.sprite.Text({});
    }
    if (this.limitTitleTpl) {
      this.limitTitleTpl.setAttributes(b);
    }
    a.setAttributes(b);
    return a;
  },
  applyLayout: function (b, a) {
    b = Ext.factory(b, null, a, "axisLayout");
    b.setAxis(this);
    return b;
  },
  applySegmenter: function (a, b) {
    a = Ext.factory(a, null, b, "segmenter");
    a.setAxis(this);
    return a;
  },
  updateMinimum: function () {
    this.range = null;
  },
  updateMaximum: function () {
    this.range = null;
  },
  hideLabels: function () {
    this.getSprites()[0].setDirty(true);
    this.setLabel({ hidden: true });
  },
  showLabels: function () {
    this.getSprites()[0].setDirty(true);
    this.setLabel({ hidden: false });
  },
  renderFrame: function () {
    this.getSurface().renderFrame();
  },
  updateChart: function (d, b) {
    var c = this,
      a;
    if (b) {
      b.unregister(c);
      b.un("serieschange", c.onSeriesChange, c);
      b.un("redraw", c.renderLimits, c);
      c.linkAxis();
      c.fireEvent("chartdetached", b, c);
    }
    if (d) {
      d.on("serieschange", c.onSeriesChange, c);
      c.surface = null;
      a = c.getSurface();
      c.getLabel().setSurface(a);
      a.add(c.getSprites());
      a.add(c.getTitle());
      d.register(c);
      c.fireEvent("chartattached", d, c);
    }
  },
  applyBackground: function (a) {
    var b = Ext.ClassManager.getByAlias("sprite.rect");
    return b.def.normalize(a);
  },
  processData: function () {
    this.getLayout().processData();
    this.range = null;
  },
  getDirection: function () {
    return this.getChart().getDirectionForAxis(this.getPosition());
  },
  isSide: function () {
    var a = this.getPosition();
    return a === "left" || a === "right";
  },
  applyFields: function (a) {
    return Ext.Array.from(a);
  },
  applyVisibleRange: function (a, c) {
    this.getChart();
    if (a[0] > a[1]) {
      var b = a[0];
      a[0] = a[1];
      a[0] = b;
    }
    if (a[1] === a[0]) {
      a[1] += 1 / this.getMaxZoom();
    }
    if (a[1] > a[0] + 1) {
      a[0] = 0;
      a[1] = 1;
    } else {
      if (a[0] < 0) {
        a[1] -= a[0];
        a[0] = 0;
      } else {
        if (a[1] > 1) {
          a[0] -= a[1] - 1;
          a[1] = 1;
        }
      }
    }
    if (c && a[0] === c[0] && a[1] === c[1]) {
      return undefined;
    }
    return a;
  },
  updateVisibleRange: function (a) {
    this.fireEvent("visiblerangechange", this, a);
  },
  onSeriesChange: function (e) {
    var f = this,
      b = e.getSeries(),
      j = "get" + f.getDirection() + "Axis",
      g = [],
      c,
      d = b.length,
      a,
      h;
    for (c = 0; c < d; c++) {
      if (this === b[c][j]()) {
        g.push(b[c]);
      }
    }
    f.boundSeries = g;
    a = f.getLinkedTo();
    h = !Ext.isEmpty(a) && e.getAxis(a);
    if (h) {
      f.linkAxis(h);
    } else {
      f.getLayout().processData();
    }
  },
  linkAxis: function (a) {
    var c = this;
    function b(f, d, e) {
      e.getLayout()[f]("datachange", "onDataChange", d);
      e[f]("rangechange", "onMasterAxisRangeChange", d);
    }
    if (c.masterAxis) {
      if (!c.masterAxis.destroyed) {
        b("un", c, c.masterAxis);
      }
      c.masterAxis = null;
    }
    if (a) {
      if (a.type !== this.type) {
        Ext.Error.raise("Linked axes must be of the same type.");
      }
      b("on", c, a);
      c.onDataChange(a.getLayout().labels);
      c.onMasterAxisRangeChange(a, a.range);
      c.setStyle(Ext.apply({}, c.config.style, a.config.style));
      c.setTitle(Ext.apply({}, c.config.title, a.config.title));
      c.setLabel(Ext.apply({}, c.config.label, a.config.label));
      c.masterAxis = a;
    }
  },
  onDataChange: function (a) {
    this.getLayout().labels = a;
  },
  onMasterAxisRangeChange: function (b, a) {
    this.range = a;
  },
  applyRange: function (a) {
    if (!a) {
      return this.dataRange.slice(0);
    } else {
      return [
        a[0] === null ? this.dataRange[0] : a[0],
        a[1] === null ? this.dataRange[1] : a[1]
      ];
    }
  },
  getRange: function () {
    var m = this;
    if (m.range) {
      return m.range;
    } else {
      if (m.masterAxis) {
        return m.masterAxis.range;
      }
    }
    if (Ext.isNumber(m.getMinimum()) && Ext.isNumber(m.getMaximum())) {
      return (m.range = [m.getMinimum(), m.getMaximum()]);
    }
    var d = Infinity,
      n = -Infinity,
      o = m.boundSeries,
      h = m.getLayout(),
      l = m.getSegmenter(),
      p = m.getVisibleRange(),
      b = "get" + m.getDirection() + "Range",
      a,
      j,
      g,
      f,
      e,
      k;
    for (e = 0, k = o.length; e < k; e++) {
      f = o[e];
      var c = f[b]();
      if (c) {
        if (c[0] < d) {
          d = c[0];
        }
        if (c[1] > n) {
          n = c[1];
        }
      }
    }
    if (!isFinite(n)) {
      n = m.prevMax;
    }
    if (!isFinite(d)) {
      d = m.prevMin;
    }
    if (m.getLabelInSpan() || d === n) {
      n += m.getIncrement();
      d -= m.getIncrement();
    }
    if (Ext.isNumber(m.getMinimum())) {
      d = m.getMinimum();
    } else {
      m.prevMin = d;
    }
    if (Ext.isNumber(m.getMaximum())) {
      n = m.getMaximum();
    } else {
      m.prevMax = n;
    }
    m.range = [Ext.Number.correctFloat(d), Ext.Number.correctFloat(n)];
    if (m.getReconcileRange()) {
      m.reconcileRange();
    }
    if (
      m.getAdjustByMajorUnit() &&
      l.adjustByMajorUnit &&
      !m.getMajorTickSteps()
    ) {
      j = Ext.Object.chain(m.getSprites()[0].attr);
      j.min = m.range[0];
      j.max = m.range[1];
      j.visibleMin = p[0];
      j.visibleMax = p[1];
      a = { attr: j, segmenter: l };
      h.calculateLayout(a);
      g = a.majorTicks;
      if (g) {
        l.adjustByMajorUnit(g.step, g.unit.scale, m.range);
        j.min = m.range[0];
        j.max = m.range[1];
        a.majorTicks = null;
        h.calculateLayout(a);
        g = a.majorTicks;
        l.adjustByMajorUnit(g.step, g.unit.scale, m.range);
      } else {
        if (!m.hasClearRangePending) {
          m.hasClearRangePending = true;
          m.getChart().on("layout", "clearRange", m);
        }
      }
    }
    if (!Ext.Array.equals(m.range, m.oldRange || [])) {
      m.fireEvent("rangechange", m, m.range);
      m.oldRange = m.range;
    }
    return m.range;
  },
  clearRange: function () {
    this.hasClearRangePending = null;
    this.range = null;
  },
  reconcileRange: function () {
    var e = this,
      g = e.getChart().getAxes(),
      f = e.getDirection(),
      b,
      d,
      c,
      a;
    if (!g) {
      return;
    }
    for (b = 0, d = g.length; b < d; b++) {
      c = g[b];
      a = c.getRange();
      if (c === e || c.getDirection() !== f || !a || !c.getReconcileRange()) {
        continue;
      }
      if (a[0] < e.range[0]) {
        e.range[0] = a[0];
      }
      if (a[1] > e.range[1]) {
        e.range[1] = a[1];
      }
    }
  },
  applyStyle: function (c, b) {
    var a = Ext.ClassManager.getByAlias("sprite." + this.seriesType);
    if (a && a.def) {
      c = a.def.normalize(c);
    }
    b = Ext.apply(b || {}, c);
    return b;
  },
  themeOnlyIfConfigured: { grid: true },
  updateTheme: function (d) {
    var i = this,
      k = d.getAxis(),
      e = i.getPosition(),
      o = i.getInitialConfig(),
      c = i.defaultConfig,
      g = i.self.getConfigurator().configs,
      a = k.defaults,
      n = k[e],
      h = i.themeOnlyIfConfigured,
      l,
      j,
      p,
      b,
      m,
      f;
    k = Ext.merge({}, a, n);
    for (l in k) {
      j = k[l];
      f = g[l];
      if (j !== null && j !== undefined && f) {
        m = o[l];
        p = Ext.isObject(j);
        b = m === c[l];
        if (p) {
          if (b && h[l]) {
            continue;
          }
          j = Ext.merge({}, j, m);
        }
        if (b || p) {
          i[f.names.set](j);
        }
      }
    }
  },
  updateCenter: function (b) {
    var e = this.getSprites(),
      a = e[0],
      d = b[0],
      c = b[1];
    if (a) {
      a.setAttributes({ centerX: d, centerY: c });
    }
    if (this.gridSpriteEven) {
      this.gridSpriteEven.getTemplate().setAttributes({
        translationX: d,
        translationY: c,
        rotationCenterX: d,
        rotationCenterY: c
      });
    }
    if (this.gridSpriteOdd) {
      this.gridSpriteOdd.getTemplate().setAttributes({
        translationX: d,
        translationY: c,
        rotationCenterX: d,
        rotationCenterY: c
      });
    }
  },
  getSprites: function () {
    if (!this.getChart()) {
      return;
    }
    var i = this,
      e = i.getRange(),
      f = i.getPosition(),
      g = i.getChart(),
      c = g.getAnimation(),
      d,
      a,
      b = i.getLength(),
      h = i.superclass;
    if (c === false) {
      c = { duration: 0 };
    }
    if (e) {
      a = Ext.applyIf(
        {
          position: f,
          axis: i,
          min: e[0],
          max: e[1],
          length: b,
          grid: i.getGrid(),
          hidden: i.getHidden(),
          titleOffset: i.titleOffset,
          layout: i.getLayout(),
          segmenter: i.getSegmenter(),
          totalAngle: i.getTotalAngle(),
          label: i.getLabel()
        },
        i.getStyle()
      );
      if (!i.sprites.length) {
        while (!h.xtype) {
          h = h.superclass;
        }
        d = Ext.create("sprite." + h.xtype, a);
        d.fx.setCustomDurations({ baseRotation: 0 });
        d.fx.on("animationstart", "onAnimationStart", i);
        d.fx.on("animationend", "onAnimationEnd", i);
        d.setLayout(i.getLayout());
        d.setSegmenter(i.getSegmenter());
        d.setLabel(i.getLabel());
        i.sprites.push(d);
        i.updateTitleSprite();
      } else {
        d = i.sprites[0];
        d.setAnimation(c);
        d.setAttributes(a);
      }
      if (i.getRenderer()) {
        d.setRenderer(i.getRenderer());
      }
    }
    return i.sprites;
  },
  performLayout: function () {
    if (this.isConfiguring) {
      return;
    }
    var d = this,
      e = d.getSprites(),
      a = d.getSurface(),
      c = d.getChart(),
      b = e && e.length && e[0];
    if (c && a && b) {
      b.callUpdater(null, "layout");
      c.scheduleLayout();
    }
  },
  updateTitleSprite: function () {
    var f = this,
      b = f.getLength();
    if (!f.sprites[0] || !Ext.isNumber(b)) {
      return;
    }
    var h = this.sprites[0].thickness,
      a = f.getSurface(),
      g = f.getTitle(),
      e = f.getPosition(),
      c = f.getMargin(),
      i = f.getTitleMargin(),
      d = a.roundPixel(b / 2);
    if (g) {
      switch (e) {
        case "top":
          g.setAttributes(
            { x: d, y: c + i / 2, textBaseline: "top", textAlign: "center" },
            true
          );
          g.applyTransformations();
          f.titleOffset = g.getBBox().height + i;
          break;
        case "bottom":
          g.setAttributes(
            { x: d, y: h + i / 2, textBaseline: "top", textAlign: "center" },
            true
          );
          g.applyTransformations();
          f.titleOffset = g.getBBox().height + i;
          break;
        case "left":
          g.setAttributes(
            {
              x: c + i / 2,
              y: d,
              textBaseline: "top",
              textAlign: "center",
              rotationCenterX: c + i / 2,
              rotationCenterY: d,
              rotationRads: -Math.PI / 2
            },
            true
          );
          g.applyTransformations();
          f.titleOffset = g.getBBox().width + i;
          break;
        case "right":
          g.setAttributes(
            {
              x: h - c + i / 2,
              y: d,
              textBaseline: "bottom",
              textAlign: "center",
              rotationCenterX: h + i / 2,
              rotationCenterY: d,
              rotationRads: Math.PI / 2
            },
            true
          );
          g.applyTransformations();
          f.titleOffset = g.getBBox().width + i;
          break;
      }
    }
  },
  onThicknessChanged: function () {
    this.getChart().onThicknessChanged();
  },
  getThickness: function () {
    if (this.getHidden()) {
      return 0;
    }
    return (
      ((this.sprites[0] && this.sprites[0].thickness) || 1) +
      this.titleOffset +
      this.getMargin()
    );
  },
  onAnimationStart: function () {
    this.spriteAnimationCount++;
    if (this.spriteAnimationCount === 1) {
      this.fireEvent("animationstart", this);
    }
  },
  onAnimationEnd: function () {
    this.spriteAnimationCount--;
    if (this.spriteAnimationCount === 0) {
      this.fireEvent("animationend", this);
    }
  },
  getItemId: function () {
    return this.getId();
  },
  getAncestorIds: function () {
    return [this.getChart().getId()];
  },
  isXType: function (a) {
    return a === "axis";
  },
  resolveListenerScope: function (e) {
    var d = this,
      a = Ext._namedScopes[e],
      c = d.getChart(),
      b;
    if (!a) {
      b = c ? c.resolveListenerScope(e, false) : e || d;
    } else {
      if (a.isThis) {
        b = d;
      } else {
        if (a.isController) {
          b = c ? c.resolveListenerScope(e, false) : d;
        } else {
          if (a.isSelf) {
            b = c ? c.resolveListenerScope(e, false) : d;
            if (b === c && !c.getInheritedConfig("defaultListenerScope")) {
              b = d;
            }
          }
        }
      }
    }
    return b;
  },
  destroy: function () {
    var a = this;
    a.setChart(null);
    a.surface.destroy();
    a.surface = null;
    a.callParent();
  }
});
Ext.define("Ext.chart.legend.LegendBase", {
  extend: "Ext.view.View",
  config: {
    tpl: [
      '<div class="',
      Ext.baseCSSPrefix,
      'legend-inner">',
      '<div class="',
      Ext.baseCSSPrefix,
      'legend-container">',
      '<tpl for=".">',
      '<div class="',
      Ext.baseCSSPrefix,
      'legend-item">',
      "<span ",
      'class="',
      Ext.baseCSSPrefix,
      "legend-item-marker {[ values.disabled ? Ext.baseCSSPrefix + 'legend-item-inactive' : '' ]}\" ",
      'style="background:{mark};">',
      "</span>{name}",
      "</div>",
      "</tpl>",
      "</div>",
      "</div>"
    ],
    nodeContainerSelector: "div." + Ext.baseCSSPrefix + "legend-inner",
    itemSelector: "div." + Ext.baseCSSPrefix + "legend-item",
    docked: "bottom"
  },
  setDocked: function (c) {
    var b = this,
      a = b.ownerCt;
    b.docked = b.dock = c;
    switch (c) {
      case "top":
      case "bottom":
        b.addCls(b.horizontalCls);
        b.removeCls(b.verticalCls);
        break;
      case "left":
      case "right":
        b.addCls(b.verticalCls);
        b.removeCls(b.horizontalCls);
        break;
    }
    if (a) {
      a.setDock(c);
    }
  },
  setStore: function (a) {
    this.bindStore(a);
  },
  clearViewEl: function () {
    this.callParent(arguments);
    Ext.removeNode(this.getNodeContainer());
  },
  onItemClick: function (a, c, b, d) {
    this.callParent(arguments);
    this.toggleItem(b);
  }
});
Ext.define("Ext.chart.legend.Legend", {
  extend: "Ext.chart.legend.LegendBase",
  alternateClassName: "Ext.chart.Legend",
  xtype: "legend",
  alias: "legend.dom",
  type: "dom",
  isLegend: true,
  isDomLegend: true,
  config: {
    baseCls: Ext.baseCSSPrefix + "legend",
    rect: null,
    toggleable: true
  },
  horizontalCls: Ext.baseCSSPrefix + "legend-horizontal",
  verticalCls: Ext.baseCSSPrefix + "legend-vertical",
  toggleItem: function (c) {
    if (!this.getToggleable()) {
      return;
    }
    var b = this.getStore(),
      h = 0,
      e,
      g = true,
      d,
      f,
      a;
    if (b) {
      f = b.getCount();
      for (d = 0; d < f; d++) {
        a = b.getAt(d);
        if (a.get("disabled")) {
          h++;
        }
      }
      g = f - h > 1;
      a = b.getAt(c);
      if (a) {
        e = a.get("disabled");
        if (e || g) {
          a.set("disabled", !e);
        }
      }
    }
  }
});
Ext.define("Ext.chart.legend.sprite.Item", {
  extend: "Ext.draw.sprite.Composite",
  alias: "sprite.legenditem",
  type: "legenditem",
  isLegendItem: true,
  requires: ["Ext.draw.sprite.Text", "Ext.draw.sprite.Circle"],
  inheritableStatics: {
    def: {
      processors: { enabled: "limited01", markerLabelGap: "number" },
      animationProcessors: { enabled: null, markerLabelGap: null },
      defaults: { enabled: true, markerLabelGap: 5 },
      triggers: { enabled: "enabled", markerLabelGap: "layout" },
      updaters: { layout: "layoutUpdater", enabled: "enabledUpdater" }
    }
  },
  config: {
    label: { $value: { type: "text" }, lazy: true },
    marker: { $value: { type: "circle" }, lazy: true },
    legend: null,
    store: null,
    record: null,
    series: null
  },
  applyLabel: function (a, c) {
    var b;
    if (a) {
      if (a.isSprite && a.type === "text") {
        b = a;
      } else {
        if (c && a.type === c.type) {
          c.setConfig(a);
          b = c;
          this.scheduleUpdater(this.attr, "layout");
        } else {
          b = new Ext.draw.sprite.Text(a);
        }
      }
    }
    return b;
  },
  defaultMarkerSize: 10,
  updateLabel: function (a, c) {
    var b = this;
    b.removeSprite(c);
    a.setAttributes({ textBaseline: "middle" });
    b.add(a);
    b.scheduleUpdater(b.attr, "layout");
  },
  applyMarker: function (b) {
    var a;
    if (b) {
      if (b.isSprite) {
        a = b;
      } else {
        a = this.createMarker(b);
      }
    }
    a = this.resetMarker(a, b);
    return a;
  },
  createMarker: function (b) {
    var a;
    delete b.fx;
    if (b.type === "image") {
      delete b.width;
      delete b.height;
    }
    a = Ext.create("sprite." + b.type, b);
    return a;
  },
  resetMarker: function (d, b) {
    var c = b.size || this.defaultMarkerSize,
      f,
      a,
      e;
    d.setTransform([1, 0, 0, 1, 0, 0], true);
    if (b.type === "image") {
      d.setAttributes({ width: c, height: c });
    } else {
      f = d.getBBox();
      a = Math.max(f.width, f.height);
      e = c / a;
      d.setAttributes({ scalingX: e, scalingY: e });
    }
    return d;
  },
  updateMarker: function (b, a) {
    var c = this;
    c.removeSprite(a);
    c.add(b);
    c.scheduleUpdater(c.attr, "layout");
  },
  updateSurface: function (a, c) {
    var b = this;
    b.callParent([a, c]);
    if (a) {
      b.scheduleUpdater(b.attr, "layout");
    }
  },
  enabledUpdater: function (a) {
    var b = this.getMarker();
    if (b) {
      b.setAttributes({ globalAlpha: a.enabled ? 1 : 0.3 });
    }
  },
  layoutUpdater: function (b) {
    var g = this,
      b = g.attr,
      e = g.getLabel(),
      c = g.getMarker(),
      d,
      a,
      f;
    a = c.getBBox();
    d = e.getBBox();
    f = Math.max(a.height, d.height);
    c.transform([1, 0, 0, 1, -a.x, -a.y + (f - a.height) / 2], true);
    e.transform(
      [
        1,
        0,
        0,
        1,
        -d.x + a.width + b.markerLabelGap,
        -d.y + (f - d.height) / 2
      ],
      true
    );
    g.bboxUpdater(b);
  }
});
Ext.define("Ext.chart.legend.sprite.Border", {
  extend: "Ext.draw.sprite.Rect",
  alias: "sprite.legendborder",
  type: "legendborder",
  isLegendBorder: true
});
Ext.define("Ext.draw.PathUtil", function () {
  var a = Math.abs,
    c = Math.pow,
    e = Math.cos,
    b = Math.acos,
    d = Math.sqrt,
    f = Math.PI;
  return {
    singleton: true,
    requires: [
      "Ext.draw.overrides.hittest.Path",
      "Ext.draw.overrides.hittest.sprite.Path"
    ],
    cubicRoots: function (m) {
      var z = m[0],
        x = m[1],
        w = m[2],
        v = m[3];
      if (z === 0) {
        return this.quadraticRoots(x, w, v);
      }
      var s = x / z,
        r = w / z,
        q = v / z,
        k = (3 * r - c(s, 2)) / 9,
        j = (9 * s * r - 27 * q - 2 * c(s, 3)) / 54,
        p = c(k, 3) + c(j, 2),
        n = [],
        h,
        g,
        o,
        l,
        u,
        y = Ext.Number.sign;
      if (p >= 0) {
        h = y(j + d(p)) * c(a(j + d(p)), 1 / 3);
        g = y(j - d(p)) * c(a(j - d(p)), 1 / 3);
        n[0] = -s / 3 + (h + g);
        n[1] = -s / 3 - (h + g) / 2;
        n[2] = n[1];
        o = a((d(3) * (h - g)) / 2);
        if (o !== 0) {
          n[1] = -1;
          n[2] = -1;
        }
      } else {
        l = b(j / d(-c(k, 3)));
        n[0] = 2 * d(-k) * e(l / 3) - s / 3;
        n[1] = 2 * d(-k) * e((l + 2 * f) / 3) - s / 3;
        n[2] = 2 * d(-k) * e((l + 4 * f) / 3) - s / 3;
      }
      for (u = 0; u < 3; u++) {
        if (n[u] < 0 || n[u] > 1) {
          n[u] = -1;
        }
      }
      return n;
    },
    quadraticRoots: function (h, g, n) {
      var m, l, k, j;
      if (h === 0) {
        return this.linearRoot(g, n);
      }
      m = g * g - 4 * h * n;
      if (m === 0) {
        k = [-g / (2 * h)];
      } else {
        if (m > 0) {
          l = d(m);
          k = [(-g - l) / (2 * h), (-g + l) / (2 * h)];
        } else {
          return [];
        }
      }
      for (j = 0; j < k.length; j++) {
        if (k[j] < 0 || k[j] > 1) {
          k[j] = -1;
        }
      }
      return k;
    },
    linearRoot: function (h, g) {
      var i = -g / h;
      if (h === 0 || i < 0 || i > 1) {
        return [];
      }
      return [i];
    },
    bezierCoeffs: function (h, g, k, j) {
      var i = [];
      i[0] = -h + 3 * g - 3 * k + j;
      i[1] = 3 * h - 6 * g + 3 * k;
      i[2] = -3 * h + 3 * g;
      i[3] = h;
      return i;
    },
    cubicLineIntersections: function (I, G, F, E, l, k, j, h, M, p, K, n) {
      var u = [],
        N = [],
        D = p - n,
        z = K - M,
        y = M * (n - p) - p * (K - M),
        L = this.bezierCoeffs(I, G, F, E),
        J = this.bezierCoeffs(l, k, j, h),
        H,
        x,
        w,
        v,
        g,
        q,
        o,
        m;
      u[0] = D * L[0] + z * J[0];
      u[1] = D * L[1] + z * J[1];
      u[2] = D * L[2] + z * J[2];
      u[3] = D * L[3] + z * J[3] + y;
      x = this.cubicRoots(u);
      for (H = 0; H < x.length; H++) {
        v = x[H];
        if (v < 0 || v > 1) {
          continue;
        }
        g = v * v;
        q = g * v;
        o = L[0] * q + L[1] * g + L[2] * v + L[3];
        m = J[0] * q + J[1] * g + J[2] * v + J[3];
        if (K - M !== 0) {
          w = (o - M) / (K - M);
        } else {
          w = (m - p) / (n - p);
        }
        if (!(w < 0 || w > 1)) {
          N.push([o, m]);
        }
      }
      return N;
    },
    splitCubic: function (g, q, p, o, m) {
      var j = m * m,
        n = m * j,
        i = m - 1,
        h = i * i,
        k = i * h,
        l = n * o - 3 * j * i * p + 3 * m * h * q - k * g;
      return [
        [g, m * q - i * g, j * p - 2 * m * i * q + h * g, l],
        [l, j * o - 2 * m * i * p + h * q, m * o - i * p, o]
      ];
    },
    cubicDimension: function (p, o, l, k) {
      var j = 3 * (-p + 3 * (o - l) + k),
        i = 6 * (p - 2 * o + l),
        h = -3 * (p - o),
        q,
        n,
        g = Math.min(p, k),
        m = Math.max(p, k),
        r;
      if (j === 0) {
        if (i === 0) {
          return [g, m];
        } else {
          q = -h / i;
          if (0 < q && q < 1) {
            n = this.interpolateCubic(p, o, l, k, q);
            g = Math.min(g, n);
            m = Math.max(m, n);
          }
        }
      } else {
        r = i * i - 4 * j * h;
        if (r >= 0) {
          r = d(r);
          q = (r - i) / 2 / j;
          if (0 < q && q < 1) {
            n = this.interpolateCubic(p, o, l, k, q);
            g = Math.min(g, n);
            m = Math.max(m, n);
          }
          if (r > 0) {
            q -= r / j;
            if (0 < q && q < 1) {
              n = this.interpolateCubic(p, o, l, k, q);
              g = Math.min(g, n);
              m = Math.max(m, n);
            }
          }
        }
      }
      return [g, m];
    },
    interpolateCubic: function (h, g, l, k, i) {
      if (i === 0) {
        return h;
      }
      if (i === 1) {
        return k;
      }
      var j = (1 - i) / i;
      return i * i * i * (k + j * (3 * l + j * (3 * g + j * h)));
    },
    cubicsIntersections: function (
      r,
      q,
      p,
      o,
      A,
      z,
      y,
      v,
      g,
      F,
      E,
      D,
      m,
      l,
      k,
      i
    ) {
      var C = this,
        x = C.cubicDimension(r, q, p, o),
        B = C.cubicDimension(A, z, y, v),
        n = C.cubicDimension(g, F, E, D),
        s = C.cubicDimension(m, l, k, i),
        j,
        h,
        u,
        t,
        w = [];
      if (x[0] > n[1] || x[1] < n[0] || B[0] > s[1] || B[1] < s[0]) {
        return [];
      }
      if (
        a(A - z) < 1 &&
        a(y - v) < 1 &&
        a(r - o) < 1 &&
        a(q - p) < 1 &&
        a(m - l) < 1 &&
        a(k - i) < 1 &&
        a(g - D) < 1 &&
        a(F - E) < 1
      ) {
        return [[(r + o) * 0.5, (A + z) * 0.5]];
      }
      j = C.splitCubic(r, q, p, o, 0.5);
      h = C.splitCubic(A, z, y, v, 0.5);
      u = C.splitCubic(g, F, E, D, 0.5);
      t = C.splitCubic(m, l, k, i, 0.5);
      w.push.apply(
        w,
        C.cubicsIntersections.apply(C, j[0].concat(h[0], u[0], t[0]))
      );
      w.push.apply(
        w,
        C.cubicsIntersections.apply(C, j[0].concat(h[0], u[1], t[1]))
      );
      w.push.apply(
        w,
        C.cubicsIntersections.apply(C, j[1].concat(h[1], u[0], t[0]))
      );
      w.push.apply(
        w,
        C.cubicsIntersections.apply(C, j[1].concat(h[1], u[1], t[1]))
      );
      return w;
    },
    linesIntersection: function (k, p, j, o, h, n, q, m) {
      var l = (j - k) * (m - n) - (o - p) * (q - h),
        i,
        g;
      if (l === 0) {
        return null;
      }
      i = ((q - h) * (p - n) - (k - h) * (m - n)) / l;
      g = ((j - k) * (p - n) - (o - p) * (k - h)) / l;
      if (i >= 0 && i <= 1 && g >= 0 && g <= 1) {
        return [k + i * (j - k), p + i * (o - p)];
      }
      return null;
    },
    pointOnLine: function (j, m, h, l, g, n) {
      var k, i;
      if (a(h - j) < a(l - m)) {
        i = j;
        j = m;
        m = i;
        i = h;
        h = l;
        l = i;
        i = g;
        g = n;
        n = i;
      }
      k = (g - j) / (h - j);
      if (k < 0 || k > 1) {
        return false;
      }
      return a(m + k * (l - m) - n) < 4;
    },
    pointOnCubic: function (w, u, s, r, l, k, h, g, p, o) {
      var C = this,
        B = C.bezierCoeffs(w, u, s, r),
        A = C.bezierCoeffs(l, k, h, g),
        z,
        v,
        n,
        m,
        q;
      B[3] -= p;
      A[3] -= o;
      n = C.cubicRoots(B);
      m = C.cubicRoots(A);
      for (z = 0; z < n.length; z++) {
        q = n[z];
        for (v = 0; v < m.length; v++) {
          if (q >= 0 && q <= 1 && a(q - m[v]) < 0.05) {
            return true;
          }
        }
      }
      return false;
    }
  };
});
Ext.define("Ext.draw.overrides.hittest.All", {
  requires: [
    "Ext.draw.PathUtil",
    "Ext.draw.overrides.hittest.sprite.Instancing",
    "Ext.draw.overrides.hittest.Surface"
  ]
});
Ext.define("Ext.chart.legend.SpriteLegend", {
  alias: "legend.sprite",
  type: "sprite",
  isLegend: true,
  isSpriteLegend: true,
  requires: [
    "Ext.chart.legend.sprite.Item",
    "Ext.chart.legend.sprite.Border",
    "Ext.draw.overrides.hittest.All",
    "Ext.draw.Animator"
  ],
  config: {
    docked: "bottom",
    store: "ext-empty-store",
    chart: null,
    surface: null,
    size: { width: 0, height: 0 },
    toggleable: true,
    padding: 10,
    label: { preciseMeasurement: true },
    marker: {},
    border: { $value: { type: "legendborder" }, lazy: true },
    background: null
  },
  sprites: null,
  spriteZIndexes: { background: 0, border: 1, item: 2 },
  oldSize: { width: 0, height: 0 },
  constructor: function (a) {
    this.initConfig(a);
  },
  applyStore: function (a) {
    return a && Ext.StoreManager.lookup(a);
  },
  applyBorder: function (b) {
    var a;
    if (b) {
      if (b.isSprite) {
        a = b;
      } else {
        a = Ext.create("sprite." + b.type, b);
      }
    }
    if (a) {
      a.isLegendBorder = true;
      a.setAttributes({ zIndex: this.spriteZIndexes.border });
    }
    return a;
  },
  updateBorder: function (c, b) {
    var a = this.getSurface();
    this.borderSprite = null;
    if (a) {
      if (b) {
        a.remove(b);
      }
      if (c) {
        this.borderSprite = a.add(c);
      }
    }
  },
  scheduleLayout: function () {
    if (!this.scheduledLayoutId) {
      this.scheduledLayoutId = Ext.draw.Animator.schedule(
        "performLayout",
        this
      );
    }
  },
  cancelLayout: function () {
    Ext.draw.Animator.cancel(this.scheduledLayoutId);
    this.scheduledLayoutId = null;
  },
  performLayout: function () {
    var I = this,
      o = I.getSize(),
      p = I.getPadding(),
      h = I.getSprites(),
      u = I.getSurface(),
      A = I.getBackground(),
      q = u.getRect(),
      g = I.getStore(),
      k = (h && h.length) || 0,
      m = true,
      z,
      s;
    if (!u || !q || !g) {
      return false;
    }
    I.cancelLayout();
    var G = I.getDocked(),
      r = q[2],
      b = q[3],
      w = I.borderSprite,
      f = [],
      E,
      C,
      B,
      H,
      d,
      t,
      e,
      c,
      D,
      n,
      F,
      v,
      a,
      l,
      j;
    for (z = 0; z < k; z++) {
      s = h[z];
      a = s.getBBox();
      f.push(a);
    }
    if (a) {
      v = a.height;
    }
    switch (G) {
      case "bottom":
      case "top":
        if (!r) {
          return false;
        }
        B = 0;
        do {
          t = 0;
          d = 0;
          H = 0;
          B++;
          for (z = 0; z < k; z++) {
            a = f[z];
            if (a.width > d) {
              d = a.width;
            }
            if ((z + 1) % B === 0) {
              t += d;
              d = 0;
              H++;
            }
          }
          if (z % B !== 0) {
            t += d;
            H++;
          }
          c = t + (H - 1) * p;
          n = c + p * 4;
        } while (n > r);
        D = v * B + (B - 1) * p;
        break;
      case "right":
      case "left":
        if (!b) {
          return false;
        }
        B = k * 2;
        do {
          B = (B >> 1) + (B % 2);
          t = 0;
          e = 0;
          d = 0;
          H = 0;
          for (z = 0; z < k; z++) {
            a = f[z];
            if (!H) {
              e += a.height;
            }
            if (a.width > d) {
              d = a.width;
            }
            if ((z + 1) % B === 0) {
              t += d;
              d = 0;
              H++;
            }
          }
          if (z % B !== 0) {
            t += d;
            H++;
          }
          c = t + (H - 1) * p;
          D = e + (B - 1) * p;
          n = c + p * 4;
          F = D + p * 4;
        } while (D > b);
        break;
    }
    E = (r - c) / 2;
    C = (b - D) / 2;
    l = 0;
    j = 0;
    d = 0;
    for (z = 0; z < k; z++) {
      s = h[z];
      a = f[z];
      s.setAttributes({ translationX: E + l, translationY: C + j });
      if (a.width > d) {
        d = a.width;
      }
      if ((z + 1) % B === 0) {
        l += d + p;
        j = 0;
        d = 0;
      } else {
        j += a.height + p;
      }
    }
    if (w) {
      w.setAttributes({
        x: E - p,
        y: C - p,
        width: c + p * 2,
        height: D + p * 2
      });
    }
    o.width = w.attr.width + p * 2;
    o.height = w.attr.height + p * 2;
    if (o.width !== I.oldSize.width || o.height !== I.oldSize.height) {
      Ext.apply(I.oldSize, o);
      m = false;
      I.getChart().performLayout();
    }
    Ext.apply(I.oldSize, o);
    if (A) {
      I.resizeBackground(u, A);
    }
    u.renderFrame();
    return m;
  },
  getSprites: function () {
    this.updateSprites();
    return this.sprites;
  },
  createSprite: function (b, f) {
    var j = this,
      d = f.data,
      h = j.getChart(),
      e = h.get(d.series),
      g = e.getMarker(),
      k = null,
      c,
      i,
      a;
    if (b) {
      c = e.getMarkerStyleByIndex(d.index);
      Ext.apply(c, j.getMarker());
      if (g && g.type && !c.type) {
        c.type = g.type;
      }
      i = j.getLabel();
      a = {
        type: "legenditem",
        zIndex: j.spriteZIndexes.item,
        text: d.name,
        enabled: !d.disabled,
        marker: c,
        label: i,
        series: d.series,
        record: f
      };
      k = b.add(a);
    }
    return k;
  },
  updateSprites: function () {
    var j = this,
      g = j.getChart(),
      l = j.getStore(),
      a = j.getSurface(),
      m,
      h,
      b,
      d,
      f,
      e,
      k,
      c;
    if (!(g && l && a)) {
      return;
    }
    j.sprites = e = j.sprites || [];
    h = l.getData().items;
    f = h.length;
    for (d = 0; d < f; d++) {
      m = h[d];
      b = e[d];
      if (b) {
        j.updateSprite(b, m);
      } else {
        b = j.createSprite(a, m);
        a.add(b);
        e.push(b);
      }
    }
    k = Ext.Array.splice(e, d, e.length);
    for (d = 0, f = k.length; d < f; d++) {
      b = k[d];
      b.destroy();
    }
    c = j.getBorder();
    if (c) {
      j.borderSprite = c;
    }
    j.updateTheme(g.getTheme());
  },
  updateSprite: function (e, b) {
    var g = b.data,
      f = this.getChart(),
      d = f.get(g.series),
      a,
      c,
      h;
    if (e) {
      c = e.getLabel();
      c.setAttributes({ text: g.name });
      e.setAttributes({ enabled: !g.disabled });
      e.setConfig({ series: g.series, record: b });
      h = d.getMarkerStyleByIndex(g.index);
      Ext.apply(h, this.getMarker());
      a = e.getMarker();
      a.setAttributes({ fillStyle: h.fillStyle, strokeStyle: h.strokeStyle });
      e.layoutUpdater(e.attr);
    }
  },
  updateChart: function (c, a) {
    var b = this;
    if (a) {
      b.setSurface(null);
    }
    if (c) {
      b.setSurface(c.getSurface("legend"));
    }
  },
  updateSurface: function (a, b) {
    if (b) {
      b.el.un("click", "onClick", this);
    }
    if (a) {
      a.isLegendSurface = true;
      a.el.on("click", "onClick", this);
    }
  },
  onClick: function (e, c) {
    var d = this.getChart(),
      c = this.getSurface(),
      b,
      a;
    if (d && d.hasFirstLayout && c) {
      a = c.getEventXY(e);
      b = c.hitTest(a);
      if (b && b.sprite) {
        this.toggleItem(b.sprite);
      }
    }
  },
  applyBackground: function (b, e) {
    var f = this,
      d = f.getChart(),
      a = f.getSurface(),
      c;
    c = d.refreshBackground(a, b, e);
    if (c) {
      c.setAttributes({ zIndex: f.spriteZIndexes.background });
    }
    return c;
  },
  resizeBackground: function (b, d) {
    var e = d.attr.width,
      a = d.attr.height,
      c = b.getRect();
    if (c && (e !== c[2] || a !== c[3])) {
      d.setAttributes({ width: c[2], height: c[3] });
    }
  },
  themeableConfigs: { background: true },
  updateTheme: function (u) {
    var v = this,
      p = v.getSurface(),
      e = p.getItems(),
      t = u.getLegend(),
      g = v.getLabel(),
      j = v.self.getConfigurator().configs,
      r = v.themeableConfigs,
      a = v.getInitialConfig(),
      k = v.defaultConfig,
      o,
      c,
      d,
      h,
      b,
      m,
      s,
      l,
      w,
      n,
      q,
      f;
    for (q = 0, f = e.length; q < f; q++) {
      m = e[q];
      if (m.isLegendItem) {
        s = t.label;
        if (s) {
          n = null;
          for (w in s) {
            if (!(w in g)) {
              n = n || {};
              n[w] = s[w];
            }
          }
          if (n) {
            l = m.getLabel();
            l.setAttributes(n);
          }
        }
        continue;
      } else {
        if (m.isLegendBorder) {
          s = t.border;
        } else {
          continue;
        }
      }
      if (s) {
        n = {};
        for (w in s) {
          if (!(w in m.config)) {
            n[w] = s[w];
          }
        }
        m.setAttributes(n);
      }
    }
    o = t.background;
    c = j.background;
    if (o !== null && o !== undefined && c) {
    }
    for (w in t) {
      if (!(w in r)) {
        continue;
      }
      o = t[w];
      c = j[w];
      if (o !== null && o !== undefined && c) {
        b = a[w];
        d = Ext.isObject(o);
        h = b === k[w];
        if (d) {
          if (h && themeOnlyIfConfigured[w]) {
            continue;
          }
          o = Ext.merge({}, o, b);
        }
        if (h || d) {
          v[c.names.set](o);
        }
      }
    }
  },
  updateStore: function (a, c) {
    var b = this;
    if (c) {
      c.un("datachanged", b.onDataChanged, b);
      c.un("update", b.onDataUpdate, b);
    }
    if (a && !a.isEmptyStore) {
      a.on("datachanged", b.onDataChanged, b);
      a.on("update", b.onDataUpdate, b);
      b.onDataChanged(a);
    }
    b.performLayout();
  },
  onDataChanged: function (a) {
    this.updateSprites();
    this.scheduleLayout();
  },
  onDataUpdate: function (h, d) {
    var g = this,
      e = g.sprites,
      f = e.length,
      b = 0,
      j,
      a,
      c;
    for (; b < f; b++) {
      j = e[b];
      a = j.getRecord();
      if (a === d) {
        c = j;
        break;
      }
    }
    if (c) {
      g.updateSprite(c, d);
      g.scheduleLayout();
    }
  },
  toggleItem: function (d) {
    if (!this.getToggleable() || !d.isLegendItem) {
      return;
    }
    var b = this.getStore(),
      h = 0,
      e,
      g = true,
      c,
      f,
      a;
    if (b) {
      f = b.getCount();
      for (c = 0; c < f; c++) {
        a = b.getAt(c);
        if (a.get("disabled")) {
          h++;
        }
      }
      g = f - h > 1;
      a = d.getRecord();
      if (a) {
        e = a.get("disabled");
        if (e || g) {
          a.set("disabled", !e);
          d.setAttributes({ enabled: e });
        }
      }
    }
  },
  destroy: function () {
    this.cancelLayout();
    this.callParent();
  }
});
Ext.define("Ext.chart.legend.store.Item", {
  extend: "Ext.data.Model",
  fields: ["id", "name", "mark", "disabled", "series", "index"]
});
Ext.define("Ext.chart.legend.store.Store", {
  extend: "Ext.data.Store",
  requires: ["Ext.chart.legend.store.Item"],
  model: "Ext.chart.legend.store.Item",
  isLegendStore: true,
  config: { autoDestroy: true }
});
Ext.define("Ext.chart.AbstractChart", {
  extend: "Ext.draw.Container",
  requires: [
    "Ext.chart.theme.Default",
    "Ext.chart.series.Series",
    "Ext.chart.interactions.Abstract",
    "Ext.chart.axis.Axis",
    "Ext.data.StoreManager",
    "Ext.chart.legend.Legend",
    "Ext.chart.legend.SpriteLegend",
    "Ext.chart.legend.store.Store",
    "Ext.data.Store"
  ],
  isChart: true,
  defaultBindProperty: "store",
  config: {
    store: "ext-empty-store",
    theme: "default",
    style: null,
    animation: !Ext.isIE8,
    series: [],
    axes: [],
    legend: null,
    colors: null,
    insetPadding: { top: 10, left: 10, right: 10, bottom: 10 },
    background: null,
    interactions: [],
    mainRect: null,
    resizeHandler: null,
    highlightItem: null
  },
  animationSuspendCount: 0,
  chartLayoutSuspendCount: 0,
  axisThicknessSuspendCount: 0,
  isThicknessChanged: false,
  surfaceZIndexes: {
    background: 0,
    main: 1,
    grid: 2,
    series: 3,
    axis: 4,
    chart: 5,
    overlay: 6,
    legend: 7,
    title: 8
  },
  constructor: function (a) {
    var b = this;
    b.itemListeners = {};
    b.surfaceMap = {};
    b.chartComponents = {};
    b.isInitializing = true;
    b.suspendChartLayout();
    b.animationSuspendCount++;
    b.callParent(arguments);
    b.isInitializing = false;
    b.getSurface("main");
    b.getSurface("chart").setFlipRtlText(b.getInherited().rtl);
    b.getSurface("overlay").waitFor(b.getSurface("series"));
    b.animationSuspendCount--;
    b.resumeChartLayout();
  },
  applyAnimation: function (a, b) {
    if (!a) {
      a = { duration: 0 };
    } else {
      if (a === true) {
        a = { easing: "easeInOut", duration: 500 };
      }
    }
    return b ? Ext.apply({}, a, b) : a;
  },
  getAnimation: function () {
    if (this.animationSuspendCount) {
      return { duration: 0 };
    } else {
      return this.callParent();
    }
  },
  applyInsetPadding: function (b, a) {
    if (!Ext.isObject(b)) {
      return Ext.util.Format.parseBox(b);
    } else {
      if (!a) {
        return b;
      } else {
        return Ext.apply(a, b);
      }
    }
  },
  suspendAnimation: function () {
    var d = this,
      c = d.getSeries(),
      e = c.length,
      b = -1,
      a;
    d.animationSuspendCount++;
    if (d.animationSuspendCount === 1) {
      while (++b < e) {
        a = c[b];
        a.setAnimation(a.getAnimation());
      }
    }
  },
  resumeAnimation: function () {
    var d = this,
      c = d.getSeries(),
      f = c.length,
      b = -1,
      a,
      e;
    d.animationSuspendCount--;
    if (d.animationSuspendCount === 0) {
      while (++b < f) {
        a = c[b];
        e = a.getAnimation();
        a.setAnimation((e.duration && e) || d.getAnimation());
      }
    }
  },
  suspendChartLayout: function () {
    var a = this;
    a.chartLayoutSuspendCount++;
    if (a.chartLayoutSuspendCount === 1) {
      if (a.scheduledLayoutId) {
        a.layoutInSuspension = true;
        a.cancelChartLayout();
      } else {
        a.layoutInSuspension = false;
      }
    }
  },
  resumeChartLayout: function () {
    var a = this;
    a.chartLayoutSuspendCount--;
    if (a.chartLayoutSuspendCount === 0) {
      if (a.layoutInSuspension) {
        a.scheduleLayout();
      }
    }
  },
  cancelChartLayout: function () {
    if (this.scheduledLayoutId) {
      Ext.draw.Animator.cancel(this.scheduledLayoutId);
      this.scheduledLayoutId = null;
    }
  },
  scheduleLayout: function () {
    var a = this;
    if (a.allowSchedule() && !a.scheduledLayoutId) {
      a.scheduledLayoutId = Ext.draw.Animator.schedule("doScheduleLayout", a);
    }
  },
  allowSchedule: function () {
    return true;
  },
  doScheduleLayout: function () {
    var a = this;
    if (a.chartLayoutSuspendCount) {
      a.layoutInSuspension = true;
    } else {
      a.performLayout();
    }
    a.scheduledLayoutId = null;
  },
  suspendThicknessChanged: function () {
    this.axisThicknessSuspendCount++;
  },
  resumeThicknessChanged: function () {
    if (this.axisThicknessSuspendCount > 0) {
      this.axisThicknessSuspendCount--;
      if (this.axisThicknessSuspendCount === 0 && this.isThicknessChanged) {
        this.onThicknessChanged();
      }
    }
  },
  onThicknessChanged: function () {
    if (this.axisThicknessSuspendCount === 0) {
      this.isThicknessChanged = false;
      this.performLayout();
    } else {
      this.isThicknessChanged = true;
    }
  },
  applySprites: function (b) {
    var a = this.getSurface("chart");
    b = Ext.Array.from(b);
    a.removeAll(true);
    a.add(b);
    return b;
  },
  initItems: function () {
    var a = this.items,
      b,
      d,
      c;
    if (a && !a.isMixedCollection) {
      this.items = [];
      a = Ext.Array.from(a);
      for (b = 0, d = a.length; b < d; b++) {
        c = a[b];
        if (c.type) {
          Ext.raise(
            "To add custom sprites to the chart use the 'sprites' config."
          );
        } else {
          this.items.push(c);
        }
      }
    }
    this.callParent();
  },
  applyBackground: function (b, c) {
    var a = this.getSurface("background");
    return this.refreshBackground(a, b, c);
  },
  refreshBackground: function (c, b, e) {
    var d, a, f;
    if (b) {
      if (e) {
        d = e.attr.width;
        a = e.attr.height;
        f = e.type === (b.type || "rect");
      }
      if (b.isSprite) {
        e = b;
      } else {
        if (b.type === "image" && Ext.isString(b.src)) {
          if (f) {
            e.setAttributes({ src: b.src });
          } else {
            c.remove(e, true);
            e = c.add(b);
          }
        } else {
          if (f) {
            e.setAttributes({ fillStyle: b });
          } else {
            c.remove(e, true);
            e = c.add({
              type: "rect",
              fillStyle: b,
              fx: { customDurations: { x: 0, y: 0, width: 0, height: 0 } }
            });
          }
        }
      }
    }
    if (d && a) {
      e.setAttributes({ width: d, height: a });
    }
    e.setAnimation(this.getAnimation());
    return e;
  },
  getLegendStore: function () {
    return this.legendStore;
  },
  refreshLegendStore: function () {
    var g = this,
      e = g.getLegendStore(),
      d;
    if (e) {
      var c = g.getSeries(),
        f = c.length,
        a = [],
        b = 0;
      for (; b < f; b++) {
        d = c[b];
        if (d.getShowInLegend()) {
          d.provideLegendInfo(a);
        }
      }
      e.setData(a);
    }
  },
  onUpdateLegendStore: function (b, a) {
    var d = this.getSeries(),
      c;
    if (a && d) {
      c = d.map[a.get("series")];
      if (c) {
        c.setHiddenByIndex(a.get("index"), a.get("disabled"));
        this.redraw();
      }
    }
  },
  defaultResizeHandler: function (a) {
    this.scheduleLayout();
    return false;
  },
  applyMainRect: function (a, b) {
    if (!b) {
      return a;
    }
    this.getSeries();
    this.getAxes();
    if (a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]) {
      return b;
    } else {
      return a;
    }
  },
  register: function (a) {
    var b = this.chartComponents,
      c = a.getId();
    b[c] = a;
  },
  unregister: function (a) {
    var b = this.chartComponents,
      c = a.getId();
    delete b[c];
  },
  get: function (a) {
    return this.chartComponents[a];
  },
  getAxis: function (a) {
    if (a instanceof Ext.chart.axis.Axis) {
      return a;
    } else {
      if (Ext.isNumber(a)) {
        return this.getAxes()[a];
      } else {
        if (Ext.isString(a)) {
          return this.get(a);
        }
      }
    }
  },
  getSurface: function (b, c) {
    b = b || "main";
    c = c || b;
    var d = this,
      a = this.callParent([b]),
      f = d.surfaceZIndexes,
      e = d.surfaceMap;
    if (c in f) {
      a.element.setStyle("zIndex", f[c]);
    }
    if (!e[c]) {
      e[c] = [];
    }
    if (Ext.Array.indexOf(e[c], a) < 0) {
      a.type = c;
      e[c].push(a);
      a.on("destroy", d.forgetSurface, d);
    }
    return a;
  },
  forgetSurface: function (a) {
    var d = this.surfaceMap;
    if (!d || this.isDestroying) {
      return;
    }
    var c = d[a.type],
      b = c ? Ext.Array.indexOf(c, a) : -1;
    if (b >= 0) {
      c.splice(b, 1);
    }
  },
  applyAxes: function (b, k) {
    var l = this,
      g = { left: "right", right: "left" },
      m = [],
      c,
      d,
      e,
      a,
      f,
      h,
      j;
    l.animationSuspendCount++;
    l.getStore();
    if (!k) {
      k = [];
      k.map = {};
    }
    j = k.map;
    m.map = {};
    b = Ext.Array.from(b, true);
    for (f = 0, h = b.length; f < h; f++) {
      c = b[f];
      if (!c) {
        continue;
      }
      if (c instanceof Ext.chart.axis.Axis) {
        d = j[c.getId()];
        c.setChart(l);
      } else {
        c = Ext.Object.chain(c);
        e = c.linkedTo;
        a = c.id;
        if (Ext.isNumber(e)) {
          c = Ext.merge({}, b[e], c);
        } else {
          if (Ext.isString(e)) {
            Ext.Array.each(b, function (i) {
              if (i.id === c.linkedTo) {
                c = Ext.merge({}, i, c);
                return false;
              }
            });
          }
        }
        c.id = a;
        c.chart = l;
        if (l.getInherited().rtl) {
          c.position = g[c.position] || c.position;
        }
        a = (c.getId && c.getId()) || c.id;
        c = Ext.factory(c, null, (d = j[a]), "axis");
      }
      if (c) {
        m.push(c);
        m.map[c.getId()] = c;
        if (!d) {
          c.on("animationstart", "onAnimationStart", l);
          c.on("animationend", "onAnimationEnd", l);
        }
      }
    }
    for (f in j) {
      if (!m.map[f]) {
        j[f].destroy();
      }
    }
    l.animationSuspendCount--;
    return m;
  },
  updateAxes: function () {
    if (!this.isDestroying) {
      this.scheduleLayout();
    }
  },
  circularCopyArray: function (e, f, d) {
    var c = [],
      b,
      a = e && e.length;
    if (a) {
      for (b = 0; b < d; b++) {
        c.push(e[(f + b) % a]);
      }
    }
    return c;
  },
  circularCopyObject: function (f, g, d) {
    var c = this,
      b,
      e,
      a = {};
    if (d) {
      for (b in f) {
        if (f.hasOwnProperty(b)) {
          e = f[b];
          if (Ext.isArray(e)) {
            a[b] = c.circularCopyArray(e, g, d);
          } else {
            a[b] = e;
          }
        }
      }
    }
    return a;
  },
  getColors: function () {
    var b = this,
      a = b.config.colors,
      c = b.getTheme();
    if (Ext.isArray(a) && a.length > 0) {
      a = b.applyColors(a);
    }
    return a || (c && c.getColors());
  },
  applyColors: function (a) {
    a = Ext.Array.map(a, function (b) {
      if (Ext.isString(b)) {
        return b;
      } else {
        return b.toString();
      }
    });
    return a;
  },
  updateColors: function (c) {
    var k = this,
      e = k.getTheme(),
      a = c || (e && e.getColors()),
      l = 0,
      f = k.getSeries(),
      d = f && f.length,
      g,
      j,
      b,
      h;
    if (a.length) {
      for (g = 0; g < d; g++) {
        j = f[g];
        h = j.themeColorCount();
        b = k.circularCopyArray(a, l, h);
        l += h;
        j.updateChartColors(b);
      }
    }
    k.refreshLegendStore();
  },
  applyTheme: function (a) {
    if (a && a.isTheme) {
      return a;
    }
    return Ext.Factory.chartTheme(a);
  },
  updateGradients: function (a) {
    if (!Ext.isEmpty(a)) {
      this.updateTheme(this.getTheme());
    }
  },
  updateTheme: function (g) {
    var e = this,
      f = e.getAxes(),
      d = e.getSeries(),
      a = e.getColors(),
      c,
      b;
    e.updateChartTheme(g);
    for (b = 0; b < f.length; b++) {
      f[b].updateTheme(g);
    }
    for (b = 0; b < d.length; b++) {
      c = d[b];
      c.updateTheme(g);
    }
    e.updateSpriteTheme(g);
    e.updateColors(a);
    e.redraw();
  },
  themeOnlyIfConfigured: {},
  updateChartTheme: function (c) {
    var i = this,
      k = c.getChart(),
      n = i.getInitialConfig(),
      b = i.defaultConfig,
      e = i.self.getConfigurator().configs,
      f = k.defaults,
      g = k[i.xtype],
      h = i.themeOnlyIfConfigured,
      l,
      j,
      o,
      a,
      m,
      d;
    k = Ext.merge({}, f, g);
    for (l in k) {
      j = k[l];
      d = e[l];
      if (j !== null && j !== undefined && d) {
        m = n[l];
        o = Ext.isObject(j);
        a = m === b[l];
        if (o) {
          if (a && h[l]) {
            continue;
          }
          j = Ext.merge({}, j, m);
        }
        if (a || o) {
          i[d.names.set](j);
        }
      }
    }
  },
  updateSpriteTheme: function (c) {
    this.getSprites();
    var j = this,
      e = j.getSurface("chart"),
      h = e.getItems(),
      m = c.getSprites(),
      k,
      a,
      l,
      f,
      d,
      b,
      g;
    for (b = 0, g = h.length; b < g; b++) {
      k = h[b];
      a = m[k.type];
      if (a) {
        f = {};
        d = k.type === "text";
        for (l in a) {
          if (!(l in k.config)) {
            if (!(d && l.indexOf("font") === 0 && k.config.font)) {
              f[l] = a[l];
            }
          }
        }
        k.setAttributes(f);
      }
    }
  },
  addSeries: function (b) {
    var a = this.getSeries();
    Ext.Array.push(a, b);
    this.setSeries(a);
  },
  removeSeries: function (d) {
    d = Ext.Array.from(d);
    var b = this.getSeries(),
      f = [],
      a = d.length,
      g = {},
      c,
      e;
    for (c = 0; c < a; c++) {
      e = d[c];
      if (typeof e !== "string") {
        e = e.getId();
      }
      g[e] = true;
    }
    for (c = 0, a = b.length; c < a; c++) {
      if (!g[b[c].getId()]) {
        f.push(b[c]);
      }
    }
    this.setSeries(f);
  },
  applySeries: function (e, d) {
    var g = this,
      j = [],
      h,
      a,
      c,
      f,
      b;
    g.animationSuspendCount++;
    g.getAxes();
    if (d) {
      h = d.map;
    } else {
      d = [];
      h = d.map = {};
    }
    j.map = {};
    e = Ext.Array.from(e, true);
    for (c = 0, f = e.length; c < f; c++) {
      b = e[c];
      if (!b) {
        continue;
      }
      a = h[(b.getId && b.getId()) || b.id];
      if (b instanceof Ext.chart.series.Series) {
        if (a && a !== b) {
          a.destroy();
        }
        b.setChart(g);
      } else {
        if (Ext.isObject(b)) {
          if (a) {
            a.setConfig(b);
            b = a;
          } else {
            if (Ext.isString(b)) {
              b = { type: b };
            }
            b.chart = g;
            b = Ext.create(b.xclass || "series." + b.type, b);
            b.on("animationstart", "onAnimationStart", g);
            b.on("animationend", "onAnimationEnd", g);
          }
        }
      }
      j.push(b);
      j.map[b.getId()] = b;
    }
    for (c in h) {
      if (!j.map[h[c].id]) {
        h[c].destroy();
      }
    }
    g.animationSuspendCount--;
    return j;
  },
  defaultLegendType: "dom",
  applyLegend: function (c) {
    var d = this,
      a,
      b;
    if (c) {
      if (Ext.isBoolean(c)) {
        a = Ext.create("legend." + d.defaultLegendType, {
          docked: "bottom",
          chart: d
        });
      } else {
        c.docked = c.docked || "bottom";
        c.chart = d;
        b = "legend." + (c.type || d.defaultLegendType);
        a = Ext.create(b, c);
      }
      return a;
    }
    return null;
  },
  updateLegend: function (b, a) {
    var c = this;
    if (a) {
      a.destroy();
    }
    if (b) {
      c.getSurface("legend");
      c.getItems();
      c.legendStore = new Ext.chart.legend.store.Store({
        chart: c,
        store: c.legendStore
      });
      c.refreshLegendStore();
      c.legendStore.on("update", "onUpdateLegendStore", c);
      b.setStore(c.legendStore);
    }
  },
  updateSeries: function (b, a) {
    var c = this;
    if (c.isDestroying) {
      return;
    }
    c.animationSuspendCount++;
    c.fireEvent("serieschange", c, b, a);
    c.refreshLegendStore();
    if (!Ext.isEmpty(b)) {
      c.updateTheme(c.getTheme());
    }
    c.scheduleLayout();
    c.animationSuspendCount--;
  },
  applyInteractions: function (h, d) {
    if (!d) {
      d = [];
      d.map = {};
    }
    var g = this,
      a = [],
      c = d.map,
      e,
      f,
      b;
    a.map = {};
    h = Ext.Array.from(h, true);
    for (e = 0, f = h.length; e < f; e++) {
      b = h[e];
      if (!b) {
        continue;
      }
      b = Ext.factory(
        b,
        null,
        c[(b.getId && b.getId()) || b.id],
        "interaction"
      );
      if (b) {
        b.setChart(g);
        a.push(b);
        a.map[b.getId()] = b;
      }
    }
    for (e in c) {
      if (!a.map[e]) {
        c[e].destroy();
      }
    }
    return a;
  },
  getInteraction: function (e) {
    var f = this.getInteractions(),
      a = f && f.length,
      c = null,
      b,
      d;
    if (a) {
      for (d = 0; d < a; ++d) {
        b = f[d];
        if (b.type === e) {
          c = b;
          break;
        }
      }
    }
    return c;
  },
  applyStore: function (a) {
    return a && Ext.StoreManager.lookup(a);
  },
  updateStore: function (a, c) {
    var b = this;
    if (c && !c.destroyed) {
      c.un({
        datachanged: "onDataChanged",
        update: "onDataChanged",
        scope: b,
        order: "after"
      });
      if (c.autoDestroy) {
        c.destroy();
      }
    }
    if (a) {
      a.on({
        datachanged: "onDataChanged",
        update: "onDataChanged",
        scope: b,
        order: "after"
      });
    }
    b.fireEvent("storechange", b, a, c);
    b.onDataChanged();
  },
  redraw: function () {
    this.fireEvent("redraw", this);
  },
  performLayout: function () {
    var e = this,
      c = e.getLegend(),
      d = e.getChartRect(true),
      b = e.getBackground(),
      a = true;
    e.hasFirstLayout = true;
    e.fireEvent("layout", e);
    e.cancelChartLayout();
    e.getSurface("background").setRect(d);
    e.getSurface("chart").setRect(d);
    if (c && c.isSpriteLegend) {
      e.getSurface("legend").setRect(e.spriteLegendRect);
      a = c.performLayout();
    }
    b.setAttributes({ width: d[2], height: d[3] });
    return a;
  },
  getChartRect: function (d) {
    var c = this,
      b,
      a;
    if (d) {
      c.chartRect = null;
    }
    if (c.chartRect) {
      b = c.chartRect;
    } else {
      a = c.innerElement.getSize();
      b = c.chartRect = [0, 0, a.width, a.height];
    }
    if (d) {
      c.computeSpriteLegendRect(b);
    }
    return b;
  },
  computeSpriteLegendRect: function (e) {
    var d = this,
      c = d.getLegend();
    if (c && c.isSpriteLegend) {
      var h = c.getSize(),
        b = h.height,
        f = h.width,
        g = c.getDocked(),
        a = [0, 0, 0, 0];
      switch (g) {
        case "top":
          e[1] = b;
          a[2] = e[2];
          a[3] = b;
          break;
        case "bottom":
          e[3] -= b;
          a[1] = e[3];
          a[2] = e[2];
          a[3] = b;
          break;
        case "left":
          e[0] = f;
          a[2] = f;
          a[3] = e[3];
          break;
        case "right":
          e[2] -= f;
          a[0] = e[2];
          a[2] = f;
          a[3] = e[3];
          break;
      }
      d.spriteLegendRect = a;
    }
  },
  getEventXY: function (a) {
    return this.getSurface().getEventXY(a);
  },
  getItemForPoint: function (h, g) {
    var f = this,
      a = f.getSeries(),
      e = f.getMainRect(),
      d = a.length,
      b = f.hasFirstLayout ? d - 1 : -1,
      c,
      j;
    if (!(e && h >= 0 && h <= e[2] && g >= 0 && g <= e[3])) {
      return null;
    }
    for (; b >= 0; b--) {
      c = a[b];
      j = c.getItemForPoint(h, g);
      if (j) {
        return j;
      }
    }
    return null;
  },
  getItemsForPoint: function (h, g) {
    var f = this,
      a = f.getSeries(),
      d = a.length,
      b = f.hasFirstLayout ? d - 1 : -1,
      e = [],
      c,
      j;
    for (; b >= 0; b--) {
      c = a[b];
      j = c.getItemForPoint(h, g);
      if (j) {
        e.push(j);
      }
    }
    return e;
  },
  onAnimationStart: function () {
    this.fireEvent("animationstart", this);
  },
  onAnimationEnd: function () {
    this.fireEvent("animationend", this);
  },
  onDataChanged: function () {
    var d = this;
    if (d.isInitializing) {
      return;
    }
    var c = d.getMainRect(),
      a = d.getStore(),
      b = d.getSeries(),
      e = d.getAxes();
    if (!a || !e || !b) {
      return;
    }
    if (!c) {
      d.on({ redraw: d.onDataChanged, scope: d, single: true });
      return;
    }
    d.processData();
    d.redraw();
  },
  recordCount: 0,
  processData: function () {
    var g = this,
      e = g.getStore().getCount(),
      c = g.getSeries(),
      f = c.length,
      d = false,
      b = 0,
      a;
    for (; b < f; b++) {
      a = c[b];
      a.processData();
      if (!d && a.isStoreDependantColorCount) {
        d = true;
      }
    }
    if (d && e > g.recordCount) {
      g.updateColors(g.getColors());
      g.recordCount = e;
    }
  },
  bindStore: function (a) {
    this.setStore(a);
  },
  applyHighlightItem: function (f, a) {
    if (f === a) {
      return;
    }
    if (Ext.isObject(f) && Ext.isObject(a)) {
      var e = f,
        d = a,
        c = e.sprite && (e.sprite[0] || e.sprite),
        b = d.sprite && (d.sprite[0] || d.sprite);
      if (c === b && e.index === d.index) {
        return;
      }
    }
    return f;
  },
  updateHighlightItem: function (b, a) {
    if (a) {
      a.series.setAttributesForItem(a, { highlighted: false });
    }
    if (b) {
      b.series.setAttributesForItem(b, { highlighted: true });
      this.fireEvent("itemhighlight", this, b, a);
    }
    this.fireEvent("itemhighlightchange", this, b, a);
  },
  destroyChart: function () {
    var f = this,
      d = f.getLegend(),
      g = f.getAxes(),
      c = f.getSeries(),
      h = f.getInteractions(),
      b = [],
      a,
      e;
    f.surfaceMap = null;
    for (a = 0, e = h.length; a < e; a++) {
      h[a].destroy();
    }
    for (a = 0, e = g.length; a < e; a++) {
      g[a].destroy();
    }
    for (a = 0, e = c.length; a < e; a++) {
      c[a].destroy();
    }
    f.setInteractions(b);
    f.setAxes(b);
    f.setSeries(b);
    if (d) {
      d.destroy();
      f.setLegend(null);
    }
    f.legendStore = null;
    f.setStore(null);
    f.cancelChartLayout();
  },
  getRefItems: function (b) {
    var g = this,
      e = g.getSeries(),
      h = g.getAxes(),
      a = g.getInteractions(),
      c = [],
      d,
      f;
    for (d = 0, f = e.length; d < f; d++) {
      c.push(e[d]);
      if (e[d].getRefItems) {
        c.push.apply(c, e[d].getRefItems(b));
      }
    }
    for (d = 0, f = h.length; d < f; d++) {
      c.push(h[d]);
      if (h[d].getRefItems) {
        c.push.apply(c, h[d].getRefItems(b));
      }
    }
    for (d = 0, f = a.length; d < f; d++) {
      c.push(a[d]);
      if (a[d].getRefItems) {
        c.push.apply(c, a[d].getRefItems(b));
      }
    }
    return c;
  }
});
Ext.define("Ext.chart.overrides.AbstractChart", {
  override: "Ext.chart.AbstractChart",
  updateLegend: function (b, a) {
    this.callParent([b, a]);
    if (b && b.isDomLegend) {
      this.addDocked(b);
    }
  },
  performLayout: function () {
    if (this.isVisible(true)) {
      return this.callParent();
    }
    this.cancelChartLayout();
    return false;
  },
  afterComponentLayout: function (c, a, b, d) {
    this.callParent([c, a, b, d]);
    this.scheduleLayout();
  },
  allowSchedule: function () {
    return this.rendered;
  },
  doDestroy: function () {
    this.destroyChart();
    this.callParent();
  }
});
Ext.define("Ext.chart.grid.HorizontalGrid", {
  extend: "Ext.draw.sprite.Sprite",
  alias: "grid.horizontal",
  inheritableStatics: {
    def: {
      processors: {
        x: "number",
        y: "number",
        width: "number",
        height: "number"
      },
      defaults: { x: 0, y: 0, width: 1, height: 1, strokeStyle: "#DDD" }
    }
  },
  render: function (b, c, e) {
    var a = this.attr,
      f = b.roundPixel(a.y),
      d = c.lineWidth * 0.5;
    c.beginPath();
    c.rect(e[0] - b.matrix.getDX(), f + d, +e[2], a.height);
    c.fill();
    c.beginPath();
    c.moveTo(e[0] - b.matrix.getDX(), f + d);
    c.lineTo(e[0] + e[2] - b.matrix.getDX(), f + d);
    c.stroke();
  }
});
Ext.define("Ext.chart.grid.VerticalGrid", {
  extend: "Ext.draw.sprite.Sprite",
  alias: "grid.vertical",
  inheritableStatics: {
    def: {
      processors: {
        x: "number",
        y: "number",
        width: "number",
        height: "number"
      },
      defaults: { x: 0, y: 0, width: 1, height: 1, strokeStyle: "#DDD" }
    }
  },
  render: function (c, d, f) {
    var b = this.attr,
      a = c.roundPixel(b.x),
      e = d.lineWidth * 0.5;
    d.beginPath();
    d.rect(a - e, f[1] - c.matrix.getDY(), b.width, f[3]);
    d.fill();
    d.beginPath();
    d.moveTo(a - e, f[1] - c.matrix.getDY());
    d.lineTo(a - e, f[1] + f[3] - c.matrix.getDY());
    d.stroke();
  }
});
Ext.define("Ext.chart.CartesianChart", {
  extend: "Ext.chart.AbstractChart",
  alternateClassName: "Ext.chart.Chart",
  requires: ["Ext.chart.grid.HorizontalGrid", "Ext.chart.grid.VerticalGrid"],
  xtype: ["cartesian", "chart"],
  isCartesian: true,
  config: {
    flipXY: false,
    innerRect: [0, 0, 1, 1],
    innerPadding: { top: 0, left: 0, right: 0, bottom: 0 }
  },
  applyInnerPadding: function (b, a) {
    if (!Ext.isObject(b)) {
      return Ext.util.Format.parseBox(b);
    } else {
      if (!a) {
        return b;
      } else {
        return Ext.apply(a, b);
      }
    }
  },
  getDirectionForAxis: function (a) {
    var b = this.getFlipXY();
    if (a === "left" || a === "right") {
      if (b) {
        return "X";
      } else {
        return "Y";
      }
    } else {
      if (b) {
        return "Y";
      } else {
        return "X";
      }
    }
  },
  performLayout: function () {
    var A = this;
    A.animationSuspendCount++;
    if (A.callParent() === false) {
      --A.animationSuspendCount;
      return;
    }
    var d = A.getSurface("chart").getRect(),
      o = d[2],
      n = d[3],
      z = A.getAxes(),
      b,
      q = A.getSeries(),
      h,
      l,
      a,
      f = A.getInsetPadding(),
      v = A.getInnerPadding(),
      r,
      c,
      e = Ext.apply({}, f),
      u,
      p,
      s,
      k,
      m,
      y,
      t,
      x,
      g,
      j = A.getInherited().rtl,
      w = A.getFlipXY();
    if (o <= 0 || n <= 0) {
      return;
    }
    A.suspendThicknessChanged();
    e.left += d[0];
    e.top += d[1];
    for (x = 0; x < z.length; x++) {
      b = z[x];
      l = b.getSurface();
      m = b.getFloating();
      y = m ? m.value : null;
      a = b.getThickness();
      switch (b.getPosition()) {
        case "top":
          l.setRect([0, e.top + 1, o, a]);
          break;
        case "bottom":
          l.setRect([0, n - (e.bottom + a), o, a]);
          break;
        case "left":
          l.setRect([e.left, 0, a, n]);
          break;
        case "right":
          l.setRect([o - (e.right + a), 0, a, n]);
          break;
      }
      if (y === null) {
        e[b.getPosition()] += a;
      }
    }
    o -= e.left + e.right;
    n -= e.top + e.bottom;
    u = [e.left, e.top, o, n];
    e.left += v.left;
    e.top += v.top;
    e.right += v.right;
    e.bottom += v.bottom;
    p = o - v.left - v.right;
    s = n - v.top - v.bottom;
    A.setInnerRect([e.left, e.top, p, s]);
    if (p <= 0 || s <= 0) {
      return;
    }
    A.setMainRect(u);
    A.getSurface().setRect(u);
    for (x = 0, g = A.surfaceMap.grid && A.surfaceMap.grid.length; x < g; x++) {
      c = A.surfaceMap.grid[x];
      c.setRect(u);
      c.matrix.set(1, 0, 0, 1, v.left, v.top);
      c.matrix.inverse(c.inverseMatrix);
    }
    for (x = 0; x < z.length; x++) {
      b = z[x];
      l = b.getSurface();
      t = l.matrix;
      k = t.elements;
      switch (b.getPosition()) {
        case "top":
        case "bottom":
          k[4] = e.left;
          b.setLength(p);
          break;
        case "left":
        case "right":
          k[5] = e.top;
          b.setLength(s);
          break;
      }
      b.updateTitleSprite();
      t.inverse(l.inverseMatrix);
    }
    for (x = 0, g = q.length; x < g; x++) {
      h = q[x];
      r = h.getSurface();
      r.setRect(u);
      if (w) {
        if (j) {
          r.matrix.set(0, -1, -1, 0, v.left + p, v.top + s);
        } else {
          r.matrix.set(0, -1, 1, 0, v.left, v.top + s);
        }
      } else {
        r.matrix.set(1, 0, 0, -1, v.left, v.top + s);
      }
      r.matrix.inverse(r.inverseMatrix);
      h.getOverlaySurface().setRect(u);
    }
    A.redraw();
    A.animationSuspendCount--;
    A.resumeThicknessChanged();
  },
  refloatAxes: function () {
    var j = this,
      g = j.getAxes(),
      p = (g && g.length) || 0,
      c,
      d,
      o,
      f,
      m,
      b,
      l,
      h = j.getChartRect(),
      r = j.getInsetPadding(),
      q = j.getInnerPadding(),
      a = h[2] - r.left - r.right,
      n = h[3] - r.top - r.bottom,
      k,
      e;
    for (e = 0; e < p; e++) {
      c = g[e];
      f = c.getFloating();
      m = f ? f.value : null;
      if (m === null) {
        c.floatingAtCoord = null;
        continue;
      }
      d = c.getSurface();
      o = d.getRect();
      if (!o) {
        continue;
      }
      o = o.slice();
      b = j.getAxis(f.alongAxis);
      if (b) {
        k = b.getAlignment() === "horizontal";
        if (Ext.isString(m)) {
          m = b.getCoordFor(m);
        }
        b.floatingAxes[c.getId()] = m;
        l = b.getSprites()[0].attr.matrix;
        if (k) {
          m = m * l.getXX() + l.getDX();
          c.floatingAtCoord = m + q.left + q.right;
        } else {
          m = m * l.getYY() + l.getDY();
          c.floatingAtCoord = m + q.top + q.bottom;
        }
      } else {
        k = c.getAlignment() === "horizontal";
        if (k) {
          c.floatingAtCoord = m + q.top + q.bottom;
        } else {
          c.floatingAtCoord = m + q.left + q.right;
        }
        m = d.roundPixel(0.01 * m * (k ? n : a));
      }
      switch (c.getPosition()) {
        case "top":
          o[1] = r.top + q.top + m - o[3] + 1;
          break;
        case "bottom":
          o[1] = r.top + q.top + (b ? m : n - m);
          break;
        case "left":
          o[0] = r.left + q.left + m - o[2];
          break;
        case "right":
          o[0] = r.left + q.left + (b ? m : a - m) - 1;
          break;
      }
      d.setRect(o);
    }
  },
  redraw: function () {
    var C = this,
      r = C.getSeries(),
      z = C.getAxes(),
      b = C.getMainRect(),
      p,
      t,
      w = C.getInnerPadding(),
      f,
      l,
      s,
      e,
      q,
      A,
      v,
      g,
      d,
      c,
      a,
      k,
      n,
      y = C.getFlipXY(),
      x = 1000,
      m,
      u,
      h,
      o,
      B;
    if (!b) {
      return;
    }
    p = b[2] - w.left - w.right;
    t = b[3] - w.top - w.bottom;
    for (A = 0; A < r.length; A++) {
      h = r[A];
      if ((c = h.getXAxis())) {
        n = c.getVisibleRange();
        l = c.getRange();
        l = [l[0] + (l[1] - l[0]) * n[0], l[0] + (l[1] - l[0]) * n[1]];
      } else {
        l = h.getXRange();
      }
      if ((a = h.getYAxis())) {
        n = a.getVisibleRange();
        s = a.getRange();
        s = [s[0] + (s[1] - s[0]) * n[0], s[0] + (s[1] - s[0]) * n[1]];
      } else {
        s = h.getYRange();
      }
      q = {
        visibleMinX: l[0],
        visibleMaxX: l[1],
        visibleMinY: s[0],
        visibleMaxY: s[1],
        innerWidth: p,
        innerHeight: t,
        flipXY: y
      };
      f = h.getSprites();
      for (v = 0, g = f.length; v < g; v++) {
        o = f[v];
        m = o.attr.zIndex;
        if (m < x) {
          m += (A + 1) * 100 + x;
          o.attr.zIndex = m;
          B = o.getMarker("items");
          if (B) {
            u = B.attr.zIndex;
            if (u === Number.MAX_VALUE) {
              B.attr.zIndex = m;
            } else {
              if (u < x) {
                B.attr.zIndex = m + u;
              }
            }
          }
        }
        o.setAttributes(q, true);
      }
    }
    for (A = 0; A < z.length; A++) {
      d = z[A];
      e = d.isSide();
      f = d.getSprites();
      k = d.getRange();
      n = d.getVisibleRange();
      q = { dataMin: k[0], dataMax: k[1], visibleMin: n[0], visibleMax: n[1] };
      if (e) {
        q.length = t;
        q.startGap = w.bottom;
        q.endGap = w.top;
      } else {
        q.length = p;
        q.startGap = w.left;
        q.endGap = w.right;
      }
      for (v = 0, g = f.length; v < g; v++) {
        f[v].setAttributes(q, true);
      }
    }
    C.renderFrame();
    C.callParent(arguments);
  },
  renderFrame: function () {
    this.refloatAxes();
    this.callParent();
  }
});
Ext.define("Ext.chart.grid.CircularGrid", {
  extend: "Ext.draw.sprite.Circle",
  alias: "grid.circular",
  inheritableStatics: { def: { defaults: { r: 1, strokeStyle: "#DDD" } } }
});
Ext.define("Ext.chart.grid.RadialGrid", {
  extend: "Ext.draw.sprite.Path",
  alias: "grid.radial",
  inheritableStatics: {
    def: {
      processors: { startRadius: "number", endRadius: "number" },
      defaults: {
        startRadius: 0,
        endRadius: 1,
        scalingCenterX: 0,
        scalingCenterY: 0,
        strokeStyle: "#DDD"
      },
      triggers: { startRadius: "path,bbox", endRadius: "path,bbox" }
    }
  },
  render: function () {
    this.callParent(arguments);
  },
  updatePath: function (d, a) {
    var b = a.startRadius,
      c = a.endRadius;
    d.moveTo(b, 0);
    d.lineTo(c, 0);
  }
});
Ext.define("Ext.chart.PolarChart", {
  extend: "Ext.chart.AbstractChart",
  requires: ["Ext.chart.grid.CircularGrid", "Ext.chart.grid.RadialGrid"],
  xtype: "polar",
  isPolar: true,
  config: { center: [0, 0], radius: 0, innerPadding: 0 },
  getDirectionForAxis: function (a) {
    return a === "radial" ? "Y" : "X";
  },
  applyCenter: function (a, b) {
    if (b && a[0] === b[0] && a[1] === b[1]) {
      return;
    }
    return [+a[0], +a[1]];
  },
  updateCenter: function (a) {
    var g = this,
      h = g.getAxes(),
      d = g.getSeries(),
      c,
      f,
      e,
      b;
    for (c = 0, f = h.length; c < f; c++) {
      e = h[c];
      e.setCenter(a);
    }
    for (c = 0, f = d.length; c < f; c++) {
      b = d[c];
      b.setCenter(a);
    }
  },
  applyInnerPadding: function (b, a) {
    return Ext.isNumber(b) ? b : a;
  },
  doSetSurfaceRect: function (b, c) {
    var a = this.getMainRect();
    b.setRect(c);
    b.matrix.set(1, 0, 0, 1, a[0] - c[0], a[1] - c[1]);
    b.inverseMatrix.set(1, 0, 0, 1, c[0] - a[0], c[1] - a[1]);
  },
  applyAxes: function (f, h) {
    var e = this,
      g = Ext.Array.from(e.config.series)[0],
      b,
      d,
      c,
      a;
    if (g.type === "radar" && f && f.length) {
      for (b = 0, d = f.length; b < d; b++) {
        c = f[b];
        if (c.position === "angular") {
          a = true;
          break;
        }
      }
      if (!a) {
        f.push({
          type: "category",
          position: "angular",
          fields: g.xField || g.angleField,
          style: { estStepSize: 1 },
          grid: true
        });
      }
    }
    return this.callParent([f, h]);
  },
  performLayout: function () {
    var E = this,
      g = true;
    try {
      E.animationSuspendCount++;
      if (this.callParent() === false) {
        g = false;
        return;
      }
      E.suspendThicknessChanged();
      var h = E.getSurface("chart").getRect(),
        v = E.getInsetPadding(),
        F = E.getInnerPadding(),
        l = Ext.apply({}, v),
        s = Math.max(1, h[2] - h[0] - v.left - v.right),
        r = Math.max(1, h[3] - h[1] - v.top - v.bottom),
        x = [v.left, v.top, s + h[0], r + h[1]],
        u = E.getSeries(),
        t = s - F * 2,
        w = r - F * 2,
        C = [h[0] + t * 0.5 + F, h[1] + w * 0.5 + F],
        j = Math.min(t, w) * 0.5,
        A = E.getAxes(),
        m = [],
        p = [],
        D = j - F,
        b = E.surfaceMap.grid,
        z,
        n,
        c,
        q,
        y,
        e,
        B,
        d,
        o,
        f,
        a,
        k;
      E.setMainRect(x);
      E.doSetSurfaceRect(E.getSurface(), x);
      if (b) {
        for (z = 0, n = b.length; z < n; z++) {
          E.doSetSurfaceRect(b[z], h);
        }
      }
      for (z = 0, n = A.length; z < n; z++) {
        f = A[z];
        switch (f.getPosition()) {
          case "angular":
            m.push(f);
            break;
          case "radial":
            p.push(f);
            break;
        }
      }
      for (z = 0, n = m.length; z < n; z++) {
        f = m[z];
        q = f.getFloating();
        y = q ? q.value : null;
        E.doSetSurfaceRect(f.getSurface(), h);
        a = f.getThickness();
        for (d in l) {
          l[d] += a;
        }
        s = h[2] - l.left - l.right;
        r = h[3] - l.top - l.bottom;
        c = Math.min(s, r) * 0.5;
        if (z === 0) {
          D = c - F;
        }
        f.setMinimum(0);
        f.setLength(c);
        f.getSprites();
        k = f.sprites[0].attr.lineWidth * 0.5;
        for (d in l) {
          l[d] += k;
        }
      }
      for (z = 0, n = p.length; z < n; z++) {
        f = p[z];
        E.doSetSurfaceRect(f.getSurface(), h);
        f.setMinimum(0);
        f.setLength(D);
        f.getSprites();
      }
      for (z = 0, n = u.length; z < n; z++) {
        o = u[z];
        if (o.type === "gauge" && !e) {
          e = o;
        } else {
          o.setRadius(D);
        }
        E.doSetSurfaceRect(o.getSurface(), x);
      }
      E.doSetSurfaceRect(E.getSurface("overlay"), h);
      if (e) {
        e.setRect(x);
        B = e.getRadius() - F;
        E.setRadius(B);
        E.setCenter(e.getCenter());
        e.setRadius(B);
        if (A.length && A[0].getPosition() === "gauge") {
          f = A[0];
          E.doSetSurfaceRect(f.getSurface(), h);
          f.setTotalAngle(e.getTotalAngle());
          f.setLength(B);
        }
      } else {
        E.setRadius(j);
        E.setCenter(C);
      }
      E.redraw();
    } finally {
      E.animationSuspendCount--;
      if (g) {
        E.resumeThicknessChanged();
      }
    }
  },
  refloatAxes: function () {
    var j = this,
      g = j.getAxes(),
      h = j.getMainRect(),
      f,
      k,
      b,
      d,
      a,
      c,
      e;
    if (!h) {
      return;
    }
    e = 0.5 * Math.min(h[2], h[3]);
    for (d = 0, a = g.length; d < a; d++) {
      c = g[d];
      f = c.getFloating();
      k = f ? f.value : null;
      if (k !== null) {
        b = j.getAxis(f.alongAxis);
        if (c.getPosition() === "angular") {
          if (b) {
            k = (b.getLength() * k) / b.getRange()[1];
          } else {
            k = 0.01 * k * e;
          }
          c.sprites[0].setAttributes({ length: k }, true);
        } else {
          if (b) {
            if (Ext.isString(k)) {
              k = b.getCoordFor(k);
            }
            k =
              (k / (b.getRange()[1] + 1)) * Math.PI * 2 -
              Math.PI * 1.5 +
              c.getRotation();
          } else {
            k = Ext.draw.Draw.rad(k);
          }
          c.sprites[0].setAttributes({ baseRotation: k }, true);
        }
      }
    }
  },
  redraw: function () {
    var f = this,
      g = f.getAxes(),
      d,
      c = f.getSeries(),
      b,
      a,
      e;
    for (a = 0, e = g.length; a < e; a++) {
      d = g[a];
      d.getSprites();
    }
    for (a = 0, e = c.length; a < e; a++) {
      b = c[a];
      b.getSprites();
    }
    f.renderFrame();
    f.callParent();
  },
  renderFrame: function () {
    this.refloatAxes();
    this.callParent();
  }
});
Ext.define("Ext.chart.SpaceFillingChart", {
  extend: "Ext.chart.AbstractChart",
  xtype: "spacefilling",
  config: {},
  performLayout: function () {
    var g = this;
    try {
      g.animationSuspendCount++;
      if (g.callParent() === false) {
        return;
      }
      var h = g.getSurface("chart").getRect(),
        j = g.getInsetPadding(),
        a = h[2] - j.left - j.right,
        k = h[3] - j.top - j.bottom,
        f = [j.left, j.top, a, k],
        b = g.getSeries(),
        d,
        c,
        e;
      g.getSurface().setRect(f);
      g.setMainRect(f);
      for (c = 0, e = b.length; c < e; c++) {
        d = b[c];
        d.getSurface().setRect(f);
        if (d.setRect) {
          d.setRect(f);
        }
        d.getOverlaySurface().setRect(h);
      }
      g.redraw();
    } finally {
      g.animationSuspendCount--;
    }
  },
  redraw: function () {
    var e = this,
      c = e.getSeries(),
      b,
      a,
      d;
    for (a = 0, d = c.length; a < d; a++) {
      b = c[a];
      b.getSprites();
    }
    e.renderFrame();
    e.callParent();
  }
});
Ext.define("Ext.chart.axis.sprite.Axis3D", {
  extend: "Ext.chart.axis.sprite.Axis",
  alias: "sprite.axis3d",
  type: "axis3d",
  inheritableStatics: {
    def: {
      processors: { depth: "number" },
      defaults: { depth: 0 },
      triggers: { depth: "layout" }
    }
  },
  config: { fx: { customDurations: { depth: 0 } } },
  layoutUpdater: function () {
    var h = this,
      f = h.getAxis().getChart();
    if (f.isInitializing) {
      return;
    }
    var e = h.attr,
      d = h.getLayout(),
      c = d.isDiscrete ? 0 : e.depth,
      g = f.getInherited().rtl,
      b = e.dataMin + (e.dataMax - e.dataMin) * e.visibleMin,
      i = e.dataMin + (e.dataMax - e.dataMin) * e.visibleMax,
      a = { attr: e, segmenter: h.getSegmenter(), renderer: h.defaultRenderer };
    if (e.position === "left" || e.position === "right") {
      e.translationX = 0;
      e.translationY = (i * (e.length - c)) / (i - b) + c;
      e.scalingX = 1;
      e.scalingY = (-e.length + c) / (i - b);
      e.scalingCenterY = 0;
      e.scalingCenterX = 0;
      h.applyTransformations(true);
    } else {
      if (e.position === "top" || e.position === "bottom") {
        if (g) {
          e.translationX = e.length + (b * e.length) / (i - b) + 1;
        } else {
          e.translationX = (-b * e.length) / (i - b);
        }
        e.translationY = 0;
        e.scalingX = ((g ? -1 : 1) * (e.length - c)) / (i - b);
        e.scalingY = 1;
        e.scalingCenterY = 0;
        e.scalingCenterX = 0;
        h.applyTransformations(true);
      }
    }
    if (d) {
      d.calculateLayout(a);
      h.setLayoutContext(a);
    }
  },
  renderAxisLine: function (a, j, f, c) {
    var i = this,
      h = i.attr,
      b = h.lineWidth * 0.5,
      f = i.getLayout(),
      d = f.isDiscrete ? 0 : h.depth,
      k = h.position,
      e,
      g;
    if (h.axisLine && h.length) {
      switch (k) {
        case "left":
          e = a.roundPixel(c[2]) - b;
          j.moveTo(e, -h.endGap + d);
          j.lineTo(e, h.length + h.startGap);
          break;
        case "right":
          j.moveTo(b, -h.endGap);
          j.lineTo(b, h.length + h.startGap);
          break;
        case "bottom":
          j.moveTo(-h.startGap, b);
          j.lineTo(h.length - d + h.endGap, b);
          break;
        case "top":
          e = a.roundPixel(c[3]) - b;
          j.moveTo(-h.startGap, e);
          j.lineTo(h.length + h.endGap, e);
          break;
        case "angular":
          j.moveTo(h.centerX + h.length, h.centerY);
          j.arc(h.centerX, h.centerY, h.length, 0, Math.PI * 2, true);
          break;
        case "gauge":
          g = i.getGaugeAngles();
          j.moveTo(
            h.centerX + Math.cos(g.start) * h.length,
            h.centerY + Math.sin(g.start) * h.length
          );
          j.arc(h.centerX, h.centerY, h.length, g.start, g.end, true);
          break;
      }
    }
  }
});
Ext.define("Ext.chart.axis.Axis3D", {
  extend: "Ext.chart.axis.Axis",
  xtype: "axis3d",
  requires: ["Ext.chart.axis.sprite.Axis3D"],
  config: { depth: 0 },
  onSeriesChange: function (e) {
    var g = this,
      b = "depthchange",
      f = "onSeriesDepthChange",
      d,
      c;
    function a(h) {
      var i = g.boundSeries;
      for (d = 0; d < i.length; d++) {
        c = i[d];
        c[h](b, f, g);
      }
    }
    a("un");
    g.callParent(arguments);
    a("on");
  },
  onSeriesDepthChange: function (b, f) {
    var d = this,
      g = f,
      e = d.boundSeries,
      a,
      c;
    if (f > d.getDepth()) {
      g = f;
    } else {
      for (a = 0; a < e.length; a++) {
        c = e[a];
        if (c !== b && c.getDepth) {
          f = c.getDepth();
          if (f > g) {
            g = f;
          }
        }
      }
    }
    d.setDepth(g);
  },
  updateDepth: function (d) {
    var b = this,
      c = b.getSprites(),
      a = { depth: d };
    if (c && c.length) {
      c[0].setAttributes(a);
    }
    if (b.gridSpriteEven && b.gridSpriteOdd) {
      b.gridSpriteEven.getTemplate().setAttributes(a);
      b.gridSpriteOdd.getTemplate().setAttributes(a);
    }
  },
  getGridAlignment: function () {
    switch (this.getPosition()) {
      case "left":
      case "right":
        return "horizontal3d";
      case "top":
      case "bottom":
        return "vertical3d";
    }
  }
});
Ext.define("Ext.chart.axis.Category", {
  requires: [
    "Ext.chart.axis.layout.CombineDuplicate",
    "Ext.chart.axis.segmenter.Names"
  ],
  extend: "Ext.chart.axis.Axis",
  alias: "axis.category",
  type: "category",
  config: { layout: "combineDuplicate", segmenter: "names" }
});
Ext.define("Ext.chart.axis.Category3D", {
  requires: [
    "Ext.chart.axis.layout.CombineDuplicate",
    "Ext.chart.axis.segmenter.Names"
  ],
  extend: "Ext.chart.axis.Axis3D",
  alias: "axis.category3d",
  type: "category3d",
  config: { layout: "combineDuplicate", segmenter: "names" }
});
Ext.define("Ext.chart.axis.Numeric", {
  extend: "Ext.chart.axis.Axis",
  type: "numeric",
  alias: ["axis.numeric", "axis.radial"],
  requires: [
    "Ext.chart.axis.layout.Continuous",
    "Ext.chart.axis.segmenter.Numeric"
  ],
  config: { layout: "continuous", segmenter: "numeric", aggregator: "double" }
});
Ext.define("Ext.chart.axis.Numeric3D", {
  extend: "Ext.chart.axis.Axis3D",
  alias: ["axis.numeric3d"],
  type: "numeric3d",
  requires: [
    "Ext.chart.axis.layout.Continuous",
    "Ext.chart.axis.segmenter.Numeric"
  ],
  config: { layout: "continuous", segmenter: "numeric", aggregator: "double" }
});
Ext.define("Ext.chart.axis.Time", {
  extend: "Ext.chart.axis.Numeric",
  alias: "axis.time",
  type: "time",
  requires: [
    "Ext.chart.axis.layout.Continuous",
    "Ext.chart.axis.segmenter.Time"
  ],
  config: {
    calculateByLabelSize: true,
    dateFormat: null,
    fromDate: null,
    toDate: null,
    layout: "continuous",
    segmenter: "time",
    aggregator: "time"
  },
  updateDateFormat: function (b) {
    var a = this.getRenderer();
    if (!a || a.isDefault) {
      a = function (d, c) {
        return Ext.Date.format(new Date(c), b);
      };
      a.isDefault = true;
      this.setRenderer(a);
      this.performLayout();
    }
  },
  updateRenderer: function (b) {
    var a = this.getDateFormat();
    if (b) {
      this.performLayout();
    } else {
      if (a) {
        this.updateDateFormat(a);
      }
    }
  },
  updateFromDate: function (a) {
    this.setMinimum(+a);
  },
  updateToDate: function (a) {
    this.setMaximum(+a);
  },
  getCoordFor: function (a) {
    if (Ext.isString(a)) {
      a = new Date(a);
    }
    return +a;
  }
});
Ext.define("Ext.chart.axis.Time3D", {
  extend: "Ext.chart.axis.Numeric3D",
  alias: "axis.time3d",
  type: "time3d",
  requires: [
    "Ext.chart.axis.layout.Continuous",
    "Ext.chart.axis.segmenter.Time"
  ],
  config: {
    calculateByLabelSize: true,
    dateFormat: null,
    fromDate: null,
    toDate: null,
    layout: "continuous",
    segmenter: "time",
    aggregator: "time"
  },
  updateDateFormat: function (a) {
    this.setRenderer(function (c, b) {
      return Ext.Date.format(new Date(b), a);
    });
  },
  updateFromDate: function (a) {
    this.setMinimum(+a);
  },
  updateToDate: function (a) {
    this.setMaximum(+a);
  },
  getCoordFor: function (a) {
    if (Ext.isString(a)) {
      a = new Date(a);
    }
    return +a;
  }
});
Ext.define("Ext.chart.grid.HorizontalGrid3D", {
  extend: "Ext.chart.grid.HorizontalGrid",
  alias: "grid.horizontal3d",
  inheritableStatics: {
    def: { processors: { depth: "number" }, defaults: { depth: 0 } }
  },
  render: function (a, k, h) {
    var e = this.attr,
      i = a.roundPixel(e.x),
      g = a.roundPixel(e.y),
      l = a.matrix.getDX(),
      c = k.lineWidth * 0.5,
      j = e.height,
      d = e.depth,
      b,
      f;
    if (g <= h[1]) {
      return;
    }
    b = h[0] + d - l;
    f = g + c - d;
    k.beginPath();
    k.rect(b, f, h[2], j);
    k.fill();
    k.beginPath();
    k.moveTo(b, f);
    k.lineTo(b + h[2], f);
    k.stroke();
    b = h[0] + i - l;
    f = g + c;
    k.beginPath();
    k.moveTo(b, f);
    k.lineTo(b + d, f - d);
    k.lineTo(b + d, f - d + j);
    k.lineTo(b, f + j);
    k.closePath();
    k.fill();
    k.beginPath();
    k.moveTo(b, f);
    k.lineTo(b + d, f - d);
    k.stroke();
  }
});
Ext.define("Ext.chart.grid.VerticalGrid3D", {
  extend: "Ext.chart.grid.VerticalGrid",
  alias: "grid.vertical3d",
  inheritableStatics: {
    def: { processors: { depth: "number" }, defaults: { depth: 0 } }
  },
  render: function (b, j, e) {
    var g = this.attr,
      i = b.roundPixel(g.x),
      k = b.matrix.getDY(),
      d = j.lineWidth * 0.5,
      a = g.width,
      f = g.depth,
      c,
      h;
    if (i >= e[2]) {
      return;
    }
    c = i - d + f;
    h = e[1] - f - k;
    j.beginPath();
    j.rect(c, h, a, e[3]);
    j.fill();
    j.beginPath();
    j.moveTo(c, h);
    j.lineTo(c, h + e[3]);
    j.stroke();
    c = i - d;
    h = e[3];
    j.beginPath();
    j.moveTo(c, h);
    j.lineTo(c + f, h - f);
    j.lineTo(c + f + a, h - f);
    j.lineTo(c + a, h);
    j.closePath();
    j.fill();
    c = i - d;
    h = e[3];
    j.beginPath();
    j.moveTo(c, h);
    j.lineTo(c + f, h - f);
    j.stroke();
  }
});
Ext.define("Ext.chart.interactions.CrossZoom", {
  extend: "Ext.chart.interactions.Abstract",
  type: "crosszoom",
  alias: "interaction.crosszoom",
  isCrossZoom: true,
  config: {
    axes: true,
    gestures: {
      dragstart: "onGestureStart",
      drag: "onGesture",
      dragend: "onGestureEnd",
      dblclick: "onDoubleTap"
    },
    undoButton: {}
  },
  stopAnimationBeforeSync: false,
  zoomAnimationInProgress: false,
  constructor: function () {
    this.callParent(arguments);
    this.zoomHistory = [];
  },
  applyAxes: function (b) {
    var a = {};
    if (b === true) {
      return { top: {}, right: {}, bottom: {}, left: {} };
    } else {
      if (Ext.isArray(b)) {
        a = {};
        Ext.each(b, function (c) {
          a[c] = {};
        });
      } else {
        if (Ext.isObject(b)) {
          Ext.iterate(b, function (c, d) {
            if (d === true) {
              a[c] = {};
            } else {
              if (d !== false) {
                a[c] = d;
              }
            }
          });
        }
      }
    }
    return a;
  },
  applyUndoButton: function (b, a) {
    var c = this;
    if (a) {
      a.destroy();
    }
    if (b) {
      return Ext.create(
        "Ext.Button",
        Ext.apply(
          {
            cls: [],
            text: "Undo Zoom",
            disabled: true,
            handler: function () {
              c.undoZoom();
            }
          },
          b
        )
      );
    }
  },
  getSurface: function () {
    return this.getChart() && this.getChart().getSurface("main");
  },
  setSeriesOpacity: function (b) {
    var a = this.getChart() && this.getChart().getSurface("series");
    if (a) {
      a.element.setStyle("opacity", b);
    }
  },
  onGestureStart: function (h) {
    var j = this,
      i = j.getChart(),
      d = j.getSurface(),
      l = i.getInnerRect(),
      c = i.getInnerPadding(),
      g = c.left,
      b = g + l[2],
      f = c.top,
      a = f + l[3],
      n = i.getEventXY(h),
      m = n[0],
      k = n[1];
    h.claimGesture();
    if (j.zoomAnimationInProgress) {
      return;
    }
    if (m > g && m < b && k > f && k < a) {
      j.gestureEvent = "drag";
      j.lockEvents(j.gestureEvent);
      j.startX = m;
      j.startY = k;
      j.selectionRect = d.add({
        type: "rect",
        globalAlpha: 0.5,
        fillStyle: "rgba(80,80,140,0.5)",
        strokeStyle: "rgba(80,80,140,1)",
        lineWidth: 2,
        x: m,
        y: k,
        width: 0,
        height: 0,
        zIndex: 10000
      });
      j.setSeriesOpacity(0.8);
      return false;
    }
  },
  onGesture: function (h) {
    var j = this;
    if (j.zoomAnimationInProgress) {
      return;
    }
    if (j.getLocks()[j.gestureEvent] === j) {
      var i = j.getChart(),
        d = j.getSurface(),
        l = i.getInnerRect(),
        c = i.getInnerPadding(),
        g = c.left,
        b = g + l[2],
        f = c.top,
        a = f + l[3],
        n = i.getEventXY(h),
        m = n[0],
        k = n[1];
      if (m < g) {
        m = g;
      } else {
        if (m > b) {
          m = b;
        }
      }
      if (k < f) {
        k = f;
      } else {
        if (k > a) {
          k = a;
        }
      }
      j.selectionRect.setAttributes({
        width: m - j.startX,
        height: k - j.startY
      });
      if (Math.abs(j.startX - m) < 11 || Math.abs(j.startY - k) < 11) {
        j.selectionRect.setAttributes({ globalAlpha: 0.5 });
      } else {
        j.selectionRect.setAttributes({ globalAlpha: 1 });
      }
      d.renderFrame();
      return false;
    }
  },
  onGestureEnd: function (i) {
    var l = this;
    if (l.zoomAnimationInProgress) {
      return;
    }
    if (l.getLocks()[l.gestureEvent] === l) {
      var k = l.getChart(),
        d = l.getSurface(),
        n = k.getInnerRect(),
        c = k.getInnerPadding(),
        g = c.left,
        b = g + n[2],
        f = c.top,
        a = f + n[3],
        h = n[2],
        j = n[3],
        p = k.getEventXY(i),
        o = p[0],
        m = p[1];
      if (o < g) {
        o = g;
      } else {
        if (o > b) {
          o = b;
        }
      }
      if (m < f) {
        m = f;
      } else {
        if (m > a) {
          m = a;
        }
      }
      if (Math.abs(l.startX - o) < 11 || Math.abs(l.startY - m) < 11) {
        d.remove(l.selectionRect);
      } else {
        l.zoomBy([
          Math.min(l.startX, o) / h,
          1 - Math.max(l.startY, m) / j,
          Math.max(l.startX, o) / h,
          1 - Math.min(l.startY, m) / j
        ]);
        l.selectionRect.setAttributes({
          x: Math.min(l.startX, o),
          y: Math.min(l.startY, m),
          width: Math.abs(l.startX - o),
          height: Math.abs(l.startY - m)
        });
        l.selectionRect.setAnimation(k.getAnimation() || { duration: 0 });
        l.selectionRect.setAttributes({
          globalAlpha: 0,
          x: 0,
          y: 0,
          width: h,
          height: j
        });
        l.zoomAnimationInProgress = true;
        k.suspendThicknessChanged();
        l.selectionRect.fx.on("animationend", function () {
          k.resumeThicknessChanged();
          d.remove(l.selectionRect);
          l.selectionRect = null;
          l.zoomAnimationInProgress = false;
        });
      }
      d.renderFrame();
      l.sync();
      l.unlockEvents(l.gestureEvent);
      l.setSeriesOpacity(1);
      if (!l.zoomAnimationInProgress) {
        d.remove(l.selectionRect);
        l.selectionRect = null;
      }
    }
  },
  zoomBy: function (o) {
    var n = this,
      a = n.getAxes(),
      k = n.getChart(),
      j = k.getAxes(),
      l = k.getInherited().rtl,
      f,
      d = {},
      c,
      b;
    if (l) {
      o = o.slice();
      c = 1 - o[0];
      b = 1 - o[2];
      o[0] = Math.min(c, b);
      o[2] = Math.max(c, b);
    }
    for (var h = 0; h < j.length; h++) {
      var g = j[h];
      f = a[g.getPosition()];
      if (f && f.allowZoom !== false) {
        var e = g.isSide(),
          m = g.getVisibleRange();
        d[g.getId()] = m.slice(0);
        if (!e) {
          g.setVisibleRange([
            (m[1] - m[0]) * o[0] + m[0],
            (m[1] - m[0]) * o[2] + m[0]
          ]);
        } else {
          g.setVisibleRange([
            (m[1] - m[0]) * o[1] + m[0],
            (m[1] - m[0]) * o[3] + m[0]
          ]);
        }
      }
    }
    n.zoomHistory.push(d);
    n.getUndoButton().setDisabled(false);
  },
  undoZoom: function () {
    var c = this.zoomHistory.pop(),
      d = this.getChart().getAxes();
    if (c) {
      for (var a = 0; a < d.length; a++) {
        var b = d[a];
        if (c[b.getId()]) {
          b.setVisibleRange(c[b.getId()]);
        }
      }
    }
    this.getUndoButton().setDisabled(this.zoomHistory.length === 0);
    this.sync();
  },
  onDoubleTap: function (a) {
    this.undoZoom();
  },
  destroy: function () {
    this.setUndoButton(null);
    this.callParent();
  }
});
Ext.define("Ext.chart.interactions.Crosshair", {
  extend: "Ext.chart.interactions.Abstract",
  requires: [
    "Ext.chart.grid.HorizontalGrid",
    "Ext.chart.grid.VerticalGrid",
    "Ext.chart.CartesianChart",
    "Ext.chart.axis.layout.Discrete"
  ],
  type: "crosshair",
  alias: "interaction.crosshair",
  config: {
    axes: {
      top: { label: {}, rect: {} },
      right: { label: {}, rect: {} },
      bottom: { label: {}, rect: {} },
      left: { label: {}, rect: {} }
    },
    lines: {
      horizontal: { strokeStyle: "black", lineDash: [5, 5] },
      vertical: { strokeStyle: "black", lineDash: [5, 5] }
    },
    gesture: "drag"
  },
  applyAxes: function (b, a) {
    return Ext.merge(a || {}, b);
  },
  applyLines: function (a, b) {
    return Ext.merge(b || {}, a);
  },
  updateChart: function (a) {
    if (a && !a.isCartesian) {
      Ext.raise("Crosshair interaction can only be used on cartesian charts.");
    }
    this.callParent(arguments);
  },
  getGestures: function () {
    var a = this,
      b = {};
    b[a.getGesture()] = "onGesture";
    b[a.getGesture() + "start"] = "onGestureStart";
    b[a.getGesture() + "end"] = "onGestureEnd";
    return b;
  },
  onGestureStart: function (N) {
    var m = this,
      O = m.getChart(),
      B = O.getTheme().getAxis(),
      A,
      F = O.getSurface("overlay"),
      s = O.getInnerRect(),
      n = s[2],
      M = s[3],
      r = O.getEventXY(N),
      D = r[0],
      C = r[1],
      E = O.getAxes(),
      u = m.getAxes(),
      h = m.getLines(),
      q,
      v,
      b,
      d,
      k,
      z,
      G,
      L,
      J,
      o,
      I,
      w,
      l,
      f,
      p,
      j,
      t,
      a,
      g,
      H,
      c,
      K;
    N.claimGesture();
    if (D > 0 && D < n && C > 0 && C < M) {
      m.lockEvents(m.getGesture());
      H = Ext.apply(
        { xclass: "Ext.chart.grid.HorizontalGrid", x: 0, y: C, width: n },
        h.horizontal
      );
      c = Ext.apply(
        { xclass: "Ext.chart.grid.VerticalGrid", x: D, y: 0, height: M },
        h.vertical
      );
      m.axesLabels = m.axesLabels || {};
      for (K = 0; K < E.length; K++) {
        q = E[K];
        v = q.getSurface();
        b = v.getRect();
        w = q.getSprites()[0];
        d = b[2];
        k = b[3];
        z = q.getPosition();
        G = q.getAlignment();
        t = q.getTitle();
        a = t && t.attr.text !== "" && t.getBBox();
        l = w.attr;
        f = w.thickness;
        p = l.axisLine ? l.lineWidth : 0;
        j = p / 2;
        I = Math.max(l.majorTickSize, l.minorTickSize) + p;
        L = m.axesLabels[z] = v.add({ type: "composite" });
        L.labelRect = L.add(
          Ext.apply(
            {
              type: "rect",
              fillStyle: "white",
              x: z === "right" ? p : 0,
              y: z === "bottom" ? p : 0,
              width: d - p - (G === "vertical" && a ? a.width : 0),
              height: k - p - (G === "horizontal" && a ? a.height : 0),
              translationX: z === "left" && a ? a.width : 0,
              translationY: z === "top" && a ? a.height : 0
            },
            u.rect || u[z].rect
          )
        );
        if (G === "vertical" && !c.strokeStyle) {
          c.strokeStyle = l.strokeStyle;
        }
        if (G === "horizontal" && !H.strokeStyle) {
          H.strokeStyle = l.strokeStyle;
        }
        A = Ext.merge({}, B.defaults, B[z]);
        J = Ext.apply({}, q.config.label, A.label);
        o = u.label || u[z].label;
        L.labelText = L.add(
          Ext.apply(J, o, {
            type: "text",
            x: (function () {
              switch (z) {
                case "left":
                  g = a ? a.x + a.width : 0;
                  return g + (d - g - I) / 2 - j;
                case "right":
                  g = a ? d - a.x : 0;
                  return I + (d - I - g) / 2 + j;
                default:
                  return 0;
              }
            })(),
            y: (function () {
              switch (z) {
                case "top":
                  g = a ? a.y + a.height : 0;
                  return g + (k - g - I) / 2 - j;
                case "bottom":
                  g = a ? k - a.y : 0;
                  return I + (k - I - g) / 2 + j;
                default:
                  return 0;
              }
            })()
          })
        );
      }
      m.horizontalLine = F.add(H);
      m.verticalLine = F.add(c);
      return false;
    }
  },
  onGesture: function (G) {
    var K = this;
    if (K.getLocks()[K.getGesture()] !== K) {
      return;
    }
    var u = K.getChart(),
      z = u.getSurface("overlay"),
      a = Ext.Array.slice(u.getInnerRect()),
      r = u.getInnerPadding(),
      t = r.left,
      q = r.top,
      E = a[2],
      f = a[3],
      d = u.getEventXY(G),
      k = d[0],
      j = d[1],
      D = u.getAxes(),
      c,
      h,
      m,
      p,
      J,
      w,
      I,
      H,
      s,
      b,
      C,
      g,
      v,
      n,
      l,
      A,
      F,
      o,
      B;
    if (k < 0) {
      k = 0;
    } else {
      if (k > E) {
        k = E;
      }
    }
    if (j < 0) {
      j = 0;
    } else {
      if (j > f) {
        j = f;
      }
    }
    k += t;
    j += q;
    for (B = 0; B < D.length; B++) {
      c = D[B];
      h = c.getPosition();
      m = c.getAlignment();
      p = c.getSurface();
      J = c.getSprites()[0];
      w = J.attr.matrix;
      C = J.attr.textPadding * 2;
      s = K.axesLabels[h];
      I = J.getLayoutContext();
      H = c.getSegmenter();
      if (s) {
        if (m === "vertical") {
          v = w.getYY();
          l = w.getDY();
          F = (j - l - q) / v;
          if (c.getLayout() instanceof Ext.chart.axis.layout.Discrete) {
            j = Math.round(F) * v + l + q;
            F = H.from(Math.round(F));
            F = J.attr.data[F];
          } else {
            F = H.from(F);
          }
          o = H.renderer(F, I);
          s.setAttributes({ translationY: j - q });
          s.labelText.setAttributes({ text: o });
          b = s.labelText.getBBox();
          s.labelRect.setAttributes({
            height: b.height + C,
            y: -(b.height + C) / 2
          });
          p.renderFrame();
        } else {
          g = w.getXX();
          n = w.getDX();
          A = (k - n - t) / g;
          if (c.getLayout() instanceof Ext.chart.axis.layout.Discrete) {
            k = Math.round(A) * g + n + t;
            A = H.from(Math.round(A));
            A = J.attr.data[A];
          } else {
            A = H.from(A);
          }
          o = H.renderer(A, I);
          s.setAttributes({ translationX: k - t });
          s.labelText.setAttributes({ text: o });
          b = s.labelText.getBBox();
          s.labelRect.setAttributes({
            width: b.width + C,
            x: -(b.width + C) / 2
          });
          p.renderFrame();
        }
      }
    }
    K.horizontalLine.setAttributes({ y: j, strokeStyle: J.attr.strokeStyle });
    K.verticalLine.setAttributes({ x: k, strokeStyle: J.attr.strokeStyle });
    z.renderFrame();
    return false;
  },
  onGestureEnd: function (h) {
    var l = this,
      k = l.getChart(),
      a = k.getSurface("overlay"),
      j = k.getAxes(),
      c,
      g,
      d,
      b,
      f;
    a.remove(l.verticalLine);
    a.remove(l.horizontalLine);
    for (f = 0; f < j.length; f++) {
      c = j[f];
      g = c.getPosition();
      d = c.getSurface();
      b = l.axesLabels[g];
      if (b) {
        delete l.axesLabels[g];
        d.remove(b);
      }
      d.renderFrame();
    }
    a.renderFrame();
    l.unlockEvents(l.getGesture());
  }
});
Ext.define("Ext.chart.interactions.ItemHighlight", {
  extend: "Ext.chart.interactions.Abstract",
  type: "itemhighlight",
  alias: "interaction.itemhighlight",
  isItemHighlight: true,
  config: {
    gestures: {
      tap: "onTapGesture",
      mousemove: "onMouseMoveGesture",
      mousedown: "onMouseDownGesture",
      mouseup: "onMouseUpGesture",
      mouseleave: "onMouseUpGesture"
    },
    sticky: false
  },
  stickyHighlightItem: null,
  onMouseMoveGesture: function (g) {
    var d = this,
      h = d.tipItem,
      a = g.pointerType === "mouse",
      c,
      f,
      b;
    if (d.getSticky()) {
      return true;
    }
    if (a && d.stickyHighlightItem) {
      d.stickyHighlightItem = null;
      d.highlight(null);
    }
    if (d.isDragging) {
      if (h && a) {
        h.series.hideTooltip(h);
        d.tipItem = null;
      }
    } else {
      if (!d.stickyHighlightItem) {
        c = d.getItemForEvent(g);
        b = d.getChart();
        if (c !== b.getHighlightItem()) {
          d.highlight(c);
          d.sync();
        }
        if (a) {
          if (h && (!c || h.field !== c.field || h.record !== c.record)) {
            h.series.hideTooltip(h);
            d.tipItem = h = null;
          }
          if (c && (f = c.series.getTooltip())) {
            if (f.trackMouse || !h) {
              c.series.showTooltip(c, g);
            }
            d.tipItem = c;
          }
        }
        return false;
      }
    }
  },
  highlight: function (a) {
    this.getChart().setHighlightItem(a);
  },
  showTooltip: function (b, a) {
    a.series.showTooltip(a, b);
    this.tipItem = a;
  },
  onMouseDownGesture: function () {
    this.isDragging = true;
  },
  onMouseUpGesture: function () {
    this.isDragging = false;
  },
  onTapGesture: function (c) {
    var b = this;
    if (c.pointerType === "mouse" && !b.getSticky()) {
      return;
    }
    var a = b.getItemForEvent(c);
    if (b.stickyHighlightItem && a && b.stickyHighlightItem.index === a.index) {
      a = null;
    }
    b.stickyHighlightItem = a;
    b.highlight(a);
  }
});
Ext.define("Ext.chart.interactions.ItemEdit", {
  extend: "Ext.chart.interactions.ItemHighlight",
  requires: ["Ext.tip.ToolTip"],
  type: "itemedit",
  alias: "interaction.itemedit",
  isItemEdit: true,
  config: {
    style: null,
    renderer: null,
    tooltip: true,
    gestures: {
      dragstart: "onDragStart",
      drag: "onDrag",
      dragend: "onDragEnd"
    },
    cursors: { ewResize: "ew-resize", nsResize: "ns-resize", move: "move" }
  },
  item: null,
  applyTooltip: function (b) {
    if (b) {
      var a = Ext.apply({}, b, {
        renderer: this.defaultTooltipRenderer,
        constrainPosition: true,
        shrinkWrapDock: true,
        autoHide: true,
        trackMouse: true,
        mouseOffset: [20, 20]
      });
      b = new Ext.tip.ToolTip(a);
    }
    return b;
  },
  defaultTooltipRenderer: function (b, a, f, d) {
    var c = [];
    if (f.xField) {
      c.push(f.xField + ": " + f.xValue);
    }
    if (f.yField) {
      c.push(f.yField + ": " + f.yValue);
    }
    b.setHtml(c.join("<br>"));
  },
  onDragStart: function (d) {
    var c = this,
      a = c.getChart(),
      b = a.getHighlightItem();
    d.claimGesture();
    if (b) {
      a.fireEvent("beginitemedit", a, c, (c.item = b));
      return false;
    }
  },
  onDrag: function (f) {
    var d = this,
      b = d.getChart(),
      c = b.getHighlightItem(),
      a = c && c.sprite.type;
    if (c) {
      switch (a) {
        case "barSeries":
          return d.onDragBar(f);
          break;
        case "scatterSeries":
          return d.onDragScatter(f);
          break;
      }
    }
  },
  highlight: function (f) {
    var e = this,
      d = e.getChart(),
      a = d.getFlipXY(),
      g = e.getCursors(),
      c = f && f.sprite.type,
      b = d.el.dom.style;
    e.callParent([f]);
    if (f) {
      switch (c) {
        case "barSeries":
          if (a) {
            b.cursor = g.ewResize;
          } else {
            b.cursor = g.nsResize;
          }
          break;
        case "scatterSeries":
          b.cursor = g.move;
          break;
      }
    } else {
      d.el.dom.style.cursor = "default";
    }
  },
  onDragBar: function (i) {
    var m = this,
      k = m.getChart(),
      l = k.getInherited().rtl,
      f = k.isCartesian && k.getFlipXY(),
      q = k.getHighlightItem(),
      g = q.sprite.getMarker("items"),
      p = g.getMarkerFor(q.sprite.getId(), q.index),
      b = q.sprite.getSurface(),
      c = b.getRect(),
      r = b.getEventXY(i),
      o = q.sprite.attr.matrix,
      j = m.getRenderer(),
      a,
      n,
      d,
      h;
    if (f) {
      h = l ? c[2] - r[0] : r[0];
    } else {
      h = c[3] - r[1];
    }
    a = {
      x: p.x,
      y: h,
      width: p.width,
      height: p.height + (p.y - h),
      radius: p.radius,
      fillStyle: "none",
      lineDash: [4, 4],
      zIndex: 100
    };
    Ext.apply(a, m.getStyle());
    if (Ext.isArray(q.series.getYField())) {
      h = h - p.y - p.height;
    }
    m.target = {
      index: q.index,
      yField: q.field,
      yValue: (h - o.getDY()) / o.getYY()
    };
    d = [k, { target: m.target, style: a, item: q }];
    n = Ext.callback(j, null, d, 0, k);
    if (n) {
      Ext.apply(a, n);
    }
    q.sprite.putMarker("items", a, "itemedit");
    m.showTooltip(i, m.target, q);
    b.renderFrame();
  },
  onDragScatter: function (n) {
    var t = this,
      g = t.getChart(),
      d = g.getInherited().rtl,
      l = g.isCartesian && g.getFlipXY(),
      o = g.getHighlightItem(),
      b = o.sprite.getMarker("items"),
      p = b.getMarkerFor(o.sprite.getId(), o.index),
      j = o.sprite.getSurface(),
      h = j.getRect(),
      a = j.getEventXY(n),
      k = o.sprite.attr.matrix,
      c = o.series.getXAxis(),
      f = c && c.getLayout().isContinuous,
      i = t.getRenderer(),
      m,
      u,
      q,
      s,
      r;
    if (l) {
      r = d ? h[2] - a[0] : a[0];
    } else {
      r = h[3] - a[1];
    }
    if (f) {
      if (l) {
        s = h[3] - a[1];
      } else {
        s = a[0];
      }
    } else {
      s = p.translationX;
    }
    m = {
      translationX: s,
      translationY: r,
      scalingX: p.scalingX,
      scalingY: p.scalingY,
      r: p.r,
      fillStyle: "none",
      lineDash: [4, 4],
      zIndex: 100
    };
    Ext.apply(m, t.getStyle());
    t.target = {
      index: o.index,
      yField: o.field,
      yValue: (r - k.getDY()) / k.getYY()
    };
    if (f) {
      Ext.apply(t.target, {
        xField: o.series.getXField(),
        xValue: (s - k.getDX()) / k.getXX()
      });
    }
    q = [g, { target: t.target, style: m, item: o }];
    u = Ext.callback(i, null, q, 0, g);
    if (u) {
      Ext.apply(m, u);
    }
    o.sprite.putMarker("items", m, "itemedit");
    t.showTooltip(n, t.target, o);
    j.renderFrame();
  },
  showTooltip: function (g, f, c) {
    var d = this.getTooltip(),
      a,
      b;
    if (d && Ext.toolkit !== "modern") {
      a = d.config;
      b = this.getChart();
      Ext.callback(a.renderer, null, [d, c, f, g], 0, b);
      d.pointerEvent = g;
      if (d.isVisible()) {
        d.handleAfterShow();
      } else {
        d.show();
      }
    }
  },
  hideTooltip: function () {
    var a = this.getTooltip();
    if (a && Ext.toolkit !== "modern") {
      a.hide();
    }
  },
  onDragEnd: function (g) {
    var d = this,
      f = d.target,
      c = d.getChart(),
      b = c.getStore(),
      a;
    if (f) {
      a = b.getAt(f.index);
      if (f.yField) {
        a.set(f.yField, f.yValue, { convert: false });
      }
      if (f.xField) {
        a.set(f.xField, f.xValue, { convert: false });
      }
      if (f.yField || f.xField) {
        d.getChart().onDataChanged();
      }
      d.target = null;
    }
    d.hideTooltip();
    if (d.item) {
      c.fireEvent("enditemedit", c, d, d.item, f);
    }
    d.highlight((d.item = null));
  },
  destroy: function () {
    var a = this.getConfig("tooltip", true);
    Ext.destroy(a);
    this.callParent();
  }
});
Ext.define("Ext.chart.interactions.PanZoom", {
  extend: "Ext.chart.interactions.Abstract",
  type: "panzoom",
  alias: "interaction.panzoom",
  requires: ["Ext.draw.Animator"],
  config: {
    axes: { top: {}, right: {}, bottom: {}, left: {} },
    minZoom: null,
    maxZoom: null,
    showOverflowArrows: true,
    panGesture: "drag",
    zoomGesture: "pinch",
    zoomOnPanGesture: null,
    zoomOnPan: false,
    modeToggleButton: {
      xtype: "segmentedbutton",
      width: 200,
      defaults: { ui: "default-toolbar" },
      cls: Ext.baseCSSPrefix + "panzoom-toggle",
      items: [
        { text: "Pan", value: "pan" },
        { text: "Zoom", value: "zoom" }
      ]
    },
    hideLabelInGesture: false
  },
  stopAnimationBeforeSync: true,
  applyAxes: function (b, a) {
    return Ext.merge(a || {}, b);
  },
  updateZoomOnPan: function (b) {
    var a = this.getModeToggleButton();
    a.setValue(b ? "zoom" : "pan");
  },
  updateZoomOnPanGesture: function (a) {
    this.setZoomOnPan(a);
  },
  getZoomOnPanGesture: function () {
    return this.getZoomOnPan();
  },
  applyModeToggleButton: function (c, b) {
    var d = this,
      a = Ext.factory(c, "Ext.button.Segmented", b);
    if (!a && b) {
      b.destroy();
    }
    if (a && !b) {
      a.on("toggle", "onModeToggleChange", d);
    }
    return a;
  },
  onModeToggleChange: function (c, a, b) {
    if (b) {
      this.setZoomOnPan(a.getValue() === "zoom");
    }
  },
  getGestures: function () {
    var b = this,
      d = {},
      c = b.getPanGesture(),
      a = b.getZoomGesture();
    d[a] = "onZoomGestureMove";
    d[a + "start"] = "onZoomGestureStart";
    d[a + "end"] = "onZoomGestureEnd";
    d[c] = "onPanGestureMove";
    d[c + "start"] = "onPanGestureStart";
    d[c + "end"] = "onPanGestureEnd";
    d.doubletap = "onDoubleTap";
    return d;
  },
  onDoubleTap: function (h) {
    var f = this,
      c = f.getChart(),
      g = c.getAxes(),
      b,
      a,
      d;
    for (a = 0, d = g.length; a < d; a++) {
      b = g[a];
      b.setVisibleRange([0, 1]);
    }
    c.redraw();
  },
  onPanGestureStart: function (d) {
    if (!d || !d.touches || d.touches.length < 2) {
      var b = this,
        a = b.getChart().getInnerRect(),
        c = b.getChart().element.getXY();
      d.claimGesture();
      b.startX = d.getX() - c[0] - a[0];
      b.startY = d.getY() - c[1] - a[1];
      b.oldVisibleRanges = null;
      b.hideLabels();
      b.getChart().suspendThicknessChanged();
      b.lockEvents(b.getPanGesture());
      return false;
    }
  },
  onPanGestureMove: function (g) {
    var d = this,
      b = g.pointerType === "mouse",
      a = b && d.getZoomOnPan();
    if (d.getLocks()[d.getPanGesture()] === d) {
      var c = d.getChart().getInnerRect(),
        f = d.getChart().element.getXY();
      if (a) {
        d.transformAxesBy(
          d.getZoomableAxes(g),
          0,
          0,
          (g.getX() - f[0] - c[0]) / d.startX,
          d.startY / (g.getY() - f[1] - c[1])
        );
      } else {
        d.transformAxesBy(
          d.getPannableAxes(g),
          g.getX() - f[0] - c[0] - d.startX,
          g.getY() - f[1] - c[1] - d.startY,
          1,
          1
        );
      }
      d.sync();
      return false;
    }
  },
  onPanGestureEnd: function (b) {
    var a = this,
      c = a.getPanGesture();
    if (a.getLocks()[c] === a) {
      a.getChart().resumeThicknessChanged();
      a.showLabels();
      a.sync();
      a.unlockEvents(c);
      return false;
    }
  },
  onZoomGestureStart: function (b) {
    if (b.touches && b.touches.length === 2) {
      var c = this,
        i = c.getChart().element.getXY(),
        f = c.getChart().getInnerRect(),
        h = i[0] + f[0],
        d = i[1] + f[1],
        j = [
          b.touches[0].point.x - h,
          b.touches[0].point.y - d,
          b.touches[1].point.x - h,
          b.touches[1].point.y - d
        ],
        g = Math.max(44, Math.abs(j[2] - j[0])),
        a = Math.max(44, Math.abs(j[3] - j[1]));
      b.claimGesture();
      c.getChart().suspendThicknessChanged();
      c.lastZoomDistances = [g, a];
      c.lastPoints = j;
      c.oldVisibleRanges = null;
      c.hideLabels();
      c.lockEvents(c.getZoomGesture());
      return false;
    }
  },
  onZoomGestureMove: function (d) {
    var f = this;
    if (f.getLocks()[f.getZoomGesture()] === f) {
      var i = f.getChart().getInnerRect(),
        n = f.getChart().element.getXY(),
        k = n[0] + i[0],
        h = n[1] + i[1],
        o = Math.abs,
        c = f.lastPoints,
        m = [
          d.touches[0].point.x - k,
          d.touches[0].point.y - h,
          d.touches[1].point.x - k,
          d.touches[1].point.y - h
        ],
        g = Math.max(44, o(m[2] - m[0])),
        b = Math.max(44, o(m[3] - m[1])),
        a = this.lastZoomDistances || [g, b],
        l = g / a[0],
        j = b / a[1];
      f.transformAxesBy(
        f.getZoomableAxes(d),
        (i[2] * (l - 1)) / 2 + m[2] - c[2] * l,
        (i[3] * (j - 1)) / 2 + m[3] - c[3] * j,
        l,
        j
      );
      f.sync();
      return false;
    }
  },
  onZoomGestureEnd: function (c) {
    var b = this,
      a = b.getZoomGesture();
    if (b.getLocks()[a] === b) {
      b.getChart().resumeThicknessChanged();
      b.showLabels();
      b.sync();
      b.unlockEvents(a);
      return false;
    }
  },
  hideLabels: function () {
    if (this.getHideLabelInGesture()) {
      this.eachInteractiveAxes(function (a) {
        a.hideLabels();
      });
    }
  },
  showLabels: function () {
    if (this.getHideLabelInGesture()) {
      this.eachInteractiveAxes(function (a) {
        a.showLabels();
      });
    }
  },
  isEventOnAxis: function (c, a) {
    var b = a.getSurface().getRect();
    return (
      b[0] <= c.getX() &&
      c.getX() <= b[0] + b[2] &&
      b[1] <= c.getY() &&
      c.getY() <= b[1] + b[3]
    );
  },
  getPannableAxes: function (d) {
    var h = this,
      a = h.getAxes(),
      f = h.getChart().getAxes(),
      c,
      g = f.length,
      k = [],
      j = false,
      b;
    if (d) {
      for (c = 0; c < g; c++) {
        if (this.isEventOnAxis(d, f[c])) {
          j = true;
          break;
        }
      }
    }
    for (c = 0; c < g; c++) {
      b = a[f[c].getPosition()];
      if (b && b.allowPan !== false && (!j || this.isEventOnAxis(d, f[c]))) {
        k.push(f[c]);
      }
    }
    return k;
  },
  getZoomableAxes: function (f) {
    var j = this,
      a = j.getAxes(),
      g = j.getChart().getAxes(),
      l = [],
      d,
      h = g.length,
      c,
      k = false,
      b;
    if (f) {
      for (d = 0; d < h; d++) {
        if (this.isEventOnAxis(f, g[d])) {
          k = true;
          break;
        }
      }
    }
    for (d = 0; d < h; d++) {
      c = g[d];
      b = a[c.getPosition()];
      if (b && b.allowZoom !== false && (!k || this.isEventOnAxis(f, c))) {
        l.push(c);
      }
    }
    return l;
  },
  eachInteractiveAxes: function (c) {
    var d = this,
      b = d.getAxes(),
      e = d.getChart().getAxes();
    for (var a = 0; a < e.length; a++) {
      if (b[e[a].getPosition()]) {
        if (false === c.call(this, e[a])) {
          return;
        }
      }
    }
  },
  transformAxesBy: function (d, j, g, h, e) {
    var f = this.getChart().getInnerRect(),
      a = this.getAxes(),
      k,
      b = this.oldVisibleRanges,
      l = false;
    if (!b) {
      this.oldVisibleRanges = b = {};
      this.eachInteractiveAxes(function (i) {
        b[i.getId()] = i.getVisibleRange();
      });
    }
    if (!f) {
      return;
    }
    for (var c = 0; c < d.length; c++) {
      k = a[d[c].getPosition()];
      l =
        this.transformAxisBy(
          d[c],
          b[d[c].getId()],
          j,
          g,
          h,
          e,
          this.minZoom || k.minZoom,
          this.maxZoom || k.maxZoom
        ) || l;
    }
    return l;
  },
  transformAxisBy: function (c, o, r, q, k, i, h, m) {
    var s = this,
      b = o[1] - o[0],
      l = c.getVisibleRange(),
      g = h || s.getMinZoom() || c.config.minZoom,
      j = m || s.getMaxZoom() || c.config.maxZoom,
      a = s.getChart().getInnerRect(),
      f,
      p;
    if (!a) {
      return;
    }
    var d = c.isSide(),
      e = d ? a[3] : a[2],
      n = d ? -q : r;
    b /= d ? i : k;
    if (b < 0) {
      b = -b;
    }
    if (b * g > 1) {
      b = 1;
    }
    if (b * j < 1) {
      b = 1 / j;
    }
    f = o[0];
    p = o[1];
    l = l[1] - l[0];
    if (b === l && l === 1) {
      return;
    }
    c.setVisibleRange([
      (o[0] + o[1] - b) * 0.5 - (n / e) * b,
      (o[0] + o[1] + b) * 0.5 - (n / e) * b
    ]);
    return (
      Math.abs(f - c.getVisibleRange()[0]) > 1e-10 ||
      Math.abs(p - c.getVisibleRange()[1]) > 1e-10
    );
  },
  destroy: function () {
    this.setModeToggleButton(null);
    this.callParent();
  }
});
Ext.define("Ext.chart.interactions.Rotate", {
  extend: "Ext.chart.interactions.Abstract",
  type: "rotate",
  alias: "interaction.rotate",
  config: {
    gesture: "rotate",
    gestures: {
      rotate: "onRotate",
      rotateend: "onRotate",
      dragstart: "onGestureStart",
      drag: "onGesture",
      dragend: "onGestureEnd"
    },
    rotation: 0
  },
  oldRotations: null,
  getAngle: function (f) {
    var c = this,
      b = c.getChart(),
      d = b.getEventXY(f),
      a = b.getCenter();
    return Math.atan2(d[1] - a[1], d[0] - a[0]);
  },
  getRadius: function (a) {
    return this.getChart().getRadius();
  },
  getEventRadius: function (h) {
    var f = this,
      d = f.getChart(),
      g = d.getEventXY(h),
      a = d.getCenter(),
      c = g[0] - a[0],
      b = g[1] - a[1];
    return Math.sqrt(c * c + b * b);
  },
  onGestureStart: function (d) {
    var c = this,
      b = c.getRadius(d),
      a = c.getEventRadius(d);
    d.claimGesture();
    if (b >= a) {
      c.lockEvents("drag");
      c.angle = c.getAngle(d);
      c.oldRotations = {};
      return false;
    }
  },
  onGesture: function (b) {
    var a = this,
      c = a.getAngle(b) - a.angle;
    if (a.getLocks().drag === a) {
      a.doRotateTo(c, true);
      return false;
    }
  },
  doRotateTo: function (d, a, b) {
    var n = this,
      l = n.getChart(),
      k = l.getAxes(),
      f = l.getSeries(),
      m = n.oldRotations,
      c,
      j,
      g,
      e,
      h;
    if (!b) {
      l.suspendAnimation();
    }
    for (e = 0, h = k.length; e < h; e++) {
      c = k[e];
      g = m[c.getId()] || (m[c.getId()] = c.getRotation());
      c.setRotation(d + (a ? g : 0));
    }
    for (e = 0, h = f.length; e < h; e++) {
      j = f[e];
      g = m[j.getId()] || (m[j.getId()] = j.getRotation());
      j.setRotation(d + (a ? g : 0));
    }
    n.setRotation(d + (a ? g : 0));
    n.fireEvent("rotate", n, n.getRotation());
    n.sync();
    if (!b) {
      l.resumeAnimation();
    }
  },
  rotateTo: function (c, b, a) {
    this.doRotateTo(c, b, a);
    this.oldRotations = {};
  },
  onGestureEnd: function (b) {
    var a = this;
    if (a.getLocks().drag === a) {
      a.onGesture(b);
      a.unlockEvents("drag");
      a.fireEvent("rotationEnd", a, a.getRotation());
      return false;
    }
  },
  onRotate: function (a) {}
});
Ext.define("Ext.chart.interactions.RotatePie3D", {
  extend: "Ext.chart.interactions.Rotate",
  type: "rotatePie3d",
  alias: "interaction.rotatePie3d",
  getAngle: function (g) {
    var a = this.getChart(),
      f = a.getInherited().rtl,
      d = f ? -1 : 1,
      h = g.getXY(),
      c = a.element.getXY(),
      b = a.getMainRect();
    return d * Math.atan2(h[1] - c[1] - b[3] * 0.5, h[0] - c[0] - b[2] * 0.5);
  },
  getRadius: function (j) {
    var f = this.getChart(),
      a = f.getRadius(),
      d = f.getSeries(),
      h = d.length,
      c = 0,
      b,
      g;
    for (; c < h; c++) {
      b = d[c];
      if (b.is3D) {
        g = b.getRadius();
        if (g > a) {
          a = g;
        }
      }
    }
    return a;
  }
});
Ext.define("Ext.chart.plugin.ItemEvents", {
  extend: "Ext.plugin.Abstract",
  alias: "plugin.chartitemevents",
  moveEvents: false,
  mouseMoveEvents: { mousemove: true, mouseover: true, mouseout: true },
  itemMouseMoveEvents: {
    itemmousemove: true,
    itemmouseover: true,
    itemmouseout: true
  },
  init: function (b) {
    var a = "handleEvent";
    this.chart = b;
    b.addElementListener({
      click: a,
      dblclick: a,
      mousedown: a,
      mousemove: a,
      mouseup: a,
      mouseover: a,
      mouseout: a,
      priority: 1001,
      scope: this
    });
  },
  hasItemMouseMoveListeners: function () {
    var b = this.chart.hasListeners,
      a;
    for (a in this.itemMouseMoveEvents) {
      if (a in b) {
        return true;
      }
    }
    return false;
  },
  handleEvent: function (g) {
    var d = this,
      a = d.chart,
      h = g.type in d.mouseMoveEvents,
      c = d.lastItem,
      f,
      b;
    if (h && !d.hasItemMouseMoveListeners() && !d.moveEvents) {
      return;
    }
    f = a.getEventXY(g);
    b = a.getItemForPoint(f[0], f[1]);
    if (h && !Ext.Object.equals(b, c)) {
      if (c) {
        a.fireEvent("itemmouseout", a, c, g);
        c.series.fireEvent("itemmouseout", c.series, c, g);
      }
      if (b) {
        a.fireEvent("itemmouseover", a, b, g);
        b.series.fireEvent("itemmouseover", b.series, b, g);
      }
    }
    if (b) {
      a.fireEvent("item" + g.type, a, b, g);
      b.series.fireEvent("item" + g.type, b.series, b, g);
    }
    d.lastItem = b;
  }
});
Ext.define("Ext.chart.series.Cartesian", {
  extend: "Ext.chart.series.Series",
  config: { xField: null, yField: null, xAxis: null, yAxis: null },
  directions: ["X", "Y"],
  fieldCategoryX: ["X"],
  fieldCategoryY: ["Y"],
  applyXAxis: function (a, b) {
    return this.getChart().getAxis(a) || b;
  },
  applyYAxis: function (a, b) {
    return this.getChart().getAxis(a) || b;
  },
  updateXAxis: function (a) {
    a.processData(this);
  },
  updateYAxis: function (a) {
    a.processData(this);
  },
  coordinateX: function () {
    return this.coordinate("X", 0, 2);
  },
  coordinateY: function () {
    return this.coordinate("Y", 1, 2);
  },
  getItemForPoint: function (a, g) {
    if (this.getSprites()) {
      var f = this,
        d = f.getSprites()[0],
        b = f.getStore(),
        e,
        c;
      if (f.getHidden()) {
        return null;
      }
      if (d) {
        c = d.getIndexNearPoint(a, g);
        if (c !== -1) {
          e = {
            series: f,
            category: f.getItemInstancing() ? "items" : "markers",
            index: c,
            record: b.getData().items[c],
            field: f.getYField(),
            sprite: d
          };
          return e;
        }
      }
    }
  },
  createSprite: function () {
    var c = this,
      a = c.callParent(),
      b = c.getChart(),
      d = c.getXAxis();
    a.setAttributes({ flipXY: b.getFlipXY(), xAxis: d });
    if (a.setAggregator && d && d.getAggregator) {
      if (d.getAggregator) {
        a.setAggregator({ strategy: d.getAggregator() });
      } else {
        a.setAggregator({});
      }
    }
    return a;
  },
  getSprites: function () {
    var d = this,
      c = this.getChart(),
      e = d.getAnimation() || (c && c.getAnimation()),
      b = d.getItemInstancing(),
      f = d.sprites,
      a;
    if (!c) {
      return [];
    }
    if (!f.length) {
      a = d.createSprite();
    } else {
      a = f[0];
    }
    if (e) {
      if (b) {
        a.itemsMarker.getTemplate().setAnimation(e);
      }
      a.setAnimation(e);
    }
    return f;
  },
  provideLegendInfo: function (d) {
    var b = this,
      a = b.getSubStyleWithTheme(),
      c = a.fillStyle;
    if (Ext.isArray(c)) {
      c = c[0];
    }
    d.push({
      name: b.getTitle() || b.getYField() || b.getId(),
      mark:
        (Ext.isObject(c) ? c.stops && c.stops[0].color : c) ||
        a.strokeStyle ||
        "black",
      disabled: b.getHidden(),
      series: b.getId(),
      index: 0
    });
  },
  getXRange: function () {
    return [this.dataRange[0], this.dataRange[2]];
  },
  getYRange: function () {
    return [this.dataRange[1], this.dataRange[3]];
  }
});
Ext.define("Ext.chart.series.StackedCartesian", {
  extend: "Ext.chart.series.Cartesian",
  config: {
    stacked: true,
    splitStacks: true,
    fullStack: false,
    fullStackTotal: 100,
    hidden: []
  },
  spriteAnimationCount: 0,
  themeColorCount: function () {
    var b = this,
      a = b.getYField();
    return Ext.isArray(a) ? a.length : 1;
  },
  updateStacked: function () {
    this.processData();
  },
  updateSplitStacks: function () {
    this.processData();
  },
  coordinateY: function () {
    return this.coordinateStacked("Y", 1, 2);
  },
  coordinateStacked: function (D, e, m) {
    var F = this,
      f = F.getStore(),
      r = f.getData().items,
      B = r.length,
      c = F["get" + D + "Axis"](),
      x = F.getHidden(),
      a = F.getSplitStacks(),
      z = F.getFullStack(),
      l = F.getFullStackTotal(),
      p = { min: 0, max: 0 },
      n = F["fieldCategory" + D],
      C = [],
      o = [],
      E = [],
      h,
      A = F.getStacked(),
      g = F.getSprites(),
      q = [],
      w,
      v,
      u,
      s,
      H,
      y,
      b,
      d,
      G,
      t;
    if (!g.length) {
      return;
    }
    for (w = 0; w < n.length; w++) {
      d = n[w];
      s = F.getFields([d]);
      H = s.length;
      for (v = 0; v < B; v++) {
        C[v] = 0;
        o[v] = 0;
        E[v] = 0;
      }
      for (v = 0; v < H; v++) {
        if (!x[v]) {
          q[v] = F.coordinateData(r, s[v], c);
        }
      }
      if (A && z) {
        y = [];
        if (a) {
          b = [];
        }
        for (v = 0; v < B; v++) {
          y[v] = 0;
          if (a) {
            b[v] = 0;
          }
          for (u = 0; u < H; u++) {
            G = q[u];
            if (!G) {
              continue;
            }
            G = G[v];
            if (G >= 0 || !a) {
              y[v] += G;
            } else {
              if (G < 0) {
                b[v] += G;
              }
            }
          }
        }
      }
      for (v = 0; v < H; v++) {
        t = {};
        if (x[v]) {
          t["dataStart" + d] = C;
          t["data" + d] = C;
          g[v].setAttributes(t);
          continue;
        }
        G = q[v];
        if (A) {
          h = [];
          for (u = 0; u < B; u++) {
            if (!G[u]) {
              G[u] = 0;
            }
            if (G[u] >= 0 || !a) {
              if (z && y[u]) {
                G[u] *= l / y[u];
              }
              C[u] = o[u];
              o[u] += G[u];
              h[u] = o[u];
            } else {
              if (z && b[u]) {
                G[u] *= l / b[u];
              }
              C[u] = E[u];
              E[u] += G[u];
              h[u] = E[u];
            }
          }
          t["dataStart" + d] = C;
          t["data" + d] = h;
          F.getRangeOfData(C, p);
          F.getRangeOfData(h, p);
        } else {
          t["dataStart" + d] = C;
          t["data" + d] = G;
          F.getRangeOfData(G, p);
        }
        g[v].setAttributes(t);
      }
    }
    F.dataRange[e] = p.min;
    F.dataRange[e + m] = p.max;
    t = {};
    t["dataMin" + D] = p.min;
    t["dataMax" + D] = p.max;
    for (w = 0; w < g.length; w++) {
      g[w].setAttributes(t);
    }
  },
  getFields: function (f) {
    var e = this,
      a = [],
      c,
      b,
      d;
    for (b = 0, d = f.length; b < d; b++) {
      c = e["get" + f[b] + "Field"]();
      if (Ext.isArray(c)) {
        a.push.apply(a, c);
      } else {
        a.push(c);
      }
    }
    return a;
  },
  updateLabelOverflowPadding: function (a) {
    this.getLabel().setAttributes({ labelOverflowPadding: a });
  },
  getSprites: function () {
    var k = this,
      j = k.getChart(),
      c = k.getAnimation() || (j && j.getAnimation()),
      f = k.getFields(k.fieldCategoryY),
      b = k.getItemInstancing(),
      h = k.sprites,
      l,
      e = k.getHidden(),
      g = false,
      d,
      a = f.length;
    if (!j) {
      return [];
    }
    for (d = 0; d < a; d++) {
      l = h[d];
      if (!l) {
        l = k.createSprite();
        l.setAttributes({ zIndex: -d });
        l.setField(f[d]);
        g = true;
        e.push(false);
        if (b) {
          l.itemsMarker.getTemplate().setAttributes(k.getStyleByIndex(d));
        } else {
          l.setAttributes(k.getStyleByIndex(d));
        }
      }
      if (c) {
        if (b) {
          l.itemsMarker.getTemplate().setAnimation(c);
        }
        l.setAnimation(c);
      }
    }
    if (g) {
      k.updateHidden(e);
    }
    return h;
  },
  getItemForPoint: function (k, j) {
    if (this.getSprites()) {
      var h = this,
        b,
        g,
        m,
        a = h.getItemInstancing(),
        f = h.getSprites(),
        l = h.getStore(),
        c = h.getHidden(),
        n,
        d,
        e;
      for (b = 0, g = f.length; b < g; b++) {
        if (!c[b]) {
          m = f[b];
          d = m.getIndexNearPoint(k, j);
          if (d !== -1) {
            e = h.getYField();
            n = {
              series: h,
              index: d,
              category: a ? "items" : "markers",
              record: l.getData().items[d],
              field: typeof e === "string" ? e : e[b],
              sprite: m
            };
            return n;
          }
        }
      }
      return null;
    }
  },
  provideLegendInfo: function (e) {
    var g = this,
      f = g.getSprites(),
      h = g.getTitle(),
      j = g.getYField(),
      d = g.getHidden(),
      k = f.length === 1,
      b,
      l,
      c,
      a;
    for (c = 0; c < f.length; c++) {
      b = g.getStyleByIndex(c);
      l = b.fillStyle;
      if (h) {
        if (Ext.isArray(h)) {
          a = h[c];
        } else {
          if (k) {
            a = h;
          }
        }
      }
      if (!h || !a) {
        if (Ext.isArray(j)) {
          a = j[c];
        } else {
          a = g.getId();
        }
      }
      e.push({
        name: a,
        mark:
          (Ext.isObject(l) ? l.stops && l.stops[0].color : l) ||
          b.strokeStyle ||
          "black",
        disabled: d[c],
        series: g.getId(),
        index: c
      });
    }
  },
  onSpriteAnimationStart: function (a) {
    this.spriteAnimationCount++;
    if (this.spriteAnimationCount === 1) {
      this.fireEvent("animationstart");
    }
  },
  onSpriteAnimationEnd: function (a) {
    this.spriteAnimationCount--;
    if (this.spriteAnimationCount === 0) {
      this.fireEvent("animationend");
    }
  }
});
Ext.define("Ext.chart.series.sprite.Series", {
  extend: "Ext.draw.sprite.Sprite",
  mixins: { markerHolder: "Ext.chart.MarkerHolder" },
  inheritableStatics: {
    def: {
      processors: {
        dataMinX: "number",
        dataMaxX: "number",
        dataMinY: "number",
        dataMaxY: "number",
        rangeX: "data",
        rangeY: "data",
        dataX: "data",
        dataY: "data"
      },
      defaults: {
        dataMinX: 0,
        dataMaxX: 1,
        dataMinY: 0,
        dataMaxY: 1,
        rangeX: null,
        rangeY: null,
        dataX: null,
        dataY: null
      },
      triggers: {
        dataX: "bbox",
        dataY: "bbox",
        dataMinX: "bbox",
        dataMaxX: "bbox",
        dataMinY: "bbox",
        dataMaxY: "bbox"
      }
    }
  },
  config: { store: null, series: null, field: null }
});
Ext.define("Ext.chart.series.sprite.Cartesian", {
  extend: "Ext.chart.series.sprite.Series",
  inheritableStatics: {
    def: {
      processors: {
        labels: "default",
        labelOverflowPadding: "number",
        selectionTolerance: "number",
        flipXY: "bool",
        renderer: "default",
        visibleMinX: "number",
        visibleMinY: "number",
        visibleMaxX: "number",
        visibleMaxY: "number",
        innerWidth: "number",
        innerHeight: "number"
      },
      defaults: {
        labels: null,
        labelOverflowPadding: 10,
        selectionTolerance: 20,
        flipXY: false,
        renderer: null,
        transformFillStroke: false,
        visibleMinX: 0,
        visibleMinY: 0,
        visibleMaxX: 1,
        visibleMaxY: 1,
        innerWidth: 1,
        innerHeight: 1
      },
      triggers: {
        dataX: "dataX,bbox",
        dataY: "dataY,bbox",
        visibleMinX: "panzoom",
        visibleMinY: "panzoom",
        visibleMaxX: "panzoom",
        visibleMaxY: "panzoom",
        innerWidth: "panzoom",
        innerHeight: "panzoom"
      },
      updaters: {
        dataX: function (a) {
          this.processDataX();
          this.scheduleUpdater(a, "dataY", ["dataY"]);
        },
        dataY: function () {
          this.processDataY();
        },
        panzoom: function (c) {
          var e = c.visibleMaxX - c.visibleMinX,
            d = c.visibleMaxY - c.visibleMinY,
            b = c.flipXY ? c.innerHeight : c.innerWidth,
            g = !c.flipXY ? c.innerHeight : c.innerWidth,
            a = this.getSurface(),
            f = a ? a.getInherited().rtl : false;
          if (f && !c.flipXY) {
            c.translationX = b + (c.visibleMinX * b) / e;
          } else {
            c.translationX = (-c.visibleMinX * b) / e;
          }
          c.translationY = (-c.visibleMinY * g) / d;
          c.scalingX = ((f && !c.flipXY ? -1 : 1) * b) / e;
          c.scalingY = g / d;
          c.scalingCenterX = 0;
          c.scalingCenterY = 0;
          this.applyTransformations(true);
        }
      }
    }
  },
  processDataY: Ext.emptyFn,
  processDataX: Ext.emptyFn,
  updatePlainBBox: function (b) {
    var a = this.attr;
    b.x = a.dataMinX;
    b.y = a.dataMinY;
    b.width = a.dataMaxX - a.dataMinX;
    b.height = a.dataMaxY - a.dataMinY;
  },
  binarySearch: function (d) {
    var b = this.attr.dataX,
      f = 0,
      a = b.length;
    if (d <= b[0]) {
      return f;
    }
    if (d >= b[a - 1]) {
      return a - 1;
    }
    while (f + 1 < a) {
      var c = (f + a) >> 1,
        e = b[c];
      if (e === d) {
        return c;
      } else {
        if (e < d) {
          f = c;
        } else {
          a = c;
        }
      }
    }
    return f;
  },
  render: function (b, c, g) {
    var f = this,
      a = f.attr,
      e = a.inverseMatrix.clone();
    e.appendMatrix(b.inverseMatrix);
    if (a.dataX === null || a.dataX === undefined) {
      return;
    }
    if (a.dataY === null || a.dataY === undefined) {
      return;
    }
    if (e.getXX() * e.getYX() || e.getXY() * e.getYY()) {
      console.log("Cartesian Series sprite does not support rotation/sheering");
      return;
    }
    var d = e.transformList([
      [g[0] - 1, g[3] + 1],
      [g[0] + g[2] + 1, -1]
    ]);
    d = d[0].concat(d[1]);
    f.renderClipped(b, c, d, g);
  },
  renderClipped: Ext.emptyFn,
  getIndexNearPoint: function (f, e) {
    var w = this,
      q = w.attr.matrix,
      h = w.attr.dataX,
      g = w.attr.dataY,
      k = w.attr.selectionTolerance,
      t,
      r,
      c = -1,
      j = q.clone().prependMatrix(w.surfaceMatrix).inverse(),
      u = j.transformPoint([f, e]),
      b = j.transformPoint([f - k, e - k]),
      n = j.transformPoint([f + k, e + k]),
      a = Math.min(b[0], n[0]),
      s = Math.max(b[0], n[0]),
      l = Math.min(b[1], n[1]),
      d = Math.max(b[1], n[1]),
      m,
      v,
      o,
      p;
    for (o = 0, p = h.length; o < p; o++) {
      m = h[o];
      v = g[o];
      if (m > a && m < s && v > l && v < d) {
        if (c === -1 || (Math.abs(m - u[0]) < t && Math.abs(v - u[1]) < r)) {
          t = Math.abs(m - u[0]);
          r = Math.abs(v - u[1]);
          c = o;
        }
      }
    }
    return c;
  }
});
Ext.define("Ext.chart.series.sprite.StackedCartesian", {
  extend: "Ext.chart.series.sprite.Cartesian",
  inheritableStatics: {
    def: {
      processors: {
        groupCount: "number",
        groupOffset: "number",
        dataStartY: "data"
      },
      defaults: {
        selectionTolerance: 20,
        groupCount: 1,
        groupOffset: 0,
        dataStartY: null
      },
      triggers: { dataStartY: "dataY,bbox" }
    }
  },
  getIndexNearPoint: function (e, d) {
    var o = this,
      q = o.attr.matrix,
      h = o.attr.dataX,
      f = o.attr.dataY,
      u = o.attr.dataStartY,
      l = o.attr.selectionTolerance,
      s = 0.5,
      r = Infinity,
      b = -1,
      k = q.clone().prependMatrix(this.surfaceMatrix).inverse(),
      t = k.transformPoint([e, d]),
      a = k.transformPoint([e - l, d - l]),
      n = k.transformPoint([e + l, d + l]),
      m = Math.min(a[1], n[1]),
      c = Math.max(a[1], n[1]),
      j,
      g;
    for (var p = 0; p < h.length; p++) {
      if (Math.min(u[p], f[p]) <= c && m <= Math.max(u[p], f[p])) {
        j = Math.abs(h[p] - t[0]);
        g = Math.max(-Math.min(f[p] - t[1], t[1] - u[p]), 0);
        if (j < s && g <= r) {
          s = j;
          r = g;
          b = p;
        }
      }
    }
    return b;
  }
});
Ext.define("Ext.chart.series.sprite.Area", {
  alias: "sprite.areaSeries",
  extend: "Ext.chart.series.sprite.StackedCartesian",
  inheritableStatics: {
    def: { processors: { step: "bool" }, defaults: { step: false } }
  },
  renderClipped: function (w, A, G) {
    var H = this,
      g = H.getStore(),
      o = H.getSeries(),
      v = H.attr,
      q = v.dataX,
      n = v.dataY,
      I = v.dataStartY,
      B = v.matrix,
      m,
      l,
      D,
      j,
      h,
      F,
      E,
      f = B.elements[0],
      r = B.elements[4],
      t = B.elements[3],
      p = B.elements[5],
      e = H.surfaceMatrix,
      s = {},
      z = Math.min(G[0], G[2]),
      C = Math.max(G[0], G[2]),
      c = Math.max(0, this.binarySearch(z)),
      b = Math.min(q.length - 1, this.binarySearch(C) + 1),
      u = v.renderer,
      a = { store: g },
      k,
      d;
    A.beginPath();
    F = q[c] * f + r;
    E = n[c] * t + p;
    A.moveTo(F, E);
    if (v.step) {
      h = E;
      for (D = c; D <= b; D++) {
        m = q[D] * f + r;
        l = n[D] * t + p;
        A.lineTo(m, h);
        A.lineTo(m, (h = l));
      }
    } else {
      for (D = c; D <= b; D++) {
        m = q[D] * f + r;
        l = n[D] * t + p;
        A.lineTo(m, l);
      }
    }
    if (I) {
      if (v.step) {
        j = q[b] * f + r;
        for (D = b; D >= c; D--) {
          m = q[D] * f + r;
          l = I[D] * t + p;
          A.lineTo(j, l);
          A.lineTo((j = m), l);
        }
      } else {
        for (D = b; D >= c; D--) {
          m = q[D] * f + r;
          l = I[D] * t + p;
          A.lineTo(m, l);
        }
      }
    } else {
      A.lineTo(q[b] * f + r, l);
      A.lineTo(q[b] * f + r, p);
      A.lineTo(F, p);
      A.lineTo(F, n[D] * t + p);
    }
    if (v.transformFillStroke) {
      v.matrix.toContext(A);
    }
    A.fill();
    if (v.transformFillStroke) {
      v.inverseMatrix.toContext(A);
    }
    A.beginPath();
    A.moveTo(F, E);
    if (v.step) {
      for (D = c; D <= b; D++) {
        m = q[D] * f + r;
        l = n[D] * t + p;
        A.lineTo(m, h);
        A.lineTo(m, (h = l));
        s.translationX = e.x(m, l);
        s.translationY = e.y(m, l);
        if (u) {
          d = Ext.callback(u, null, [H, s, a, D], 0, o);
          Ext.apply(s, d);
        }
        H.putMarker("markers", s, D, !u);
      }
    } else {
      for (D = c; D <= b; D++) {
        m = q[D] * f + r;
        l = n[D] * t + p;
        A.lineTo(m, l);
        s.translationX = e.x(m, l);
        s.translationY = e.y(m, l);
        if (u) {
          d = Ext.callback(u, null, [H, s, a, D], 0, o);
          Ext.apply(s, d);
        }
        H.putMarker("markers", s, D, !u);
      }
    }
    if (v.transformFillStroke) {
      v.matrix.toContext(A);
    }
    A.stroke();
  }
});
Ext.define("Ext.chart.series.Area", {
  extend: "Ext.chart.series.StackedCartesian",
  alias: "series.area",
  type: "area",
  seriesType: "areaSeries",
  requires: ["Ext.chart.series.sprite.Area"],
  config: { splitStacks: false }
});
Ext.define("Ext.chart.series.sprite.Bar", {
  alias: "sprite.barSeries",
  extend: "Ext.chart.series.sprite.StackedCartesian",
  inheritableStatics: {
    def: {
      processors: {
        minBarWidth: "number",
        maxBarWidth: "number",
        minGapWidth: "number",
        radius: "number",
        inGroupGapWidth: "number"
      },
      defaults: {
        minBarWidth: 2,
        maxBarWidth: 100,
        minGapWidth: 5,
        inGroupGapWidth: 3,
        radius: 0
      }
    }
  },
  drawLabel: function (k, i, v, h, r) {
    var t = this,
      q = t.attr,
      f = t.getMarker("labels"),
      e = f.getTemplate(),
      l = t.labelCfg || (t.labelCfg = {}),
      d = t.surfaceMatrix,
      j = q.labelOverflowPadding,
      c = e.attr.display,
      o = e.attr.orientation,
      n =
        (o === "horizontal" && q.flipXY) ||
        (o === "vertical" && !q.flipXY) ||
        !o,
      b = e.getCalloutLine(),
      g,
      m,
      a,
      p,
      u,
      w,
      s;
    l.x = d.x(i, h);
    l.y = d.y(i, h);
    if (b) {
      p = b.length;
    } else {
      p = 0;
    }
    if (!q.flipXY) {
      l.rotationRads = -Math.PI * 0.5;
    } else {
      l.rotationRads = 0;
    }
    l.calloutVertical = !q.flipXY;
    switch (o) {
      case "horizontal":
        l.rotationRads = 0;
        l.calloutVertical = false;
        break;
      case "vertical":
        l.rotationRads = -Math.PI * 0.5;
        l.calloutVertical = true;
        break;
    }
    l.text = k;
    if (e.attr.renderer) {
      s = [k, f, l, { store: t.getStore() }, r];
      u = Ext.callback(e.attr.renderer, null, s, 0, t.getSeries());
      if (typeof u === "string") {
        l.text = u;
      } else {
        if (typeof u === "object") {
          if ("text" in u) {
            l.text = u.text;
          }
          w = true;
        }
      }
    }
    a = t.getMarkerBBox("labels", r, true);
    if (!a) {
      t.putMarker("labels", l, r);
      a = t.getMarkerBBox("labels", r, true);
    }
    if (p > 0) {
      m = p;
    } else {
      if (p === 0) {
        m = (n ? a.width : a.height) / 2;
      } else {
        m = (n ? a.width : a.height) / 2 + j;
      }
    }
    if (v > h) {
      m = -m;
    }
    if (n) {
      g = c === "insideStart" ? v + m : h - m;
    } else {
      g = c === "insideStart" ? v + j * 2 : h - j * 2;
    }
    l.x = d.x(i, g);
    l.y = d.y(i, g);
    g = c === "insideStart" ? v : h;
    l.calloutStartX = d.x(i, g);
    l.calloutStartY = d.y(i, g);
    g = c === "insideStart" ? v - m : h + m;
    l.calloutPlaceX = d.x(i, g);
    l.calloutPlaceY = d.y(i, g);
    l.calloutColor = (b && b.color) || t.attr.fillStyle;
    if (b) {
      if (b.width) {
        l.calloutWidth = b.width;
      }
    } else {
      l.calloutColor = "none";
    }
    if (v > h) {
      m = -m;
    }
    if (Math.abs(h - v) <= m * 2 || c === "outside") {
      l.callout = 1;
    } else {
      l.callout = 0;
    }
    if (w) {
      Ext.apply(l, u);
    }
    t.putMarker("labels", l, r);
  },
  drawBar: function (l, b, h, c, g, k, a, d) {
    var f = this,
      j = {},
      e = f.attr.renderer,
      i;
    j.x = c;
    j.y = g;
    j.width = k - c;
    j.height = a - g;
    j.radius = f.attr.radius;
    if (e) {
      i = Ext.callback(
        e,
        null,
        [f, j, { store: f.getStore() }, d],
        0,
        f.getSeries()
      );
      Ext.apply(j, i);
    }
    f.putMarker("items", j, d, !e);
  },
  renderClipped: function (F, u, C) {
    if (this.cleanRedraw) {
      return;
    }
    var q = this,
      o = q.attr,
      w = o.dataX,
      v = o.dataY,
      G = o.labels,
      n = o.dataStartY,
      m = o.groupCount,
      E = o.groupOffset - (m - 1) * 0.5,
      z = o.inGroupGapWidth,
      t = u.lineWidth,
      D = o.matrix,
      B = D.elements[0],
      j = D.elements[3],
      e = D.elements[4],
      d = F.roundPixel(D.elements[5]) - 1,
      I = (B < 0 ? -1 : 1) * B - o.minGapWidth,
      k = (Math.min(I, o.maxBarWidth) - z * (m - 1)) / m,
      A = F.roundPixel(Math.max(o.minBarWidth, k)),
      c = q.surfaceMatrix,
      g,
      H,
      b,
      h,
      J,
      a,
      l = 0.5 * o.lineWidth,
      K = Math.min(C[0], C[2]),
      x = Math.max(C[0], C[2]),
      y = Math.max(0, Math.floor(K)),
      p = Math.min(w.length - 1, Math.ceil(x)),
      f = G && q.getMarker("labels"),
      s,
      r;
    for (J = y; J <= p; J++) {
      s = n ? n[J] : 0;
      r = v[J];
      a = w[J] * B + e + E * (A + z);
      g = F.roundPixel(a - A / 2) + l;
      h = F.roundPixel(r * j + d + t);
      H = F.roundPixel(a + A / 2) - l;
      b = F.roundPixel(s * j + d + t);
      q.drawBar(u, F, C, g, h - l, H, b - l, J);
      if (f && G[J] != null) {
        q.drawLabel(G[J], a, b, h, J);
      }
      q.putMarker(
        "markers",
        { translationX: c.x(a, h), translationY: c.y(a, h) },
        J,
        true
      );
    }
  },
  getIndexNearPoint: function (l, k) {
    var m = this,
      g = m.attr,
      h = g.dataX,
      a = m.getSurface(),
      b = a.getRect() || [0, 0, 0, 0],
      j = b[3],
      e,
      d,
      c,
      n,
      f = -1;
    if (g.flipXY) {
      e = j - k;
      if (a.getInherited().rtl) {
        d = b[2] - l;
      } else {
        d = l;
      }
    } else {
      e = l;
      d = j - k;
    }
    for (c = 0; c < h.length; c++) {
      n = m.getMarkerBBox("items", c);
      if (Ext.draw.Draw.isPointInBBox(e, d, n)) {
        f = c;
        break;
      }
    }
    return f;
  }
});
Ext.define("Ext.chart.series.Bar", {
  extend: "Ext.chart.series.StackedCartesian",
  alias: "series.bar",
  type: "bar",
  seriesType: "barSeries",
  isBar: true,
  requires: ["Ext.chart.series.sprite.Bar", "Ext.draw.sprite.Rect"],
  config: {
    itemInstancing: {
      type: "rect",
      fx: { customDurations: { x: 0, y: 0, width: 0, height: 0, radius: 0 } }
    }
  },
  getItemForPoint: function (a, f) {
    if (this.getSprites()) {
      var d = this,
        c = d.getChart(),
        e = c.getInnerPadding(),
        b = c.getInherited().rtl;
      arguments[0] = a + (b ? e.right : -e.left);
      arguments[1] = f + e.bottom;
      return d.callParent(arguments);
    }
  },
  updateXAxis: function (a) {
    a.setLabelInSpan(true);
    this.callParent(arguments);
  },
  updateHidden: function (a) {
    this.callParent(arguments);
    this.updateStacked();
  },
  updateStacked: function (c) {
    var e = this,
      g = e.getSprites(),
      d = g.length,
      f = [],
      a = {},
      b;
    for (b = 0; b < d; b++) {
      if (!g[b].attr.hidden) {
        f.push(g[b]);
      }
    }
    d = f.length;
    if (e.getStacked()) {
      a.groupCount = 1;
      a.groupOffset = 0;
      for (b = 0; b < d; b++) {
        f[b].setAttributes(a);
      }
    } else {
      a.groupCount = f.length;
      for (b = 0; b < d; b++) {
        a.groupOffset = b;
        f[b].setAttributes(a);
      }
    }
    e.callParent(arguments);
  }
});
Ext.define("Ext.chart.series.sprite.Bar3D", {
  extend: "Ext.chart.series.sprite.Bar",
  alias: "sprite.bar3dSeries",
  requires: ["Ext.draw.gradient.Linear"],
  inheritableStatics: {
    def: {
      processors: {
        depthWidthRatio: "number",
        saturationFactor: "number",
        brightnessFactor: "number",
        colorSpread: "number"
      },
      defaults: {
        depthWidthRatio: 1 / 3,
        saturationFactor: 1,
        brightnessFactor: 1,
        colorSpread: 1,
        transformFillStroke: true
      },
      triggers: { groupCount: "panzoom" },
      updaters: {
        panzoom: function (c) {
          var g = this,
            e = c.visibleMaxX - c.visibleMinX,
            d = c.visibleMaxY - c.visibleMinY,
            b = c.flipXY ? c.innerHeight : c.innerWidth,
            h = !c.flipXY ? c.innerHeight : c.innerWidth,
            a = g.getSurface(),
            f = a ? a.getInherited().rtl : false;
          if (f && !c.flipXY) {
            c.translationX = b + (c.visibleMinX * b) / e;
          } else {
            c.translationX = (-c.visibleMinX * b) / e;
          }
          c.translationY = (-c.visibleMinY * (h - g.depth)) / d;
          c.scalingX = ((f && !c.flipXY ? -1 : 1) * b) / e;
          c.scalingY = (h - g.depth) / d;
          c.scalingCenterX = 0;
          c.scalingCenterY = 0;
          g.applyTransformations(true);
        }
      }
    }
  },
  config: { showStroke: false },
  depth: 0,
  drawBar: function (p, b, d, c, l, o, a, h) {
    var k = this,
      i = k.attr,
      n = {},
      j = i.renderer,
      m,
      g,
      f,
      e;
    n.x = (c + o) * 0.5;
    n.y = l;
    n.width = (o - c) * 0.75;
    n.height = a - l;
    n.depth = g = n.width * i.depthWidthRatio;
    n.orientation = i.flipXY ? "horizontal" : "vertical";
    n.saturationFactor = i.saturationFactor;
    n.brightnessFactor = i.brightnessFactor;
    n.colorSpread = i.colorSpread;
    if (g !== k.depth) {
      k.depth = g;
      f = k.getSeries();
      f.fireEvent("depthchange", f, g);
    }
    if (j) {
      e = [k, n, { store: k.getStore() }, h];
      m = Ext.callback(j, null, e, 0, k.getSeries());
      Ext.apply(n, m);
    }
    k.putMarker("items", n, h, !j);
  }
});
Ext.define("Ext.chart.series.sprite.Box", {
  extend: "Ext.draw.sprite.Sprite",
  alias: "sprite.box",
  type: "box",
  inheritableStatics: {
    def: {
      processors: {
        x: "number",
        y: "number",
        width: "number",
        height: "number",
        depth: "number",
        orientation: "enums(vertical,horizontal)",
        showStroke: "bool",
        saturationFactor: "number",
        brightnessFactor: "number",
        colorSpread: "number"
      },
      triggers: {
        x: "bbox",
        y: "bbox",
        width: "bbox",
        height: "bbox",
        depth: "bbox",
        orientation: "bbox"
      },
      defaults: {
        x: 0,
        y: 0,
        width: 8,
        height: 8,
        depth: 8,
        orientation: "vertical",
        showStroke: false,
        saturationFactor: 1,
        brightnessFactor: 1,
        colorSpread: 1,
        lineJoin: "bevel"
      }
    }
  },
  constructor: function (a) {
    this.callParent([a]);
    this.topGradient = new Ext.draw.gradient.Linear({});
    this.rightGradient = new Ext.draw.gradient.Linear({});
    this.frontGradient = new Ext.draw.gradient.Linear({});
  },
  updatePlainBBox: function (d) {
    var c = this.attr,
      b = c.x,
      g = c.y,
      e = c.width,
      a = c.height,
      f = c.depth;
    d.x = b - e * 0.5;
    d.width = e + f;
    if (a > 0) {
      d.y = g;
      d.height = a + f;
    } else {
      d.y = g + f;
      d.height = a - f;
    }
  },
  render: function (l, m) {
    var u = this,
      k = u.attr,
      r = k.x,
      j = k.y,
      f = j + k.height,
      i = j < f,
      e = k.width * 0.5,
      v = k.depth,
      d = k.orientation === "horizontal",
      g = k.globalAlpha < 1,
      c = k.fillStyle,
      n = Ext.util.Color.create(c.isGradient ? c.getStops()[0].color : c),
      h = k.saturationFactor,
      o = k.brightnessFactor,
      t = k.colorSpread,
      b = n.getHSV(),
      a = {},
      s,
      q,
      p;
    if (!k.showStroke) {
      m.strokeStyle = Ext.util.Color.RGBA_NONE;
    }
    if (i) {
      p = j;
      j = f;
      f = p;
    }
    u.topGradient.setDegrees(d ? 0 : 80);
    u.topGradient.setStops([
      {
        offset: 0,
        color: Ext.util.Color.fromHSV(
          b[0],
          Ext.Number.constrain(b[1] * h, 0, 1),
          Ext.Number.constrain((0.5 + t * 0.1) * o, 0, 1)
        )
      },
      {
        offset: 1,
        color: Ext.util.Color.fromHSV(
          b[0],
          Ext.Number.constrain(b[1] * h, 0, 1),
          Ext.Number.constrain((0.5 - t * 0.11) * o, 0, 1)
        )
      }
    ]);
    u.rightGradient.setDegrees(d ? 45 : 90);
    u.rightGradient.setStops([
      {
        offset: 0,
        color: Ext.util.Color.fromHSV(
          b[0],
          Ext.Number.constrain(b[1] * h, 0, 1),
          Ext.Number.constrain((0.5 - t * 0.14) * o, 0, 1)
        )
      },
      {
        offset: 1,
        color: Ext.util.Color.fromHSV(
          b[0],
          Ext.Number.constrain(b[1] * (1 + t * 0.4) * h, 0, 1),
          Ext.Number.constrain((0.5 - t * 0.32) * o, 0, 1)
        )
      }
    ]);
    if (d) {
      u.frontGradient.setDegrees(0);
    } else {
      u.frontGradient.setRadians(Math.atan2(j - f, e * 2));
    }
    u.frontGradient.setStops([
      {
        offset: 0,
        color: Ext.util.Color.fromHSV(
          b[0],
          Ext.Number.constrain(b[1] * (1 - t * 0.1) * h, 0, 1),
          Ext.Number.constrain((0.5 + t * 0.1) * o, 0, 1)
        )
      },
      {
        offset: 1,
        color: Ext.util.Color.fromHSV(
          b[0],
          Ext.Number.constrain(b[1] * (1 + t * 0.1) * h, 0, 1),
          Ext.Number.constrain((0.5 - t * 0.23) * o, 0, 1)
        )
      }
    ]);
    if (g || i) {
      m.beginPath();
      m.moveTo(r - e, f);
      m.lineTo(r - e + v, f + v);
      m.lineTo(r + e + v, f + v);
      m.lineTo(r + e, f);
      m.closePath();
      a.x = r - e;
      a.y = j;
      a.width = e + v;
      a.height = v;
      m.fillStyle = (d ? u.rightGradient : u.topGradient).generateGradient(
        m,
        a
      );
      m.fillStroke(k);
    }
    if (g) {
      m.beginPath();
      m.moveTo(r - e, j);
      m.lineTo(r - e + v, j + v);
      m.lineTo(r - e + v, f + v);
      m.lineTo(r - e, f);
      m.closePath();
      a.x = r + e;
      a.y = f;
      a.width = v;
      a.height = j + v - f;
      m.fillStyle = (d ? u.topGradient : u.rightGradient).generateGradient(
        m,
        a
      );
      m.fillStroke(k);
    }
    q = l.roundPixel(j);
    m.beginPath();
    m.moveTo(r - e, q);
    m.lineTo(r - e + v, j + v);
    m.lineTo(r + e + v, j + v);
    m.lineTo(r + e, q);
    m.closePath();
    a.x = r - e;
    a.y = j;
    a.width = e + v;
    a.height = v;
    m.fillStyle = (d ? u.rightGradient : u.topGradient).generateGradient(m, a);
    m.fillStroke(k);
    s = l.roundPixel(r + e);
    m.beginPath();
    m.moveTo(s, l.roundPixel(j));
    m.lineTo(r + e + v, j + v);
    m.lineTo(r + e + v, f + v);
    m.lineTo(s, f);
    m.closePath();
    a.x = r + e;
    a.y = f;
    a.width = v;
    a.height = j + v - f;
    m.fillStyle = (d ? u.topGradient : u.rightGradient).generateGradient(m, a);
    m.fillStroke(k);
    s = l.roundPixel(r + e);
    q = l.roundPixel(j);
    m.beginPath();
    m.moveTo(r - e, f);
    m.lineTo(r - e, q);
    m.lineTo(s, q);
    m.lineTo(s, f);
    m.closePath();
    a.x = r - e;
    a.y = f;
    a.width = e * 2;
    a.height = j - f;
    m.fillStyle = u.frontGradient.generateGradient(m, a);
    m.fillStroke(k);
  }
});
Ext.define("Ext.chart.series.Bar3D", {
  extend: "Ext.chart.series.Bar",
  requires: ["Ext.chart.series.sprite.Bar3D", "Ext.chart.series.sprite.Box"],
  alias: "series.bar3d",
  type: "bar3d",
  seriesType: "bar3dSeries",
  is3D: true,
  config: {
    itemInstancing: {
      type: "box",
      fx: { customDurations: { x: 0, y: 0, width: 0, height: 0, depth: 0 } }
    },
    highlightCfg: { opacity: 0.8 }
  },
  updateXAxis: function (b, a) {
    this.callParent([b, a]);
  },
  getSprites: function () {
    var c = this.callParent(arguments),
      b,
      d,
      a;
    for (a = 0; a < c.length; a++) {
      b = c[a];
      d = b.attr.zIndex;
      if (d < 0) {
        b.setAttributes({ zIndex: -d });
      }
      if (b.setSeries) {
        b.setSeries(this);
      }
    }
    return c;
  },
  getDepth: function () {
    var a = this.getSprites()[0];
    return a ? a.depth || 0 : 0;
  },
  getItemForPoint: function (m, k) {
    if (this.getSprites()) {
      var j = this,
        b,
        o,
        a = j.getItemInstancing(),
        h = j.getSprites(),
        n = j.getStore(),
        c = j.getHidden(),
        g = j.getChart(),
        l = g.getInnerPadding(),
        f = g.getInherited().rtl,
        p,
        d,
        e;
      m = m + (f ? l.right : -l.left);
      k = k + l.bottom;
      for (b = h.length - 1; b >= 0; b--) {
        if (!c[b]) {
          o = h[b];
          d = o.getIndexNearPoint(m, k);
          if (d !== -1) {
            e = j.getYField();
            p = {
              series: j,
              index: d,
              category: a ? "items" : "markers",
              record: n.getData().items[d],
              field: typeof e === "string" ? e : e[b],
              sprite: o
            };
            return p;
          }
        }
      }
      return null;
    }
  }
});
Ext.define("Ext.draw.LimitedCache", {
  config: {
    limit: 40,
    feeder: function () {
      return 0;
    },
    scope: null
  },
  cache: null,
  constructor: function (a) {
    this.cache = {};
    this.cache.list = [];
    this.cache.tail = 0;
    this.initConfig(a);
  },
  get: function (e) {
    var c = this.cache,
      b = this.getLimit(),
      a = this.getFeeder(),
      d = this.getScope() || this;
    if (c[e]) {
      return c[e].value;
    }
    if (c.list[c.tail]) {
      delete c[c.list[c.tail].cacheId];
    }
    c[e] = c.list[c.tail] = {
      value: a.apply(d, Array.prototype.slice.call(arguments, 1)),
      cacheId: e
    };
    c.tail++;
    if (c.tail === b) {
      c.tail = 0;
    }
    return c[e].value;
  },
  clear: function () {
    this.cache = {};
    this.cache.list = [];
    this.cache.tail = 0;
  }
});
Ext.define("Ext.draw.SegmentTree", {
  config: { strategy: "double" },
  time: function (m, l, n, c, E, d, e) {
    var f = 0,
      o,
      A,
      s = new Date(n[m.startIdx[0]]),
      x = new Date(n[m.endIdx[l - 1]]),
      D = Ext.Date,
      u = [
        [D.MILLI, 1, "ms1", null],
        [D.MILLI, 2, "ms2", "ms1"],
        [D.MILLI, 5, "ms5", "ms1"],
        [D.MILLI, 10, "ms10", "ms5"],
        [D.MILLI, 50, "ms50", "ms10"],
        [D.MILLI, 100, "ms100", "ms50"],
        [D.MILLI, 500, "ms500", "ms100"],
        [D.SECOND, 1, "s1", "ms500"],
        [D.SECOND, 10, "s10", "s1"],
        [D.SECOND, 30, "s30", "s10"],
        [D.MINUTE, 1, "mi1", "s10"],
        [D.MINUTE, 5, "mi5", "mi1"],
        [D.MINUTE, 10, "mi10", "mi5"],
        [D.MINUTE, 30, "mi30", "mi10"],
        [D.HOUR, 1, "h1", "mi30"],
        [D.HOUR, 6, "h6", "h1"],
        [D.HOUR, 12, "h12", "h6"],
        [D.DAY, 1, "d1", "h12"],
        [D.DAY, 7, "d7", "d1"],
        [D.MONTH, 1, "mo1", "d1"],
        [D.MONTH, 3, "mo3", "mo1"],
        [D.MONTH, 6, "mo6", "mo3"],
        [D.YEAR, 1, "y1", "mo3"],
        [D.YEAR, 5, "y5", "y1"],
        [D.YEAR, 10, "y10", "y5"],
        [D.YEAR, 100, "y100", "y10"]
      ],
      z,
      b,
      k = f,
      F = l,
      j = false,
      r = m.startIdx,
      h = m.endIdx,
      w = m.minIdx,
      C = m.maxIdx,
      a = m.open,
      y = m.close,
      g = m.minX,
      q = m.minY,
      p = m.maxX,
      B = m.maxY,
      v,
      t;
    for (z = 0; l > f + 1 && z < u.length; z++) {
      s = new Date(n[r[0]]);
      b = u[z];
      s = D.align(s, b[0], b[1]);
      if (D.diff(s, x, b[0]) > n.length * 2 * b[1]) {
        continue;
      }
      if (b[3] && m.map["time_" + b[3]]) {
        o = m.map["time_" + b[3]][0];
        A = m.map["time_" + b[3]][1];
      } else {
        o = k;
        A = F;
      }
      f = l;
      t = s;
      j = true;
      r[l] = r[o];
      h[l] = h[o];
      w[l] = w[o];
      C[l] = C[o];
      a[l] = a[o];
      y[l] = y[o];
      g[l] = g[o];
      q[l] = q[o];
      p[l] = p[o];
      B[l] = B[o];
      t = Ext.Date.add(t, b[0], b[1]);
      for (v = o + 1; v < A; v++) {
        if (n[h[v]] < +t) {
          h[l] = h[v];
          y[l] = y[v];
          if (B[v] > B[l]) {
            B[l] = B[v];
            p[l] = p[v];
            C[l] = C[v];
          }
          if (q[v] < q[l]) {
            q[l] = q[v];
            g[l] = g[v];
            w[l] = w[v];
          }
        } else {
          l++;
          r[l] = r[v];
          h[l] = h[v];
          w[l] = w[v];
          C[l] = C[v];
          a[l] = a[v];
          y[l] = y[v];
          g[l] = g[v];
          q[l] = q[v];
          p[l] = p[v];
          B[l] = B[v];
          t = Ext.Date.add(t, b[0], b[1]);
        }
      }
      if (l > f) {
        m.map["time_" + b[2]] = [f, l];
      }
    }
  },
  double: function (h, u, j, a, t, b, c) {
    var e = 0,
      k,
      f = 1,
      n,
      d,
      v,
      g,
      s,
      l,
      m,
      r,
      q,
      p,
      o;
    while (u > e + 1) {
      k = e;
      e = u;
      f += f;
      for (n = k; n < e; n += 2) {
        if (n === e - 1) {
          d = h.startIdx[n];
          v = h.endIdx[n];
          g = h.minIdx[n];
          s = h.maxIdx[n];
          l = h.open[n];
          m = h.close[n];
          r = h.minX[n];
          q = h.minY[n];
          p = h.maxX[n];
          o = h.maxY[n];
        } else {
          d = h.startIdx[n];
          v = h.endIdx[n + 1];
          l = h.open[n];
          m = h.close[n];
          if (h.minY[n] <= h.minY[n + 1]) {
            g = h.minIdx[n];
            r = h.minX[n];
            q = h.minY[n];
          } else {
            g = h.minIdx[n + 1];
            r = h.minX[n + 1];
            q = h.minY[n + 1];
          }
          if (h.maxY[n] >= h.maxY[n + 1]) {
            s = h.maxIdx[n];
            p = h.maxX[n];
            o = h.maxY[n];
          } else {
            s = h.maxIdx[n + 1];
            p = h.maxX[n + 1];
            o = h.maxY[n + 1];
          }
        }
        h.startIdx[u] = d;
        h.endIdx[u] = v;
        h.minIdx[u] = g;
        h.maxIdx[u] = s;
        h.open[u] = l;
        h.close[u] = m;
        h.minX[u] = r;
        h.minY[u] = q;
        h.maxX[u] = p;
        h.maxY[u] = o;
        u++;
      }
      h.map["double_" + f] = [e, u];
    }
  },
  none: Ext.emptyFn,
  aggregateData: function (h, a, r, c, d) {
    var b = h.length,
      e = [],
      s = [],
      f = [],
      q = [],
      j = [],
      p = [],
      n = [],
      o = [],
      m = [],
      k = [],
      g = {
        startIdx: e,
        endIdx: s,
        minIdx: f,
        maxIdx: q,
        open: j,
        minX: p,
        minY: n,
        maxX: o,
        maxY: m,
        close: k
      },
      l;
    for (l = 0; l < b; l++) {
      e[l] = l;
      s[l] = l;
      f[l] = l;
      q[l] = l;
      j[l] = a[l];
      p[l] = h[l];
      n[l] = c[l];
      o[l] = h[l];
      m[l] = r[l];
      k[l] = d[l];
    }
    g.map = { original: [0, b] };
    if (b) {
      this[this.getStrategy()](g, b, h, a, r, c, d);
    }
    return g;
  },
  binarySearchMin: function (c, g, a, e) {
    var b = this.dataX;
    if (e <= b[c.startIdx[0]]) {
      return g;
    }
    if (e >= b[c.startIdx[a - 1]]) {
      return a - 1;
    }
    while (g + 1 < a) {
      var d = (g + a) >> 1,
        f = b[c.startIdx[d]];
      if (f === e) {
        return d;
      } else {
        if (f < e) {
          g = d;
        } else {
          a = d;
        }
      }
    }
    return g;
  },
  binarySearchMax: function (c, g, a, e) {
    var b = this.dataX;
    if (e <= b[c.endIdx[0]]) {
      return g;
    }
    if (e >= b[c.endIdx[a - 1]]) {
      return a - 1;
    }
    while (g + 1 < a) {
      var d = (g + a) >> 1,
        f = b[c.endIdx[d]];
      if (f === e) {
        return d;
      } else {
        if (f < e) {
          g = d;
        } else {
          a = d;
        }
      }
    }
    return a;
  },
  constructor: function (a) {
    this.initConfig(a);
  },
  setData: function (d, a, b, c, e) {
    if (!b) {
      e = c = b = a;
    }
    this.dataX = d;
    this.dataOpen = a;
    this.dataHigh = b;
    this.dataLow = c;
    this.dataClose = e;
    if (d.length === b.length && d.length === c.length) {
      this.cache = this.aggregateData(d, a, b, c, e);
    }
  },
  getAggregation: function (d, k, i) {
    if (!this.cache) {
      return null;
    }
    var c = Infinity,
      g = this.dataX[this.dataX.length - 1] - this.dataX[0],
      l = this.cache.map,
      m = l.original,
      a,
      e,
      j,
      b,
      f,
      h;
    for (a in l) {
      e = l[a];
      j = e[1] - e[0] - 1;
      b = g / j;
      if (i <= b && b < c) {
        m = e;
        c = b;
      }
    }
    f = Math.max(this.binarySearchMin(this.cache, m[0], m[1], d), m[0]);
    h = Math.min(this.binarySearchMax(this.cache, m[0], m[1], k) + 1, m[1]);
    return { data: this.cache, start: f, end: h };
  }
});
Ext.define("Ext.chart.series.sprite.Aggregative", {
  extend: "Ext.chart.series.sprite.Cartesian",
  requires: ["Ext.draw.LimitedCache", "Ext.draw.SegmentTree"],
  inheritableStatics: {
    def: {
      processors: { dataHigh: "data", dataLow: "data", dataClose: "data" },
      aliases: { dataOpen: "dataY" },
      defaults: { dataHigh: null, dataLow: null, dataClose: null }
    }
  },
  config: { aggregator: {} },
  applyAggregator: function (b, a) {
    return Ext.factory(b, Ext.draw.SegmentTree, a);
  },
  constructor: function () {
    this.callParent(arguments);
  },
  processDataY: function () {
    var d = this,
      b = d.attr,
      e = b.dataHigh,
      a = b.dataLow,
      g = b.dataClose,
      c = b.dataY,
      f;
    d.callParent(arguments);
    if (b.dataX && c && c.length > 0) {
      f = d.getAggregator();
      if (e) {
        f.setData(b.dataX, b.dataY, e, a, g);
      } else {
        f.setData(b.dataX, b.dataY);
      }
    }
  },
  getGapWidth: function () {
    return 1;
  },
  renderClipped: function (b, i, c, g) {
    var f = this,
      d = Math.min(c[0], c[2]),
      h = Math.max(c[0], c[2]),
      a = f.getAggregator(),
      e = a && a.getAggregation(d, h, ((h - d) / g[2]) * f.getGapWidth());
    if (e) {
      f.dataStart = e.data.startIdx[e.start];
      f.dataEnd = e.data.endIdx[e.end - 1];
      f.renderAggregates(e.data, e.start, e.end, b, i, c, g);
    }
  }
});
Ext.define("Ext.chart.series.sprite.CandleStick", {
  alias: "sprite.candlestickSeries",
  extend: "Ext.chart.series.sprite.Aggregative",
  inheritableStatics: {
    def: {
      processors: {
        raiseStyle: function (b, a) {
          return Ext.merge({}, a || {}, b);
        },
        dropStyle: function (b, a) {
          return Ext.merge({}, a || {}, b);
        },
        barWidth: "number",
        padding: "number",
        ohlcType: "enums(candlestick,ohlc)"
      },
      defaults: {
        raiseStyle: { strokeStyle: "green", fillStyle: "green" },
        dropStyle: { strokeStyle: "red", fillStyle: "red" },
        planar: false,
        barWidth: 15,
        padding: 3,
        lineJoin: "miter",
        miterLimit: 5,
        ohlcType: "candlestick"
      },
      triggers: { raiseStyle: "raiseStyle", dropStyle: "dropStyle" },
      updaters: {
        raiseStyle: function () {
          this.raiseTemplate &&
            this.raiseTemplate.setAttributes(this.attr.raiseStyle);
        },
        dropStyle: function () {
          this.dropTemplate &&
            this.dropTemplate.setAttributes(this.attr.dropStyle);
        }
      }
    }
  },
  candlestick: function (i, c, a, e, h, f, b) {
    var d = Math.min(c, h),
      g = Math.max(c, h);
    i.moveTo(f, e);
    i.lineTo(f, g);
    i.moveTo(f + b, g);
    i.lineTo(f + b, d);
    i.lineTo(f - b, d);
    i.lineTo(f - b, g);
    i.closePath();
    i.moveTo(f, a);
    i.lineTo(f, d);
  },
  ohlc: function (b, d, e, a, f, c, g) {
    b.moveTo(c, e);
    b.lineTo(c, a);
    b.moveTo(c, d);
    b.lineTo(c - g, d);
    b.moveTo(c, f);
    b.lineTo(c + g, f);
  },
  constructor: function () {
    this.callParent(arguments);
    this.raiseTemplate = new Ext.draw.sprite.Rect({ parent: this });
    this.dropTemplate = new Ext.draw.sprite.Rect({ parent: this });
  },
  getGapWidth: function () {
    var a = this.attr,
      b = a.barWidth,
      c = a.padding;
    return b + c;
  },
  renderAggregates: function (d, c, b, t, u, z) {
    var D = this,
      s = this.attr,
      j = s.dataX,
      v = s.matrix,
      e = v.getXX(),
      r = v.getYY(),
      l = v.getDX(),
      h = v.getDY(),
      o = s.barWidth / e,
      C,
      k = s.ohlcType,
      f = Math.round(o * 0.5 * e),
      a = d.open,
      y = d.close,
      B = d.maxY,
      p = d.minY,
      q = d.startIdx,
      m,
      g,
      E,
      n,
      A,
      x,
      w = (s.lineWidth * t.devicePixelRatio) / 2;
    w -= Math.floor(w);
    u.save();
    C = this.raiseTemplate;
    C.useAttributes(u, z);
    u.beginPath();
    for (x = c; x < b; x++) {
      if (a[x] <= y[x]) {
        m = Math.round(a[x] * r + h) + w;
        g = Math.round(B[x] * r + h) + w;
        E = Math.round(p[x] * r + h) + w;
        n = Math.round(y[x] * r + h) + w;
        A = Math.round(j[q[x]] * e + l) + w;
        D[k](u, m, g, E, n, A, f);
      }
    }
    u.fillStroke(C.attr);
    u.restore();
    u.save();
    C = this.dropTemplate;
    C.useAttributes(u, z);
    u.beginPath();
    for (x = c; x < b; x++) {
      if (a[x] > y[x]) {
        m = Math.round(a[x] * r + h) + w;
        g = Math.round(B[x] * r + h) + w;
        E = Math.round(p[x] * r + h) + w;
        n = Math.round(y[x] * r + h) + w;
        A = Math.round(j[q[x]] * e + l) + w;
        D[k](u, m, g, E, n, A, f);
      }
    }
    u.fillStroke(C.attr);
    u.restore();
  }
});
Ext.define("Ext.chart.series.CandleStick", {
  extend: "Ext.chart.series.Cartesian",
  requires: ["Ext.chart.series.sprite.CandleStick"],
  alias: "series.candlestick",
  type: "candlestick",
  seriesType: "candlestickSeries",
  config: {
    openField: null,
    highField: null,
    lowField: null,
    closeField: null
  },
  fieldCategoryY: ["Open", "High", "Low", "Close"],
  themeColorCount: function () {
    return 2;
  }
});
Ext.define("Ext.chart.series.Polar", {
  extend: "Ext.chart.series.Series",
  config: {
    rotation: 0,
    radius: null,
    center: [0, 0],
    offsetX: 0,
    offsetY: 0,
    showInLegend: true,
    xField: null,
    yField: null,
    angleField: null,
    radiusField: null,
    xAxis: null,
    yAxis: null
  },
  directions: ["X", "Y"],
  fieldCategoryX: ["X"],
  fieldCategoryY: ["Y"],
  deprecatedConfigs: { field: "angleField", lengthField: "radiusField" },
  constructor: function (b) {
    var c = this,
      a = c.self.getConfigurator(),
      e = a.configs,
      d;
    if (b) {
      for (d in c.deprecatedConfigs) {
        if (d in b && !(b in e)) {
          Ext.raise(
            "'" +
              d +
              "' config has been deprecated. Please use the '" +
              c.deprecatedConfigs[d] +
              "' config instead."
          );
        }
      }
    }
    c.callParent([b]);
  },
  getXField: function () {
    return this.getAngleField();
  },
  updateXField: function (a) {
    this.setAngleField(a);
  },
  getYField: function () {
    return this.getRadiusField();
  },
  updateYField: function (a) {
    this.setRadiusField(a);
  },
  applyXAxis: function (a, b) {
    return this.getChart().getAxis(a) || b;
  },
  applyYAxis: function (a, b) {
    return this.getChart().getAxis(a) || b;
  },
  getXRange: function () {
    return [this.dataRange[0], this.dataRange[2]];
  },
  getYRange: function () {
    return [this.dataRange[1], this.dataRange[3]];
  },
  themeColorCount: function () {
    var c = this,
      a = c.getStore(),
      b = (a && a.getCount()) || 0;
    return b;
  },
  isStoreDependantColorCount: true,
  getDefaultSpriteConfig: function () {
    return {
      type: this.seriesType,
      renderer: this.getRenderer(),
      centerX: 0,
      centerY: 0,
      rotationCenterX: 0,
      rotationCenterY: 0
    };
  },
  applyRotation: function (a) {
    return Ext.draw.sprite.AttributeParser.angle(a);
  },
  updateRotation: function (a) {
    var b = this.getSprites();
    if (b && b[0]) {
      b[0].setAttributes({ baseRotation: a });
    }
  }
});
Ext.define("Ext.chart.series.Gauge", {
  alias: "series.gauge",
  extend: "Ext.chart.series.Polar",
  type: "gauge",
  seriesType: "pieslice",
  requires: ["Ext.draw.sprite.Sector"],
  config: {
    needle: false,
    needleLength: 90,
    needleWidth: 4,
    donut: 30,
    showInLegend: false,
    value: null,
    colors: null,
    sectors: null,
    minimum: 0,
    maximum: 100,
    rotation: 0,
    totalAngle: Math.PI / 2,
    rect: [0, 0, 1, 1],
    center: [0.5, 0.75],
    radius: 0.5,
    wholeDisk: false
  },
  coordinateX: function () {
    return this.coordinate("X", 0, 2);
  },
  coordinateY: function () {
    return this.coordinate("Y", 1, 2);
  },
  updateNeedle: function (b) {
    var a = this,
      d = a.getSprites(),
      c = a.valueToAngle(a.getValue());
    if (d && d.length) {
      d[0].setAttributes({
        startAngle: b ? c : 0,
        endAngle: c,
        strokeOpacity: b ? 1 : 0,
        lineWidth: b ? a.getNeedleWidth() : 0
      });
      a.doUpdateStyles();
    }
  },
  themeColorCount: function () {
    var c = this,
      a = c.getStore(),
      b = (a && a.getCount()) || 0;
    return b + (c.getNeedle() ? 0 : 1);
  },
  updateColors: function (a, b) {
    var f = this,
      h = f.getSectors(),
      j = h && h.length,
      e = f.getSprites(),
      c = Ext.Array.clone(a),
      g = a && a.length,
      d;
    if (!g || !a[0]) {
      return;
    }
    for (d = 0; d < j; d++) {
      c[d + 1] = h[d].color || c[d + 1] || a[d % g];
    }
    if (e.length) {
      e[0].setAttributes({ strokeStyle: c[0] });
    }
    this.setSubStyle({ fillStyle: c, strokeStyle: c });
    this.doUpdateStyles();
  },
  updateRect: function (f) {
    var d = this.getWholeDisk(),
      c = d ? Math.PI : this.getTotalAngle() / 2,
      g = this.getDonut() / 100,
      e,
      b,
      a;
    if (c <= Math.PI / 2) {
      e = 2 * Math.sin(c);
      b = 1 - g * Math.cos(c);
    } else {
      e = 2;
      b = 1 - Math.cos(c);
    }
    a = Math.min(f[2] / e, f[3] / b);
    this.setRadius(a);
    this.setCenter([f[2] / 2, a + (f[3] - b * a) / 2]);
  },
  updateCenter: function (a) {
    this.setStyle({
      centerX: a[0],
      centerY: a[1],
      rotationCenterX: a[0],
      rotationCenterY: a[1]
    });
    this.doUpdateStyles();
  },
  updateRotation: function (a) {
    this.setStyle({ rotationRads: a - (this.getTotalAngle() + Math.PI) / 2 });
    this.doUpdateStyles();
  },
  doUpdateShape: function (b, f) {
    var a,
      d = this.getSectors(),
      c = (d && d.length) || 0,
      e = this.getNeedleLength() / 100;
    a = [b * e, b];
    while (c--) {
      a.push(b);
    }
    this.setSubStyle({ endRho: a, startRho: (b / 100) * f });
    this.doUpdateStyles();
  },
  updateRadius: function (a) {
    var b = this.getDonut();
    this.doUpdateShape(a, b);
  },
  updateDonut: function (b) {
    var a = this.getRadius();
    this.doUpdateShape(a, b);
  },
  valueToAngle: function (a) {
    a = this.applyValue(a);
    return (
      (this.getTotalAngle() * (a - this.getMinimum())) /
      (this.getMaximum() - this.getMinimum())
    );
  },
  applyValue: function (a) {
    return Math.min(this.getMaximum(), Math.max(a, this.getMinimum()));
  },
  updateValue: function (b) {
    var a = this,
      c = a.getNeedle(),
      e = a.valueToAngle(b),
      d = a.getSprites();
    d[0].getRendererData().value = b;
    d[0].setAttributes({ startAngle: c ? e : 0, endAngle: e });
    a.doUpdateStyles();
  },
  processData: function () {
    var f = this,
      j = f.getStore(),
      a,
      d,
      h,
      b,
      g,
      e = j && j.first(),
      c,
      i;
    if (e) {
      c = f.getXField();
      if (c) {
        i = e.get(c);
      }
    }
    if ((a = f.getXAxis())) {
      d = a.getMinimum();
      h = a.getMaximum();
      b = a.getSprites()[0].fx;
      g = b.getDuration();
      b.setDuration(0);
      if (Ext.isNumber(d)) {
        f.setMinimum(d);
      } else {
        a.setMinimum(f.getMinimum());
      }
      if (Ext.isNumber(h)) {
        f.setMaximum(h);
      } else {
        a.setMaximum(f.getMaximum());
      }
      b.setDuration(g);
    }
    if (!Ext.isNumber(i)) {
      i = f.getMinimum();
    }
    f.setValue(i);
  },
  getDefaultSpriteConfig: function () {
    return {
      type: this.seriesType,
      renderer: this.getRenderer(),
      fx: {
        customDurations: {
          translationX: 0,
          translationY: 0,
          rotationCenterX: 0,
          rotationCenterY: 0,
          centerX: 0,
          centerY: 0,
          startRho: 0,
          endRho: 0,
          baseRotation: 0
        }
      }
    };
  },
  normalizeSectors: function (f) {
    var d = this,
      c = (f && f.length) || 0,
      b,
      e,
      g,
      a;
    if (c) {
      for (b = 0; b < c; b++) {
        e = f[b];
        if (typeof e === "number") {
          f[b] = {
            start: b > 0 ? f[b - 1].end : d.getMinimum(),
            end: Math.min(e, d.getMaximum())
          };
          if (b == c - 1 && f[b].end < d.getMaximum()) {
            f[b + 1] = { start: f[b].end, end: d.getMaximum() };
          }
        } else {
          if (typeof e.start === "number") {
            g = Math.max(e.start, d.getMinimum());
          } else {
            g = b > 0 ? f[b - 1].end : d.getMinimum();
          }
          if (typeof e.end === "number") {
            a = Math.min(e.end, d.getMaximum());
          } else {
            a = d.getMaximum();
          }
          f[b].start = g;
          f[b].end = a;
        }
      }
    } else {
      f = [{ start: d.getMinimum(), end: d.getMaximum() }];
    }
    return f;
  },
  getSprites: function () {
    var j = this,
      m = j.getStore(),
      l = j.getValue(),
      c,
      g;
    if (!m && !Ext.isNumber(l)) {
      return [];
    }
    var h = j.getChart(),
      b = j.getAnimation() || (h && h.getAnimation()),
      f = j.sprites,
      k = 0,
      o,
      n,
      e,
      d,
      a = [];
    if (f && f.length) {
      f[0].setAnimation(b);
      return f;
    }
    d = {
      store: m,
      field: j.getXField(),
      angleField: j.getXField(),
      value: l,
      series: j
    };
    o = j.createSprite();
    o.setAttributes({ zIndex: 10 }, true);
    o.setRendererData(d);
    o.setRendererIndex(k++);
    a.push(j.getNeedleWidth());
    j.getLabel().getTemplate().setField(true);
    n = j.normalizeSectors(j.getSectors());
    for (c = 0, g = n.length; c < g; c++) {
      e = {
        startAngle: j.valueToAngle(n[c].start),
        endAngle: j.valueToAngle(n[c].end),
        label: n[c].label,
        fillStyle: n[c].color,
        strokeOpacity: 0,
        doCallout: false,
        labelOverflowPadding: -1
      };
      Ext.apply(e, n[c].style);
      o = j.createSprite();
      o.setRendererData(d);
      o.setRendererIndex(k++);
      o.setAttributes(e, true);
      a.push(e.lineWidth);
    }
    j.setSubStyle({ lineWidth: a });
    j.doUpdateStyles();
    return f;
  }
});
Ext.define("Ext.chart.series.sprite.Line", {
  alias: "sprite.lineSeries",
  extend: "Ext.chart.series.sprite.Aggregative",
  inheritableStatics: {
    def: {
      processors: {
        smooth: "bool",
        fillArea: "bool",
        step: "bool",
        nullStyle: "enums(gap,connect,origin)",
        preciseStroke: "bool",
        xAxis: "default",
        yCap: "default"
      },
      defaults: {
        smooth: false,
        nullStyle: "connect",
        fillArea: false,
        step: false,
        preciseStroke: true,
        xAxis: null,
        yCap: Math.pow(2, 20),
        yJump: 50
      },
      triggers: {
        dataX: "dataX,bbox,smooth",
        dataY: "dataY,bbox,smooth",
        smooth: "smooth"
      },
      updaters: {
        smooth: function (a) {
          var c = a.dataX,
            b = a.dataY;
          if (a.smooth && c && b && c.length > 2 && b.length > 2) {
            this.smoothX = Ext.draw.Draw.spline(c);
            this.smoothY = Ext.draw.Draw.spline(b);
          } else {
            delete this.smoothX;
            delete this.smoothY;
          }
        }
      }
    }
  },
  list: null,
  updatePlainBBox: function (d) {
    var b = this.attr,
      c = Math.min(0, b.dataMinY),
      a = Math.max(0, b.dataMaxY);
    d.x = b.dataMinX;
    d.y = c;
    d.width = b.dataMaxX - b.dataMinX;
    d.height = a - c;
  },
  drawStrip: function (a, c) {
    a.moveTo(c[0], c[1]);
    for (var b = 2, d = c.length; b < d; b += 2) {
      a.lineTo(c[b], c[b + 1]);
    }
  },
  drawStraightStroke: function (J, p, t, m, q, s) {
    var n = this,
      l = n.attr,
      z = l.nullStyle,
      b = z === "connect",
      K = z === "origin",
      D = l.renderer,
      A = l.step,
      v = true,
      w = q.length,
      f = { type: "line", smooth: false, step: A };
    var r, c, g, I, M, G, C, E, B, o, h, e, d, H, F, k, a, j, N, L;
    var u = [];
    p.beginPath();
    for (L = 3; L < w; L += 3) {
      k = q[L - 3];
      a = q[L - 2];
      H = q[L];
      F = q[L + 1];
      j = q[L + 3];
      N = q[L + 4];
      I = Ext.isNumber(k);
      M = Ext.isNumber(H);
      G = Ext.isNumber(j);
      C = I && Ext.isNumber(a);
      E = M && Ext.isNumber(F);
      B = G && Ext.isNumber(N);
      if (K) {
        if (!C && I) {
          a = s;
          C = true;
        }
        if (!E && M) {
          F = s;
          E = true;
        }
        if (!B && G) {
          N = s;
          B = true;
        }
      }
      if (D) {
        f.x = H;
        f.y = F;
        f.x0 = k;
        f.y0 = a;
        c = [n, f, n.rendererData, t + L / 3];
        r = Ext.callback(D, null, c, 0, n.getSeries());
      }
      if (o && b && C && h) {
        e = h[0];
        d = h[1];
        if (v) {
          p.beginPath();
          p.moveTo(e, d);
          u.push(e, d);
          g = e;
          v = false;
        }
        if (A) {
          p.lineTo(k, d);
          u.push(k, d);
        }
        p.lineTo(k, a);
        u.push(k, a);
        h = [k, a];
        o = false;
      }
      if (b && h && E && !C) {
        k = h[0];
        a = h[1];
        C = true;
      }
      if (E) {
        h = [H, F];
      }
      if (C && E) {
        if (v) {
          p.beginPath();
          p.moveTo(k, a);
          u.push(k, a);
          g = k;
          v = false;
        }
      } else {
        o = true;
        continue;
      }
      if (A) {
        p.lineTo(H, a);
        u.push(H, a);
      }
      p.lineTo(H, F);
      u.push(H, F);
      if (r || !B) {
        p.save();
        Ext.apply(p, r);
        r = null;
        if (l.fillArea) {
          p.lineTo(H, s);
          p.lineTo(g, s);
          p.closePath();
          p.fill();
        }
        p.beginPath();
        n.drawStrip(p, u);
        u = [];
        p.stroke();
        p.restore();
        p.beginPath();
        v = true;
      }
    }
  },
  calculateScale: function (c, a) {
    var b = 0,
      d = c;
    while (d < a && c > 0) {
      b++;
      d += c >> b;
    }
    return Math.pow(2, b > 0 ? b - 1 : b);
  },
  drawSmoothStroke: function (u, v, c, b, C, f) {
    var G = this,
      t = G.attr,
      d = t.step,
      z = t.matrix,
      s = t.renderer,
      e = z.getXX(),
      p = z.getYY(),
      m = z.getDX(),
      k = z.getDY(),
      r = G.smoothX,
      q = G.smoothY,
      I = G.calculateScale(t.dataX.length, b),
      o,
      F,
      n,
      E,
      h,
      g,
      B,
      a,
      A,
      w,
      H,
      D,
      l = { type: "line", smooth: true, step: d };
    v.beginPath();
    v.moveTo(r[c * 3] * e + m, q[c * 3] * p + k);
    for (A = 0, w = c * 3 + 1; A < C.length - 3; A += 3, w += 3 * I) {
      o = r[w] * e + m;
      F = q[w] * p + k;
      n = r[w + 1] * e + m;
      E = q[w + 1] * p + k;
      h = u.roundPixel(C[A + 3]);
      g = C[A + 4];
      B = u.roundPixel(C[A]);
      a = C[A + 1];
      if (s) {
        l.x0 = B;
        l.y0 = a;
        l.cx1 = o;
        l.cy1 = F;
        l.cx2 = n;
        l.cy2 = E;
        l.x = h;
        l.y = g;
        D = [G, l, G.rendererData, c + A / 3 + 1];
        H = Ext.callback(s, null, D, 0, G.getSeries());
        v.save();
        Ext.apply(v, H);
      }
      if (t.fillArea) {
        v.moveTo(B, a);
        v.bezierCurveTo(o, F, n, E, h, g);
        v.lineTo(h, f);
        v.lineTo(B, f);
        v.lineTo(B, a);
        v.closePath();
        v.fill();
        v.beginPath();
      }
      v.moveTo(B, a);
      v.bezierCurveTo(o, F, n, E, h, g);
      v.stroke();
      v.moveTo(B, a);
      v.closePath();
      if (s) {
        v.restore();
      }
      v.beginPath();
      v.moveTo(h, g);
    }
    v.beginPath();
  },
  drawLabel: function (k, i, h, o, a) {
    var q = this,
      n = q.attr,
      e = q.getMarker("labels"),
      d = e.getTemplate(),
      m = q.labelCfg || (q.labelCfg = {}),
      c = q.surfaceMatrix,
      g,
      f,
      j = n.labelOverflowPadding,
      l,
      b,
      r,
      p,
      s;
    m.x = c.x(i, h);
    m.y = c.y(i, h);
    if (n.flipXY) {
      m.rotationRads = Math.PI * 0.5;
    } else {
      m.rotationRads = 0;
    }
    m.text = k;
    if (d.attr.renderer) {
      p = [k, e, m, q.rendererData, o];
      r = Ext.callback(d.attr.renderer, null, p, 0, q.getSeries());
      if (typeof r === "string") {
        m.text = r;
      } else {
        if (typeof r === "object") {
          if ("text" in r) {
            m.text = r.text;
          }
          s = true;
        }
      }
    }
    b = q.getMarkerBBox("labels", o, true);
    if (!b) {
      q.putMarker("labels", m, o);
      b = q.getMarkerBBox("labels", o, true);
    }
    l = b.height / 2;
    g = i;
    switch (d.attr.display) {
      case "under":
        f = h - l - j;
        break;
      case "rotate":
        g += j;
        f = h - j;
        m.rotationRads = -Math.PI / 4;
        break;
      default:
        f = h + l + j;
    }
    m.x = c.x(g, f);
    m.y = c.y(g, f);
    if (s) {
      Ext.apply(m, r);
    }
    q.putMarker("labels", m, o);
  },
  drawMarker: function (j, h, d) {
    var g = this,
      e = g.attr,
      f = e.renderer,
      c = g.surfaceMatrix,
      b = {},
      i,
      a;
    if (f && g.getMarker("markers")) {
      b.type = "marker";
      b.x = j;
      b.y = h;
      a = [g, b, g.rendererData, d];
      i = Ext.callback(f, null, a, 0, g.getSeries());
      if (i) {
        Ext.apply(b, i);
      }
    }
    b.translationX = c.x(j, h);
    b.translationY = c.y(j, h);
    delete b.x;
    delete b.y;
    g.putMarker("markers", b, d, !f);
  },
  drawStroke: function (a, c, h, b, f, e) {
    var d = this,
      g = d.attr.smooth && d.smoothX && d.smoothY;
    if (g) {
      d.drawSmoothStroke(a, c, h, b, f, e);
    } else {
      d.drawStraightStroke(a, c, h, b, f, e);
    }
  },
  renderAggregates: function (D, A, l, R, q, K, F) {
    var n = this,
      k = n.attr,
      u = k.dataX,
      t = k.dataY,
      h = k.labels,
      z = k.xAxis,
      a = k.yCap,
      g = k.smooth && n.smoothX && n.smoothY,
      d = h && n.getMarker("labels"),
      v = n.getMarker("markers"),
      G = k.matrix,
      w = R.devicePixelRatio,
      E = G.getXX(),
      f = G.getYY(),
      c = G.getDX(),
      b = G.getDY(),
      s = n.list || (n.list = []),
      H = D.minX,
      e = D.maxX,
      j = D.minY,
      T = D.maxY,
      Y = D.startIdx,
      X = true,
      N,
      o,
      L,
      m,
      U,
      W,
      P,
      O,
      V,
      I;
    n.rendererData = { store: n.getStore() };
    s.length = 0;
    for (V = A; V < l; V++) {
      var S = H[V],
        r = e[V],
        Q = j[V],
        p = T[V];
      N = Ext.isNumber(S);
      L = Ext.isNumber(Q);
      o = Ext.isNumber(r);
      m = Ext.isNumber(p);
      if (S < r) {
        s.push(N ? S * E + c : null, L ? Q * f + b : null, Y[V]);
        s.push(o ? r * E + c : null, m ? p * f + b : null, Y[V]);
      } else {
        if (S > r) {
          s.push(o ? r * E + c : null, m ? p * f + b : null, Y[V]);
          s.push(N ? S * E + c : null, L ? Q * f + b : null, Y[V]);
        } else {
          s.push(o ? r * E + c : null, m ? p * f + b : null, Y[V]);
        }
      }
    }
    if (s.length) {
      for (V = 0; V < s.length; V += 3) {
        P = s[V];
        O = s[V + 1];
        if (Ext.isNumber(P) && Ext.isNumber(O)) {
          if (O > a) {
            O = a;
          } else {
            if (O < -a) {
              O = -a;
            }
          }
          s[V + 1] = O;
        } else {
          X = false;
          continue;
        }
        I = s[V + 2];
        if (v) {
          n.drawMarker(P, O, I);
        }
        if (d && h[I]) {
          n.drawLabel(h[I], P, O, I, F);
        }
      }
      n.isContinuousLine = X;
      if (g && !X) {
        Ext.raise(
          "Line smoothing in only supported for gapless data, where all data points are finite numbers."
        );
      }
      if (z) {
        W = z.getAlignment() === "vertical";
        if (Ext.isNumber(z.floatingAtCoord)) {
          U = (W ? F[2] : F[3]) - z.floatingAtCoord;
        } else {
          U = W ? F[0] : F[1];
        }
      } else {
        U = k.flipXY ? F[0] : F[1];
      }
      if (k.preciseStroke) {
        if (k.fillArea) {
          q.fill();
        }
        if (k.transformFillStroke) {
          k.inverseMatrix.toContext(q);
        }
        n.drawStroke(R, q, A, l, s, U);
        if (k.transformFillStroke) {
          k.matrix.toContext(q);
        }
        q.stroke();
      } else {
        n.drawStroke(R, q, A, l, s, U);
        if (X && g && k.fillArea && !k.renderer) {
          var C = u[u.length - 1] * E + c + w,
            B = t[t.length - 1] * f + b,
            M = u[0] * E + c - w,
            J = t[0] * f + b;
          q.lineTo(C, B);
          q.lineTo(C, U - k.lineWidth);
          q.lineTo(M, U - k.lineWidth);
          q.lineTo(M, J);
        }
        if (k.transformFillStroke) {
          k.matrix.toContext(q);
        }
        if (k.fillArea) {
          q.fillStroke(k, true);
        } else {
          q.stroke(true);
        }
      }
    }
  }
});
Ext.define("Ext.chart.series.Line", {
  extend: "Ext.chart.series.Cartesian",
  alias: "series.line",
  type: "line",
  seriesType: "lineSeries",
  requires: ["Ext.chart.series.sprite.Line"],
  config: {
    selectionTolerance: 20,
    smooth: false,
    step: false,
    nullStyle: "gap",
    fill: undefined,
    aggregator: { strategy: "double" }
  },
  defaultSmoothness: 3,
  overflowBuffer: 1,
  themeMarkerCount: function () {
    return 1;
  },
  getDefaultSpriteConfig: function () {
    var d = this,
      e = d.callParent(arguments),
      c = Ext.apply({}, d.getStyle()),
      b,
      a = false;
    if (typeof d.config.fill != "undefined") {
      if (d.config.fill) {
        a = true;
        if (typeof c.fillStyle == "undefined") {
          if (typeof c.strokeStyle == "undefined") {
            b = d.getStyleWithTheme();
            c.fillStyle = b.fillStyle;
            c.strokeStyle = b.strokeStyle;
          } else {
            c.fillStyle = c.strokeStyle;
          }
        }
      }
    } else {
      if (c.fillStyle) {
        a = true;
      }
    }
    if (!a) {
      delete c.fillStyle;
    }
    c = Ext.apply(e || {}, c);
    return Ext.apply(c, {
      fillArea: a,
      step: d.config.step,
      smooth: d.config.smooth,
      selectionTolerance: d.config.selectionTolerance
    });
  },
  updateStep: function (b) {
    var a = this.getSprites()[0];
    if (a && a.attr.step !== b) {
      a.setAttributes({ step: b });
    }
  },
  updateFill: function (b) {
    var a = this.getSprites()[0];
    if (a && a.attr.fillArea !== b) {
      a.setAttributes({ fillArea: b });
    }
  },
  updateSmooth: function (a) {
    var b = this.getSprites()[0];
    if (b && b.attr.smooth !== a) {
      b.setAttributes({ smooth: a });
    }
  },
  updateNullStyle: function (a) {
    var b = this.getSprites()[0];
    if (b && b.attr.nullStyle !== a) {
      b.setAttributes({ nullStyle: a });
    }
  }
});
Ext.define("Ext.chart.series.sprite.PieSlice", {
  extend: "Ext.draw.sprite.Sector",
  mixins: { markerHolder: "Ext.chart.MarkerHolder" },
  alias: "sprite.pieslice",
  inheritableStatics: {
    def: {
      processors: {
        doCallout: "bool",
        label: "string",
        rotateLabels: "bool",
        labelOverflowPadding: "number",
        renderer: "default"
      },
      defaults: {
        doCallout: true,
        rotateLabels: true,
        label: "",
        labelOverflowPadding: 10,
        renderer: null
      }
    }
  },
  config: { rendererData: null, rendererIndex: 0, series: null },
  setGradientBBox: function (q, k) {
    var j = this,
      i = j.attr,
      g =
        (i.fillStyle && i.fillStyle.isGradient) ||
        (i.strokeStyle && i.strokeStyle.isGradient);
    if (g && !i.constrainGradients) {
      var b = j.getMidAngle(),
        d = i.margin,
        e = i.centerX,
        c = i.centerY,
        a = i.endRho,
        l = i.matrix,
        o = l.getScaleX(),
        n = l.getScaleY(),
        m = o * a,
        f = n * a,
        p = { width: m + m, height: f + f };
      if (d) {
        e += d * Math.cos(b);
        c += d * Math.sin(b);
      }
      p.x = l.x(e, c) - m;
      p.y = l.y(e, c) - f;
      q.setGradientBBox(p);
    } else {
      j.callParent([q, k]);
    }
  },
  render: function (b, c, f) {
    var e = this,
      a = e.attr,
      g = {},
      d;
    if (a.renderer) {
      g = {
        type: "sector",
        text: a.text,
        centerX: a.centerX,
        centerY: a.centerY,
        margin: a.margin,
        startAngle: Math.min(a.startAngle, a.endAngle),
        endAngle: Math.max(a.startAngle, a.endAngle),
        startRho: Math.min(a.startRho, a.endRho),
        endRho: Math.max(a.startRho, a.endRho)
      };
      d = Ext.callback(
        a.renderer,
        null,
        [e, g, e.getRendererData(), e.getRendererIndex()],
        0,
        e.getSeries()
      );
      e.setAttributes(d);
      e.useAttributes(c, f);
    }
    e.callParent([b, c, f]);
    if (a.label && e.getMarker("labels")) {
      e.placeLabel();
    }
  },
  placeLabel: function () {
    var z = this,
      s = z.attr,
      r = s.attributeId,
      t = Math.min(s.startAngle, s.endAngle),
      p = Math.max(s.startAngle, s.endAngle),
      k = (t + p) * 0.5,
      n = s.margin,
      h = s.centerX,
      g = s.centerY,
      f = Math.sin(k),
      c = Math.cos(k),
      v = Math.min(s.startRho, s.endRho) + n,
      m = Math.max(s.startRho, s.endRho) + n,
      l = (v + m) * 0.5,
      b = z.surfaceMatrix,
      o = z.labelCfg || (z.labelCfg = {}),
      e = z.getMarker("labels"),
      d = e.getTemplate(),
      a = d.getCalloutLine(),
      u,
      j,
      i,
      A,
      w,
      q;
    if (a) {
      q = a.length || 40;
    } else {
      q = 0;
    }
    b.appendMatrix(s.matrix);
    o.text = s.label;
    j = h + c * l;
    i = g + f * l;
    o.x = b.x(j, i);
    o.y = b.y(j, i);
    j = h + c * m;
    i = g + f * m;
    o.calloutStartX = b.x(j, i);
    o.calloutStartY = b.y(j, i);
    j = h + c * (m + q);
    i = g + f * (m + q);
    o.calloutPlaceX = b.x(j, i);
    o.calloutPlaceY = b.y(j, i);
    if (!s.rotateLabels) {
      o.rotationRads = 0;
    } else {
      switch (d.attr.orientation) {
        case "horizontal":
          o.rotationRads =
            k +
            Math.atan2(b.y(1, 0) - b.y(0, 0), b.x(1, 0) - b.x(0, 0)) +
            Math.PI / 2;
          break;
        case "vertical":
          o.rotationRads =
            k + Math.atan2(b.y(1, 0) - b.y(0, 0), b.x(1, 0) - b.x(0, 0));
          break;
      }
    }
    o.calloutColor = (a && a.color) || z.attr.fillStyle;
    if (a) {
      if (a.width) {
        o.calloutWidth = a.width;
      }
    } else {
      o.calloutColor = "none";
    }
    o.globalAlpha = s.globalAlpha * s.fillOpacity;
    if (d.display !== "none") {
      o.hidden = s.startAngle == s.endAngle;
    }
    if (d.attr.renderer) {
      w = [z.attr.label, e, o, z.getRendererData(), z.getRendererIndex()];
      A = Ext.callback(d.attr.renderer, null, w, 0, z.getSeries());
      if (typeof A === "string") {
        o.text = A;
      } else {
        Ext.apply(o, A);
      }
    }
    z.putMarker("labels", o, r);
    u = z.getMarkerBBox("labels", r, true);
    if (u) {
      if (s.doCallout) {
        if (d.attr.display === "outside") {
          z.putMarker("labels", { callout: 1 }, r);
        } else {
          if (d.attr.display === "inside") {
            z.putMarker("labels", { callout: 0 }, r);
          } else {
            z.putMarker(
              "labels",
              { callout: 1 - z.sliceContainsLabel(s, u) },
              r
            );
          }
        }
      } else {
        z.putMarker("labels", { globalAlpha: z.sliceContainsLabel(s, u) }, r);
      }
    }
  },
  sliceContainsLabel: function (d, f) {
    var e = d.labelOverflowPadding,
      h = (d.endRho + d.startRho) / 2,
      g = h + (f.width + e) / 2,
      i = h - (f.width + e) / 2,
      j,
      c,
      b,
      a;
    if (e < 0) {
      return 1;
    }
    if (f.width + e * 2 > d.endRho - d.startRho) {
      return 0;
    }
    c = Math.sqrt(d.endRho * d.endRho - g * g);
    b = Math.sqrt(d.endRho * d.endRho - i * i);
    j = Math.abs(d.endAngle - d.startAngle);
    a = j > Math.PI / 2 ? i : Math.abs(Math.tan(j / 2)) * i;
    if (f.height + e * 2 > Math.min(c, b, a) * 2) {
      return 0;
    }
    return 1;
  }
});
Ext.define("Ext.chart.series.Pie", {
  extend: "Ext.chart.series.Polar",
  requires: ["Ext.chart.series.sprite.PieSlice"],
  type: "pie",
  alias: "series.pie",
  seriesType: "pieslice",
  isPie: true,
  config: {
    donut: 0,
    rotation: 0,
    clockwise: true,
    totalAngle: 2 * Math.PI,
    hidden: [],
    radiusFactor: 100,
    highlightCfg: { margin: 20 },
    style: {}
  },
  directions: ["X"],
  applyLabel: function (a, b) {
    if (Ext.isObject(a) && !Ext.isString(a.orientation)) {
      Ext.apply((a = Ext.Object.chain(a)), { orientation: "vertical" });
    }
    return this.callParent([a, b]);
  },
  updateLabelData: function () {
    var h = this,
      j = h.getStore(),
      g = j.getData().items,
      e = h.getSprites(),
      a = h.getLabel().getTemplate().getField(),
      d = h.getHidden(),
      b,
      f,
      c,
      k;
    if (e.length && a) {
      c = [];
      for (b = 0, f = g.length; b < f; b++) {
        c.push(g[b].get(a));
      }
      for (b = 0, f = e.length; b < f; b++) {
        k = e[b];
        k.setAttributes({ label: c[b] });
        k.putMarker("labels", { hidden: d[b] }, k.attr.attributeId);
      }
    }
  },
  coordinateX: function () {
    var u = this,
      f = u.getStore(),
      r = f.getData().items,
      c = r.length,
      b = u.getXField(),
      e = u.getYField(),
      l,
      a = 0,
      m,
      k,
      t = 0,
      p = u.getHidden(),
      d = [],
      q,
      g = 0,
      h = u.getTotalAngle(),
      s = u.getClockwise() ? 1 : -1,
      j = u.getSprites(),
      n,
      o;
    if (!j) {
      return;
    }
    for (q = 0; q < c; q++) {
      l = Math.abs(Number(r[q].get(b))) || 0;
      k = (e && Math.abs(Number(r[q].get(e)))) || 0;
      if (!p[q]) {
        a += l;
        if (k > t) {
          t = k;
        }
      }
      d[q] = a;
      if (q >= p.length) {
        p[q] = false;
      }
    }
    p.length = c;
    u.maxY = t;
    if (a !== 0) {
      m = h / a;
    }
    for (q = 0; q < c; q++) {
      j[q].setAttributes({
        startAngle: g,
        endAngle: (g = m ? s * d[q] * m : 0),
        globalAlpha: 1
      });
    }
    if (c < u.sprites.length) {
      for (q = c; q < u.sprites.length; q++) {
        o = u.sprites[q];
        o.getMarker("labels").clear(o.getId());
        o.releaseMarker("labels");
        o.destroy();
      }
      u.sprites.length = c;
    }
    for (q = c; q < u.sprites.length; q++) {
      j[q].setAttributes({ startAngle: h, endAngle: h, globalAlpha: 0 });
    }
    n = u.getChart();
    if (!n.isConfiguring) {
      n.refreshLegendStore();
    }
  },
  updateCenter: function (a) {
    this.setStyle({
      translationX: a[0] + this.getOffsetX(),
      translationY: a[1] + this.getOffsetY()
    });
    this.doUpdateStyles();
  },
  updateRadius: function (a) {
    this.setStyle({
      startRho: a * this.getDonut() * 0.01,
      endRho: a * this.getRadiusFactor() * 0.01
    });
    this.doUpdateStyles();
  },
  getStyleByIndex: function (c) {
    var g = this,
      j = g.getStore(),
      k = j.getAt(c),
      f = g.getYField(),
      d = g.getRadius(),
      a = {},
      e,
      b,
      h;
    if (k) {
      h = (f && Math.abs(Number(k.get(f)))) || 0;
      e = d * g.getDonut() * 0.01;
      b = d * g.getRadiusFactor() * 0.01;
      a = g.callParent([c]);
      a.startRho = e;
      a.endRho = g.maxY ? e + ((b - e) * h) / g.maxY : b;
    }
    return a;
  },
  updateDonut: function (b) {
    var a = this.getRadius();
    this.setStyle({
      startRho: a * b * 0.01,
      endRho: a * this.getRadiusFactor() * 0.01
    });
    this.doUpdateStyles();
  },
  rotationOffset: -Math.PI / 2,
  updateRotation: function (a) {
    this.setStyle({ rotationRads: a + this.rotationOffset });
    this.doUpdateStyles();
  },
  updateTotalAngle: function (a) {
    this.processData();
  },
  getSprites: function () {
    var k = this,
      h = k.getChart(),
      n = k.getStore();
    if (!h || !n) {
      return [];
    }
    k.getColors();
    k.getSubStyle();
    var j = n.getData().items,
      b = j.length,
      d = k.getAnimation() || (h && h.getAnimation()),
      g = k.sprites,
      o,
      c = false,
      l = 0,
      m = k.getLabel(),
      a = m.getTemplate(),
      e,
      f;
    f = {
      store: n,
      field: k.getXField(),
      angleField: k.getXField(),
      radiusField: k.getYField(),
      series: k
    };
    for (e = 0; e < b; e++) {
      o = g[e];
      if (!o) {
        o = k.createSprite();
        if (k.getHighlight()) {
          o.config.highlight = k.getHighlight();
          o.addModifier("highlight", true);
        }
        if (a.getField()) {
          a.setAttributes({
            labelOverflowPadding: k.getLabelOverflowPadding()
          });
          a.fx.setCustomDurations({ callout: 200 });
        }
        o.setAttributes(k.getStyleByIndex(e));
        o.setRendererData(f);
        c = true;
      }
      o.setRendererIndex(l++);
      o.setAnimation(d);
    }
    if (c) {
      k.doUpdateStyles();
    }
    return k.sprites;
  },
  betweenAngle: function (d, f, c) {
    var e = Math.PI * 2,
      g = this.rotationOffset;
    if (f === c) {
      return false;
    }
    if (!this.getClockwise()) {
      d *= -1;
      f *= -1;
      c *= -1;
      f -= g;
      c -= g;
    } else {
      f += g;
      c += g;
    }
    d -= f;
    c -= f;
    d %= e;
    c %= e;
    d += e;
    c += e;
    d %= e;
    c %= e;
    return d < c || Ext.Number.isEqual(c, 0, 1e-8);
  },
  getItemByIndex: function (a, b) {
    b = b || "sprites";
    return this.callParent([a, b]);
  },
  getItemForAngle: function (a) {
    var h = this,
      f = h.getSprites(),
      d;
    a %= Math.PI * 2;
    while (a < 0) {
      a += Math.PI * 2;
    }
    if (f) {
      var j = h.getStore(),
        g = j.getData().items,
        c = h.getHidden(),
        b = 0,
        e = j.getCount();
      for (; b < e; b++) {
        if (!c[b]) {
          d = f[b].attr;
          if (d.startAngle <= a && d.endAngle >= a) {
            return {
              series: h,
              sprite: f[b],
              index: b,
              record: g[b],
              field: h.getXField()
            };
          }
        }
      }
    }
    return null;
  },
  getItemForPoint: function (f, e) {
    var t = this,
      c = t.getSprites();
    if (c) {
      var s = t.getCenter(),
        q = t.getOffsetX(),
        p = t.getOffsetY(),
        j = f - s[0] + q,
        h = e - s[1] + p,
        b = t.getStore(),
        g = t.getDonut(),
        o = b.getData().items,
        r = Math.atan2(h, j) - t.getRotation(),
        a = Math.sqrt(j * j + h * h),
        l = t.getRadius() * g * 0.01,
        m = t.getHidden(),
        n,
        d,
        k;
      for (n = 0, d = o.length; n < d; n++) {
        if (!m[n]) {
          k = c[n].attr;
          if (a >= l + k.margin && a <= k.endRho + k.margin) {
            if (t.betweenAngle(r, k.startAngle, k.endAngle)) {
              return {
                series: t,
                sprite: c[n],
                index: n,
                record: o[n],
                field: t.getXField()
              };
            }
          }
        }
      }
      return null;
    }
  },
  provideLegendInfo: function (f) {
    var h = this,
      j = h.getStore();
    if (j) {
      var g = j.getData().items,
        b = h.getLabel().getTemplate().getField(),
        c = h.getXField(),
        e = h.getHidden(),
        d,
        a,
        k;
      for (d = 0; d < g.length; d++) {
        a = h.getStyleByIndex(d);
        k = a.fillStyle;
        if (Ext.isObject(k)) {
          k = k.stops && k.stops[0].color;
        }
        f.push({
          name: b ? String(g[d].get(b)) : c + " " + d,
          mark: k || a.strokeStyle || "black",
          disabled: e[d],
          series: h.getId(),
          index: d
        });
      }
    }
  }
});
Ext.define("Ext.chart.series.sprite.Pie3DPart", {
  extend: "Ext.draw.sprite.Path",
  mixins: { markerHolder: "Ext.chart.MarkerHolder" },
  alias: "sprite.pie3dPart",
  inheritableStatics: {
    def: {
      processors: {
        centerX: "number",
        centerY: "number",
        startAngle: "number",
        endAngle: "number",
        startRho: "number",
        endRho: "number",
        margin: "number",
        thickness: "number",
        bevelWidth: "number",
        distortion: "number",
        baseColor: "color",
        colorSpread: "number",
        baseRotation: "number",
        part: "enums(top,bottom,start,end,innerFront,innerBack,outerFront,outerBack)",
        label: "string"
      },
      aliases: { rho: "endRho" },
      triggers: {
        centerX: "path,bbox",
        centerY: "path,bbox",
        startAngle: "path,partZIndex",
        endAngle: "path,partZIndex",
        startRho: "path",
        endRho: "path,bbox",
        margin: "path,bbox",
        thickness: "path",
        distortion: "path",
        baseRotation: "path,partZIndex",
        baseColor: "partZIndex,partColor",
        colorSpread: "partColor",
        part: "path,partZIndex",
        globalAlpha: "canvas,alpha",
        fillOpacity: "canvas,alpha"
      },
      defaults: {
        centerX: 0,
        centerY: 0,
        startAngle: Math.PI * 2,
        endAngle: Math.PI * 2,
        startRho: 0,
        endRho: 150,
        margin: 0,
        thickness: 35,
        distortion: 0.5,
        baseRotation: 0,
        baseColor: "white",
        colorSpread: 1,
        miterLimit: 1,
        bevelWidth: 5,
        strokeOpacity: 0,
        part: "top",
        label: ""
      },
      updaters: {
        alpha: "alphaUpdater",
        partColor: "partColorUpdater",
        partZIndex: "partZIndexUpdater"
      }
    }
  },
  bevelParams: [],
  constructor: function (a) {
    this.callParent([a]);
    this.bevelGradient = new Ext.draw.gradient.Linear({
      stops: [
        { offset: 0, color: "rgba(255,255,255,0)" },
        { offset: 0.7, color: "rgba(255,255,255,0.6)" },
        { offset: 1, color: "rgba(255,255,255,0)" }
      ]
    });
  },
  alphaUpdater: function (a) {
    var f = this,
      e = a.globalAlpha,
      c = a.fillOpacity,
      b = f.oldOpacity,
      d = f.oldFillOpacity;
    if (
      (e !== b && (e === 1 || b === 1)) ||
      (c !== d && (c === 1 || d === 1))
    ) {
      f.scheduleUpdater(a, "path", ["globalAlpha"]);
      f.oldOpacity = e;
      f.oldFillOpacity = c;
    }
  },
  partColorUpdater: function (a) {
    var d = Ext.util.Color.fly(a.baseColor),
      b = d.toString(),
      e = a.colorSpread,
      c;
    switch (a.part) {
      case "top":
        c = new Ext.draw.gradient.Radial({
          start: { x: 0, y: 0, r: 0 },
          end: { x: 0, y: 0, r: 1 },
          stops: [
            { offset: 0, color: d.createLighter(0.1 * e) },
            { offset: 1, color: d.createDarker(0.1 * e) }
          ]
        });
        break;
      case "bottom":
        c = new Ext.draw.gradient.Radial({
          start: { x: 0, y: 0, r: 0 },
          end: { x: 0, y: 0, r: 1 },
          stops: [
            { offset: 0, color: d.createDarker(0.2 * e) },
            { offset: 1, color: d.toString() }
          ]
        });
        break;
      case "outerFront":
      case "outerBack":
        c = new Ext.draw.gradient.Linear({
          stops: [
            { offset: 0, color: d.createDarker(0.15 * e).toString() },
            { offset: 0.3, color: b },
            { offset: 0.8, color: d.createLighter(0.2 * e).toString() },
            { offset: 1, color: d.createDarker(0.25 * e).toString() }
          ]
        });
        break;
      case "start":
        c = new Ext.draw.gradient.Linear({
          stops: [
            { offset: 0, color: d.createDarker(0.1 * e).toString() },
            { offset: 1, color: d.createLighter(0.2 * e).toString() }
          ]
        });
        break;
      case "end":
        c = new Ext.draw.gradient.Linear({
          stops: [
            { offset: 0, color: d.createDarker(0.1 * e).toString() },
            { offset: 1, color: d.createLighter(0.2 * e).toString() }
          ]
        });
        break;
      case "innerFront":
      case "innerBack":
        c = new Ext.draw.gradient.Linear({
          stops: [
            { offset: 0, color: d.createDarker(0.1 * e).toString() },
            { offset: 0.2, color: d.createLighter(0.2 * e).toString() },
            { offset: 0.7, color: b },
            { offset: 1, color: d.createDarker(0.1 * e).toString() }
          ]
        });
        break;
    }
    a.fillStyle = c;
    a.canvasAttributes.fillStyle = c;
  },
  partZIndexUpdater: function (a) {
    var c = Ext.draw.sprite.AttributeParser.angle,
      e = a.baseRotation,
      d = a.startAngle,
      b = a.endAngle,
      f;
    switch (a.part) {
      case "top":
        a.zIndex = 6;
        break;
      case "outerFront":
        d = c(d + e);
        b = c(b + e);
        if (d >= 0 && b < 0) {
          f = Math.sin(d);
        } else {
          if (d <= 0 && b > 0) {
            f = Math.sin(b);
          } else {
            if (d >= 0 && b > 0) {
              if (d > b) {
                f = 0;
              } else {
                f = Math.max(Math.sin(d), Math.sin(b));
              }
            } else {
              f = 1;
            }
          }
        }
        a.zIndex = 4 + f;
        break;
      case "outerBack":
        a.zIndex = 1;
        break;
      case "start":
        a.zIndex = 4 + Math.sin(c(d + e));
        break;
      case "end":
        a.zIndex = 4 + Math.sin(c(b + e));
        break;
      case "innerFront":
        a.zIndex = 2;
        break;
      case "innerBack":
        a.zIndex = 4 + Math.sin(c((d + b) / 2 + e));
        break;
      case "bottom":
        a.zIndex = 0;
        break;
    }
    a.dirtyZIndex = true;
  },
  updatePlainBBox: function (k) {
    var f = this.attr,
      a = f.part,
      b = f.baseRotation,
      e = f.centerX,
      d = f.centerY,
      j,
      c,
      i,
      h,
      g,
      l;
    if (a === "start") {
      c = f.startAngle + b;
    } else {
      if (a === "end") {
        c = f.endAngle + b;
      }
    }
    if (Ext.isNumber(c)) {
      g = Math.sin(c);
      l = Math.cos(c);
      i = Math.min(e + l * f.startRho, e + l * f.endRho);
      h = d + g * f.startRho * f.distortion;
      k.x = i;
      k.y = h;
      k.width = l * (f.endRho - f.startRho);
      k.height = f.thickness + g * (f.endRho - f.startRho) * 2;
      return;
    }
    if (a === "innerFront" || a === "innerBack") {
      j = f.startRho;
    } else {
      j = f.endRho;
    }
    k.width = j * 2;
    k.height = j * f.distortion * 2 + f.thickness;
    k.x = f.centerX - j;
    k.y = f.centerY - j * f.distortion;
  },
  updateTransformedBBox: function (a) {
    if (this.attr.part === "start" || this.attr.part === "end") {
      return this.callParent(arguments);
    }
    return this.updatePlainBBox(a);
  },
  updatePath: function (a) {
    if (!this.attr.globalAlpha) {
      return;
    }
    if (this.attr.endAngle < this.attr.startAngle) {
      return;
    }
    this[this.attr.part + "Renderer"](a);
  },
  render: function (b, c) {
    var d = this,
      a = d.attr;
    if (!a.globalAlpha || Ext.Number.isEqual(a.startAngle, a.endAngle, 1e-8)) {
      return;
    }
    d.callParent([b, c]);
    d.bevelRenderer(b, c);
    if (a.label && d.getMarker("labels")) {
      d.placeLabel();
    }
  },
  placeLabel: function () {
    var z = this,
      u = z.attr,
      t = u.attributeId,
      p = u.margin,
      c = u.distortion,
      i = u.centerX,
      h = u.centerY,
      j = u.baseRotation,
      v = u.startAngle + j,
      r = u.endAngle + j,
      m = (v + r) / 2,
      w = u.startRho + p,
      o = u.endRho + p,
      n = (w + o) / 2,
      a = Math.sin(m),
      b = Math.cos(m),
      e = z.surfaceMatrix,
      g = z.getMarker("labels"),
      f = g.getTemplate(),
      d = f.getCalloutLine(),
      s = (d && d.length) || 40,
      q = {},
      l,
      k;
    e.appendMatrix(u.matrix);
    q.text = u.label;
    l = i + b * n;
    k = h + a * n * c;
    q.x = e.x(l, k);
    q.y = e.y(l, k);
    l = i + b * o;
    k = h + a * o * c;
    q.calloutStartX = e.x(l, k);
    q.calloutStartY = e.y(l, k);
    l = i + b * (o + s);
    k = h + a * (o + s) * c;
    q.calloutPlaceX = e.x(l, k);
    q.calloutPlaceY = e.y(l, k);
    q.calloutWidth = 2;
    z.putMarker("labels", q, t);
    z.putMarker("labels", { callout: 1 }, t);
  },
  bevelRenderer: function (b, c) {
    var f = this,
      a = f.attr,
      e = a.bevelWidth,
      g = f.bevelParams,
      d;
    for (d = 0; d < g.length; d++) {
      c.beginPath();
      c.ellipse.apply(c, g[d]);
      c.save();
      c.lineWidth = e;
      c.strokeOpacity = e ? 1 : 0;
      c.strokeGradient = f.bevelGradient;
      c.stroke(a);
      c.restore();
    }
  },
  lidRenderer: function (o, m) {
    var k = this.attr,
      g = k.margin,
      c = k.distortion,
      i = k.centerX,
      h = k.centerY,
      f = k.baseRotation,
      j = k.startAngle + f,
      e = k.endAngle + f,
      d = (j + e) / 2,
      l = k.startRho,
      b = k.endRho,
      n = Math.sin(e),
      a = Math.cos(e);
    i += Math.cos(d) * g;
    h += Math.sin(d) * g * c;
    o.ellipse(i, h + m, l, l * c, 0, j, e, false);
    o.lineTo(i + a * b, h + m + n * b * c);
    o.ellipse(i, h + m, b, b * c, 0, e, j, true);
    o.closePath();
  },
  topRenderer: function (a) {
    this.lidRenderer(a, 0);
  },
  bottomRenderer: function (c) {
    var a = this.attr,
      b = Ext.util.Color.RGBA_NONE;
    if (a.globalAlpha < 1 || a.fillOpacity < 1 || a.shadowColor !== b) {
      this.lidRenderer(c, a.thickness);
    }
  },
  sideRenderer: function (m, t) {
    var p = this.attr,
      l = p.margin,
      h = p.centerX,
      g = p.centerY,
      e = p.distortion,
      i = p.baseRotation,
      q = p.startAngle + i,
      n = p.endAngle + i,
      f = !p.startAngle && Ext.Number.isEqual(Math.PI * 2, p.endAngle, 1e-7),
      b = p.thickness,
      r = p.startRho,
      k = p.endRho,
      s = (t === "start" && q) || (t === "end" && n),
      c = Math.sin(s),
      d = Math.cos(s),
      a = p.globalAlpha < 1,
      o = (t === "start" && d < 0) || (t === "end" && d > 0) || a,
      j;
    if (o && !f) {
      j = (q + n) / 2;
      h += Math.cos(j) * l;
      g += Math.sin(j) * l * e;
      m.moveTo(h + d * r, g + c * r * e);
      m.lineTo(h + d * k, g + c * k * e);
      m.lineTo(h + d * k, g + c * k * e + b);
      m.lineTo(h + d * r, g + c * r * e + b);
      m.closePath();
    }
  },
  startRenderer: function (a) {
    this.sideRenderer(a, "start");
  },
  endRenderer: function (a) {
    this.sideRenderer(a, "end");
  },
  rimRenderer: function (q, e, o, j) {
    var w = this,
      s = w.attr,
      p = s.margin,
      h = s.centerX,
      g = s.centerY,
      d = s.distortion,
      i = s.baseRotation,
      t = Ext.draw.sprite.AttributeParser.angle,
      u = s.startAngle + i,
      r = s.endAngle + i,
      k = t((u + r) / 2),
      a = s.thickness,
      b = s.globalAlpha < 1,
      c,
      n,
      v;
    w.bevelParams = [];
    u = t(u);
    r = t(r);
    h += Math.cos(k) * p;
    g += Math.sin(k) * p * d;
    c = u >= 0 && r >= 0;
    n = u <= 0 && r <= 0;
    function l() {
      q.ellipse(h, g + a, e, e * d, 0, Math.PI, u, true);
      q.lineTo(h + Math.cos(u) * e, g + Math.sin(u) * e * d);
      v = [h, g, e, e * d, 0, u, Math.PI, false];
      if (!o) {
        w.bevelParams.push(v);
      }
      q.ellipse.apply(q, v);
      q.closePath();
    }
    function f() {
      q.ellipse(h, g + a, e, e * d, 0, 0, r, false);
      q.lineTo(h + Math.cos(r) * e, g + Math.sin(r) * e * d);
      v = [h, g, e, e * d, 0, r, 0, true];
      if (!o) {
        w.bevelParams.push(v);
      }
      q.ellipse.apply(q, v);
      q.closePath();
    }
    function x() {
      q.ellipse(h, g + a, e, e * d, 0, Math.PI, r, false);
      q.lineTo(h + Math.cos(r) * e, g + Math.sin(r) * e * d);
      v = [h, g, e, e * d, 0, r, Math.PI, true];
      if (o) {
        w.bevelParams.push(v);
      }
      q.ellipse.apply(q, v);
      q.closePath();
    }
    function m() {
      q.ellipse(h, g + a, e, e * d, 0, u, 0, false);
      q.lineTo(h + e, g);
      v = [h, g, e, e * d, 0, 0, u, true];
      if (o) {
        w.bevelParams.push(v);
      }
      q.ellipse.apply(q, v);
      q.closePath();
    }
    if (j) {
      if (!o || b) {
        if (u >= 0 && r < 0) {
          l();
        } else {
          if (u <= 0 && r > 0) {
            f();
          } else {
            if (u <= 0 && r < 0) {
              if (u > r) {
                q.ellipse(h, g + a, e, e * d, 0, 0, Math.PI, false);
                q.lineTo(h - e, g);
                v = [h, g, e, e * d, 0, Math.PI, 0, true];
                if (!o) {
                  w.bevelParams.push(v);
                }
                q.ellipse.apply(q, v);
                q.closePath();
              }
            } else {
              if (u > r) {
                l();
                f();
              } else {
                v = [h, g, e, e * d, 0, u, r, false];
                if ((c && !o) || (n && o)) {
                  w.bevelParams.push(v);
                }
                q.ellipse.apply(q, v);
                q.lineTo(h + Math.cos(r) * e, g + Math.sin(r) * e * d + a);
                q.ellipse(h, g + a, e, e * d, 0, r, u, true);
                q.closePath();
              }
            }
          }
        }
      }
    } else {
      if (o || b) {
        if (u >= 0 && r < 0) {
          x();
        } else {
          if (u <= 0 && r > 0) {
            m();
          } else {
            if (u <= 0 && r < 0) {
              if (u > r) {
                x();
                m();
              } else {
                q.ellipse(h, g + a, e, e * d, 0, u, r, false);
                q.lineTo(h + Math.cos(r) * e, g + Math.sin(r) * e * d);
                v = [h, g, e, e * d, 0, r, u, true];
                if (o) {
                  w.bevelParams.push(v);
                }
                q.ellipse.apply(q, v);
                q.closePath();
              }
            } else {
              if (u > r) {
                q.ellipse(h, g + a, e, e * d, 0, -Math.PI, 0, false);
                q.lineTo(h + e, g);
                v = [h, g, e, e * d, 0, 0, -Math.PI, true];
                if (o) {
                  w.bevelParams.push(v);
                }
                q.ellipse.apply(q, v);
                q.closePath();
              }
            }
          }
        }
      }
    }
  },
  innerFrontRenderer: function (a) {
    this.rimRenderer(a, this.attr.startRho, true, true);
  },
  innerBackRenderer: function (a) {
    this.rimRenderer(a, this.attr.startRho, true, false);
  },
  outerFrontRenderer: function (a) {
    this.rimRenderer(a, this.attr.endRho, false, true);
  },
  outerBackRenderer: function (a) {
    this.rimRenderer(a, this.attr.endRho, false, false);
  }
});
Ext.define(
  "Ext.chart.series.Pie3D",
  {
    extend: "Ext.chart.series.Polar",
    requires: ["Ext.chart.series.sprite.Pie3DPart", "Ext.draw.PathUtil"],
    type: "pie3d",
    seriesType: "pie3d",
    alias: "series.pie3d",
    is3D: true,
    config: {
      rect: [0, 0, 0, 0],
      thickness: 35,
      distortion: 0.5,
      donut: false,
      hidden: [],
      highlightCfg: { margin: 20 },
      shadow: false
    },
    rotationOffset: -Math.PI / 2,
    setField: function (a) {
      return this.setXField(a);
    },
    getField: function () {
      return this.getXField();
    },
    updateRotation: function (a) {
      this.setStyle({ baseRotation: a + this.rotationOffset });
      this.doUpdateStyles();
    },
    updateDistortion: function () {
      this.setRadius();
    },
    updateThickness: function () {
      this.setRadius();
    },
    updateColors: function (a) {
      this.setSubStyle({ baseColor: a });
    },
    applyShadow: function (a) {
      if (a === true) {
        a = { shadowColor: "rgba(0,0,0,0.8)", shadowBlur: 30 };
      } else {
        if (!Ext.isObject(a)) {
          a = { shadowColor: Ext.util.Color.RGBA_NONE };
        }
      }
      return a;
    },
    updateShadow: function (g) {
      var e = this,
        f = e.getSprites(),
        d = e.spritesPerSlice,
        c = f && f.length,
        b,
        a;
      for (b = 1; b < c; b += d) {
        a = f[b];
        if ((a.attr.part = "bottom")) {
          a.setAttributes(g);
        }
      }
    },
    getStyleByIndex: function (b) {
      var d = this.callParent([b]),
        c = this.getStyle(),
        a = d.fillStyle || d.fill || d.color,
        e = c.strokeStyle || c.stroke;
      if (a) {
        d.baseColor = a;
        delete d.fillStyle;
        delete d.fill;
        delete d.color;
      }
      if (e) {
        d.strokeStyle = e;
      }
      return d;
    },
    doUpdateStyles: function () {
      var g = this,
        h = g.getSprites(),
        f = g.spritesPerSlice,
        e = h && h.length,
        c = 0,
        b = 0,
        a,
        d;
      for (; c < e; c += f, b++) {
        d = g.getStyleByIndex(b);
        for (a = 0; a < f; a++) {
          h[c + a].setAttributes(d);
        }
      }
    },
    coordinateX: function () {
      var w = this,
        m = w.getChart(),
        u = m && m.getAnimation(),
        f = w.getStore(),
        t = f.getData().items,
        d = t.length,
        b = w.getXField(),
        p = w.getRotation(),
        s = w.getHidden(),
        n,
        c = 0,
        h,
        e = [],
        k = w.getSprites(),
        a = k.length,
        l = w.spritesPerSlice,
        g = 0,
        o = Math.PI * 2,
        v = 1e-10,
        r,
        q;
      for (r = 0; r < d; r++) {
        n = Math.abs(Number(t[r].get(b))) || 0;
        if (!s[r]) {
          c += n;
        }
        e[r] = c;
        if (r >= s.length) {
          s[r] = false;
        }
      }
      s.length = d;
      if (c === 0) {
        return;
      }
      h = (2 * Math.PI) / c;
      for (r = 0; r < d; r++) {
        e[r] *= h;
      }
      for (r = 0; r < a; r++) {
        k[r].setAnimation(u);
      }
      for (r = 0; r < d; r++) {
        for (q = 0; q < l; q++) {
          k[r * l + q].setAttributes({
            startAngle: g,
            endAngle: e[r] - v,
            globalAlpha: 1,
            baseRotation: p
          });
        }
        g = e[r];
      }
      for (r *= l; r < a; r++) {
        k[r].setAnimation(u);
        k[r].setAttributes({
          startAngle: o,
          endAngle: o,
          globalAlpha: 0,
          baseRotation: p
        });
      }
    },
    updateLabelData: function () {
      var l = this,
        m = l.getStore(),
        k = m.getData().items,
        h = l.getSprites(),
        b = l.getLabel().getTemplate().getField(),
        f = l.getHidden(),
        a = l.spritesPerSlice,
        d,
        c,
        g,
        e,
        n;
      if (h.length && b) {
        e = [];
        for (d = 0, g = k.length; d < g; d++) {
          e.push(k[d].get(b));
        }
        for (d = 0, c = 0, g = h.length; d < g; d += a, c++) {
          n = h[d];
          n.setAttributes({ label: e[c] });
          n.putMarker("labels", { hidden: f[c] }, n.attr.attributeId);
        }
      }
    },
    applyRadius: function () {
      var f = this,
        d = f.getChart(),
        h = d.getInnerPadding(),
        e = d.getMainRect() || [0, 0, 1, 1],
        c = e[2] - h * 2,
        a = e[3] - h * 2 - f.getThickness(),
        g = c / 2,
        b = g * f.getDistortion();
      if (b > a / 2) {
        return a / (f.getDistortion() * 2);
      } else {
        return g;
      }
    },
    getSprites: function () {
      var y = this,
        e = y.getStore();
      if (!e) {
        return [];
      }
      var n = y.getChart(),
        p = y.getSurface(),
        t = e.getData().items,
        l = y.spritesPerSlice,
        a = t.length,
        v = y.getAnimation() || (n && n.getAnimation()),
        x = y.getCenter(),
        w = y.getOffsetX(),
        u = y.getOffsetY(),
        b = y.getRadius(),
        q = y.getRotation(),
        d = y.getHighlight(),
        c = {
          centerX: x[0] + w,
          centerY: x[1] + u - y.getThickness() / 2,
          endRho: b,
          startRho: (b * y.getDonut()) / 100,
          thickness: y.getThickness(),
          distortion: y.getDistortion()
        },
        k = y.sprites,
        h = y.getLabel(),
        f = h.getTemplate(),
        m,
        g,
        o,
        s,
        r;
      for (s = 0; s < a; s++) {
        g = Ext.apply({}, this.getStyleByIndex(s), c);
        if (!k[s * l]) {
          for (r = 0; r < y.partNames.length; r++) {
            o = p.add({ type: "pie3dPart", part: y.partNames[r] });
            if (r === 0 && f.getField()) {
              o.bindMarker("labels", h);
            }
            o.fx.setDurationOn("baseRotation", q);
            if (d) {
              o.config.highlight = d;
              o.addModifier("highlight", true);
            }
            o.setAttributes(g);
            k.push(o);
          }
        } else {
          m = k.slice(s * l, (s + 1) * l);
          for (r = 0; r < m.length; r++) {
            o = m[r];
            if (v) {
              o.setAnimation(v);
            }
            o.setAttributes(g);
          }
        }
      }
      return k;
    },
    betweenAngle: function (d, f, c) {
      var e = Math.PI * 2,
        g = this.rotationOffset;
      f += g;
      c += g;
      d -= f;
      c -= f;
      d %= e;
      c %= e;
      d += e;
      c += e;
      d %= e;
      c %= e;
      return d < c || c === 0;
    },
    getItemForPoint: function (k, j) {
      var h = this,
        g = h.getSprites();
      if (g) {
        var l = h.getStore(),
          b = l.getData().items,
          a = h.spritesPerSlice,
          e = h.getHidden(),
          c,
          f,
          m,
          d;
        for (c = 0, f = b.length; c < f; c++) {
          if (!e[c]) {
            d = c * a;
            m = g[d];
            if (m.hitTest([k, j])) {
              return {
                series: h,
                sprite: g.slice(d, d + a),
                index: c,
                record: b[c],
                category: "sprites",
                field: h.getXField()
              };
            }
          }
        }
        return null;
      }
    },
    provideLegendInfo: function (f) {
      var h = this,
        k = h.getStore();
      if (k) {
        var g = k.getData().items,
          b = h.getLabel().getTemplate().getField(),
          j = h.getField(),
          e = h.getHidden(),
          d,
          a,
          c;
        for (d = 0; d < g.length; d++) {
          a = h.getStyleByIndex(d);
          c = a.baseColor;
          f.push({
            name: b ? String(g[d].get(b)) : j + " " + d,
            mark: c || "black",
            disabled: e[d],
            series: h.getId(),
            index: d
          });
        }
      }
    }
  },
  function () {
    var b = this.prototype,
      a =
        Ext.chart.series.sprite.Pie3DPart.def.getInitialConfig().processors
          .part;
    b.partNames = a.replace(/^enums\(|\)/g, "").split(",");
    b.spritesPerSlice = b.partNames.length;
  }
);
Ext.define("Ext.chart.series.sprite.Polar", {
  extend: "Ext.chart.series.sprite.Series",
  inheritableStatics: {
    def: {
      processors: {
        centerX: "number",
        centerY: "number",
        startAngle: "number",
        endAngle: "number",
        startRho: "number",
        endRho: "number",
        baseRotation: "number",
        labels: "default",
        labelOverflowPadding: "number"
      },
      defaults: {
        centerX: 0,
        centerY: 0,
        startAngle: 0,
        endAngle: Math.PI,
        startRho: 0,
        endRho: 150,
        baseRotation: 0,
        labels: null,
        labelOverflowPadding: 10
      },
      triggers: {
        centerX: "bbox",
        centerY: "bbox",
        startAngle: "bbox",
        endAngle: "bbox",
        startRho: "bbox",
        endRho: "bbox",
        baseRotation: "bbox"
      }
    }
  },
  updatePlainBBox: function (b) {
    var a = this.attr;
    b.x = a.centerX - a.endRho;
    b.y = a.centerY + a.endRho;
    b.width = a.endRho * 2;
    b.height = a.endRho * 2;
  }
});
Ext.define("Ext.chart.series.sprite.Radar", {
  alias: "sprite.radar",
  extend: "Ext.chart.series.sprite.Polar",
  getDataPointXY: function (d) {
    var u = this,
      n = u.attr,
      f = n.centerX,
      e = n.centerY,
      o = n.matrix,
      t = n.dataMinX,
      s = n.dataMaxX,
      k = n.dataX,
      j = n.dataY,
      l = n.endRho,
      p = n.startRho,
      g = n.baseRotation,
      i,
      h,
      m,
      c,
      b,
      a,
      q;
    if (n.rangeY) {
      q = n.rangeY[1];
    } else {
      q = n.dataMaxY;
    }
    c = ((k[d] - t) / (s - t + 1)) * 2 * Math.PI + g;
    m = (j[d] / q) * (l - p) + p;
    b = f + Math.cos(c) * m;
    a = e + Math.sin(c) * m;
    i = o.x(b, a);
    h = o.y(b, a);
    return [i, h];
  },
  render: function (a, l) {
    var h = this,
      f = h.attr,
      g = f.dataX,
      b = g.length,
      e = h.surfaceMatrix,
      d = {},
      c,
      k,
      j,
      m;
    l.beginPath();
    for (c = 0; c < b; c++) {
      m = h.getDataPointXY(c);
      k = m[0];
      j = m[1];
      if (c === 0) {
        l.moveTo(k, j);
      }
      l.lineTo(k, j);
      d.translationX = e.x(k, j);
      d.translationY = e.y(k, j);
      h.putMarker("markers", d, c, true);
    }
    l.closePath();
    l.fillStroke(f);
  }
});
Ext.define("Ext.chart.series.Radar", {
  extend: "Ext.chart.series.Polar",
  type: "radar",
  seriesType: "radar",
  alias: "series.radar",
  requires: ["Ext.chart.series.sprite.Radar"],
  themeColorCount: function () {
    return 1;
  },
  isStoreDependantColorCount: false,
  themeMarkerCount: function () {
    return 1;
  },
  updateAngularAxis: function (a) {
    a.processData(this);
  },
  updateRadialAxis: function (a) {
    a.processData(this);
  },
  coordinateX: function () {
    return this.coordinate("X", 0, 2);
  },
  coordinateY: function () {
    return this.coordinate("Y", 1, 2);
  },
  updateCenter: function (a) {
    this.setStyle({
      translationX: a[0] + this.getOffsetX(),
      translationY: a[1] + this.getOffsetY()
    });
    this.doUpdateStyles();
  },
  updateRadius: function (a) {
    this.setStyle({ endRho: a });
    this.doUpdateStyles();
  },
  updateRotation: function (a) {
    this.setStyle({ rotationRads: a });
    this.doUpdateStyles();
  },
  updateTotalAngle: function (a) {
    this.processData();
  },
  getItemForPoint: function (k, j) {
    var h = this,
      m = h.sprites && h.sprites[0],
      f = m.attr,
      g = f.dataX,
      a = g.length,
      l = h.getStore(),
      e = h.getMarker(),
      b,
      o,
      p,
      d,
      n,
      c;
    if (h.getHidden()) {
      return null;
    }
    if (m && e) {
      c = m.getMarker("markers");
      for (d = 0; d < a; d++) {
        n = c.getBBoxFor(d);
        b = (n.width + n.height) * 0.25;
        p = m.getDataPointXY(d);
        if (Math.abs(p[0] - k) < b && Math.abs(p[1] - j) < b) {
          o = {
            series: h,
            sprite: m,
            index: d,
            category: "markers",
            record: l.getData().items[d],
            field: h.getYField()
          };
          return o;
        }
      }
    }
    return h.callParent(arguments);
  },
  getDefaultSpriteConfig: function () {
    var a = this.callParent(),
      b = {
        customDurations: {
          translationX: 0,
          translationY: 0,
          rotationRads: 0,
          dataMinX: 0,
          dataMaxX: 0
        }
      };
    if (a.fx) {
      Ext.apply(a.fx, b);
    } else {
      a.fx = b;
    }
    return a;
  },
  getSprites: function () {
    var d = this,
      c = d.getChart(),
      e = d.getAnimation() || (c && c.getAnimation()),
      b = d.sprites[0],
      a;
    if (!c) {
      return [];
    }
    if (!b) {
      b = d.createSprite();
    }
    if (e) {
      a = b.getMarker("markers");
      if (a) {
        a.getTemplate().setAnimation(e);
      }
      b.setAnimation(e);
    }
    return d.sprites;
  },
  provideLegendInfo: function (d) {
    var b = this,
      a = b.getSubStyleWithTheme(),
      c = a.fillStyle;
    if (Ext.isArray(c)) {
      c = c[0];
    }
    d.push({
      name: b.getTitle() || b.getYField() || b.getId(),
      mark:
        (Ext.isObject(c) ? c.stops && c.stops[0].color : c) ||
        a.strokeStyle ||
        "black",
      disabled: b.getHidden(),
      series: b.getId(),
      index: 0
    });
  }
});
Ext.define("Ext.chart.series.sprite.Scatter", {
  alias: "sprite.scatterSeries",
  extend: "Ext.chart.series.sprite.Cartesian",
  renderClipped: function (r, s, w, u) {
    if (this.cleanRedraw) {
      return;
    }
    var C = this,
      q = C.attr,
      l = q.dataX,
      h = q.dataY,
      z = q.labels,
      j = C.getSeries(),
      b = z && C.getMarker("labels"),
      t = C.attr.matrix,
      c = t.getXX(),
      p = t.getYY(),
      m = t.getDX(),
      k = t.getDY(),
      n = {},
      D,
      B,
      d = r.getInherited().rtl && !q.flipXY ? -1 : 1,
      a,
      A,
      o,
      e,
      g,
      f,
      v;
    if (q.flipXY) {
      a = u[1] - c * d;
      A = u[1] + u[3] + c * d;
      o = u[0] - p;
      e = u[0] + u[2] + p;
    } else {
      a = u[0] - c * d;
      A = u[0] + u[2] + c * d;
      o = u[1] - p;
      e = u[1] + u[3] + p;
    }
    for (v = 0; v < l.length; v++) {
      g = l[v];
      f = h[v];
      g = g * c + m;
      f = f * p + k;
      if (a <= g && g <= A && o <= f && f <= e) {
        if (q.renderer) {
          n = { type: "items", translationX: g, translationY: f };
          B = [C, n, { store: C.getStore() }, v];
          D = Ext.callback(q.renderer, null, B, 0, j);
          n = Ext.apply(n, D);
        } else {
          n.translationX = g;
          n.translationY = f;
        }
        C.putMarker("items", n, v, !q.renderer);
        if (b && z[v]) {
          C.drawLabel(z[v], g, f, v, u);
        }
      }
    }
  },
  drawLabel: function (j, h, g, p, a) {
    var r = this,
      m = r.attr,
      d = r.getMarker("labels"),
      c = d.getTemplate(),
      l = r.labelCfg || (r.labelCfg = {}),
      b = r.surfaceMatrix,
      f,
      e,
      i = m.labelOverflowPadding,
      o = m.flipXY,
      k,
      n,
      s,
      q;
    l.text = j;
    n = r.getMarkerBBox("labels", p, true);
    if (!n) {
      r.putMarker("labels", l, p);
      n = r.getMarkerBBox("labels", p, true);
    }
    if (o) {
      l.rotationRads = Math.PI * 0.5;
    } else {
      l.rotationRads = 0;
    }
    k = n.height / 2;
    f = h;
    switch (c.attr.display) {
      case "under":
        e = g - k - i;
        break;
      case "rotate":
        f += i;
        e = g - i;
        l.rotationRads = -Math.PI / 4;
        break;
      default:
        e = g + k + i;
    }
    l.x = b.x(f, e);
    l.y = b.y(f, e);
    if (c.attr.renderer) {
      q = [j, d, l, { store: r.getStore() }, p];
      s = Ext.callback(c.attr.renderer, null, q, 0, r.getSeries());
      if (typeof s === "string") {
        l.text = s;
      } else {
        Ext.apply(l, s);
      }
    }
    r.putMarker("labels", l, p);
  }
});
Ext.define("Ext.chart.series.Scatter", {
  extend: "Ext.chart.series.Cartesian",
  alias: "series.scatter",
  type: "scatter",
  seriesType: "scatterSeries",
  requires: ["Ext.chart.series.sprite.Scatter"],
  config: {
    itemInstancing: {
      fx: { customDurations: { translationX: 0, translationY: 0 } }
    }
  },
  themeMarkerCount: function () {
    return 1;
  },
  applyMarker: function (b, a) {
    this.getItemInstancing();
    this.setItemInstancing(b);
    return this.callParent(arguments);
  },
  provideLegendInfo: function (d) {
    var b = this,
      a = b.getMarkerStyleByIndex(0),
      c = a.fillStyle;
    d.push({
      name: b.getTitle() || b.getYField() || b.getId(),
      mark:
        (Ext.isObject(c) ? c.stops && c.stops[0].color : c) ||
        a.strokeStyle ||
        "black",
      disabled: b.getHidden(),
      series: b.getId(),
      index: 0
    });
  }
});
Ext.define("Ext.chart.theme.Blue", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.blue", "chart.theme.Blue"],
  config: { baseColor: "#4d7fe6" }
});
Ext.define("Ext.chart.theme.BlueGradients", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.blue-gradients", "chart.theme.Blue:gradients"],
  config: { baseColor: "#4d7fe6", gradients: { type: "linear", degrees: 90 } }
});
Ext.define("Ext.chart.theme.Category1", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.category1", "chart.theme.Category1"],
  config: { colors: ["#f0a50a", "#c20024", "#2044ba", "#810065", "#7eae29"] }
});
Ext.define("Ext.chart.theme.Category1Gradients", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.category1-gradients", "chart.theme.Category1:gradients"],
  config: {
    colors: ["#f0a50a", "#c20024", "#2044ba", "#810065", "#7eae29"],
    gradients: { type: "linear", degrees: 90 }
  }
});
Ext.define("Ext.chart.theme.Category2", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.category2", "chart.theme.Category2"],
  config: { colors: ["#6d9824", "#87146e", "#2a9196", "#d39006", "#1e40ac"] }
});
Ext.define("Ext.chart.theme.Category2Gradients", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.category2-gradients", "chart.theme.Category2:gradients"],
  config: {
    colors: ["#6d9824", "#87146e", "#2a9196", "#d39006", "#1e40ac"],
    gradients: { type: "linear", degrees: 90 }
  }
});
Ext.define("Ext.chart.theme.Category3", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.category3", "chart.theme.Category3"],
  config: { colors: ["#fbbc29", "#ce2e4e", "#7e0062", "#158b90", "#57880e"] }
});
Ext.define("Ext.chart.theme.Category3Gradients", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.category3-gradients", "chart.theme.Category3:gradients"],
  config: {
    colors: ["#fbbc29", "#ce2e4e", "#7e0062", "#158b90", "#57880e"],
    gradients: { type: "linear", degrees: 90 }
  }
});
Ext.define("Ext.chart.theme.Category4", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.category4", "chart.theme.Category4"],
  config: { colors: ["#ef5773", "#fcbd2a", "#4f770d", "#1d3eaa", "#9b001f"] }
});
Ext.define("Ext.chart.theme.Category4Gradients", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.category4-gradients", "chart.theme.Category4:gradients"],
  config: {
    colors: ["#ef5773", "#fcbd2a", "#4f770d", "#1d3eaa", "#9b001f"],
    gradients: { type: "linear", degrees: 90 }
  }
});
Ext.define("Ext.chart.theme.Category5", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.category5", "chart.theme.Category5"],
  config: { colors: ["#7eae29", "#fdbe2a", "#910019", "#27b4bc", "#d74dbc"] }
});
Ext.define("Ext.chart.theme.Category5Gradients", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.category5-gradients", "chart.theme.Category5:gradients"],
  config: {
    colors: ["#7eae29", "#fdbe2a", "#910019", "#27b4bc", "#d74dbc"],
    gradients: { type: "linear", degrees: 90 }
  }
});
Ext.define("Ext.chart.theme.Category6", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.category6", "chart.theme.Category6"],
  config: { colors: ["#44dce1", "#0b2592", "#996e05", "#7fb325", "#b821a1"] }
});
Ext.define("Ext.chart.theme.Category6Gradients", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.category6-gradients", "chart.theme.Category6:gradients"],
  config: {
    colors: ["#44dce1", "#0b2592", "#996e05", "#7fb325", "#b821a1"],
    gradients: { type: "linear", degrees: 90 }
  }
});
Ext.define("Ext.chart.theme.DefaultGradients", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.default-gradients", "chart.theme.Base:gradients"],
  config: { gradients: { type: "linear", degrees: 90 } }
});
Ext.define("Ext.chart.theme.Green", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.green", "chart.theme.Green"],
  config: { baseColor: "#b1da5a" }
});
Ext.define("Ext.chart.theme.GreenGradients", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.green-gradients", "chart.theme.Green:gradients"],
  config: { baseColor: "#b1da5a", gradients: { type: "linear", degrees: 90 } }
});
Ext.define("Ext.chart.theme.Midnight", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.midnight", "chart.theme.Midnight"],
  config: {
    colors: ["#A837FF", "#4AC0F2", "#FF4D35", "#FF8809", "#61C102", "#FF37EA"],
    chart: { defaults: { background: "rgb(52, 52, 53)" } },
    axis: {
      defaults: {
        style: { strokeStyle: "rgb(224, 224, 227)" },
        label: { fillStyle: "rgb(224, 224, 227)" },
        title: { fillStyle: "rgb(224, 224, 227)" },
        grid: { strokeStyle: "rgb(112, 112, 115)" }
      }
    },
    series: { defaults: { label: { fillStyle: "rgb(224, 224, 227)" } } },
    sprites: { text: { fillStyle: "rgb(224, 224, 227)" } },
    legend: {
      label: { fillStyle: "white" },
      border: {
        lineWidth: 2,
        fillStyle: "rgba(255, 255, 255, 0.3)",
        strokeStyle: "rgb(150, 150, 150)"
      },
      background: "rgb(52, 52, 53)"
    }
  }
});
Ext.define("Ext.chart.theme.Muted", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.muted", "chart.theme.Muted"],
  config: {
    colors: [
      "#8ca640",
      "#974144",
      "#4091ba",
      "#8e658e",
      "#3b8d8b",
      "#b86465",
      "#d2af69",
      "#6e8852",
      "#3dcc7e",
      "#a6bed1",
      "#cbaa4b",
      "#998baa"
    ]
  }
});
Ext.define("Ext.chart.theme.Purple", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.purple", "chart.theme.Purple"],
  config: { baseColor: "#da5abd" }
});
Ext.define("Ext.chart.theme.PurpleGradients", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.purple-gradients", "chart.theme.Purple:gradients"],
  config: { baseColor: "#da5abd", gradients: { type: "linear", degrees: 90 } }
});
Ext.define("Ext.chart.theme.Red", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.red", "chart.theme.Red"],
  config: { baseColor: "#e84b67" }
});
Ext.define("Ext.chart.theme.RedGradients", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.red-gradients", "chart.theme.Red:gradients"],
  config: { baseColor: "#e84b67", gradients: { type: "linear", degrees: 90 } }
});
Ext.define("Ext.chart.theme.Sky", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.sky", "chart.theme.Sky"],
  config: { baseColor: "#4ce0e7" }
});
Ext.define("Ext.chart.theme.SkyGradients", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.sky-gradients", "chart.theme.Sky:gradients"],
  config: { baseColor: "#4ce0e7", gradients: { type: "linear", degrees: 90 } }
});
Ext.define("Ext.chart.theme.Yellow", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.yellow", "chart.theme.Yellow"],
  config: { baseColor: "#fec935" }
});
Ext.define("Ext.chart.theme.YellowGradients", {
  extend: "Ext.chart.theme.Base",
  singleton: true,
  alias: ["chart.theme.yellow-gradients", "chart.theme.Yellow:gradients"],
  config: { baseColor: "#fec935", gradients: { type: "linear", degrees: 90 } }
});
Ext.define("Ext.draw.Point", {
  requires: ["Ext.draw.Draw", "Ext.draw.Matrix"],
  isPoint: true,
  x: 0,
  y: 0,
  length: 0,
  angle: 0,
  angleUnits: "degrees",
  statics: {
    fly: (function () {
      var a = null;
      return function (b, c) {
        if (!a) {
          a = new Ext.draw.Point();
        }
        a.constructor(b, c);
        return a;
      };
    })()
  },
  constructor: function (a, c) {
    var b = this;
    if (typeof a === "number") {
      b.x = a;
      if (typeof c === "number") {
        b.y = c;
      } else {
        b.y = a;
      }
    } else {
      if (Ext.isArray(a)) {
        b.x = a[0];
        b.y = a[1];
      } else {
        if (a) {
          b.x = a.x;
          b.y = a.y;
        }
      }
    }
    b.calculatePolar();
  },
  calculateCartesian: function () {
    var b = this,
      a = b.length,
      c = b.angle;
    if (b.angleUnits === "degrees") {
      c = Ext.draw.Draw.rad(c);
    }
    b.x = Math.cos(c) * a;
    b.y = Math.sin(c) * a;
  },
  calculatePolar: function () {
    var b = this,
      a = b.x,
      c = b.y;
    b.length = Math.sqrt(a * a + c * c);
    b.angle = Math.atan2(c, a);
    if (b.angleUnits === "degrees") {
      b.angle = Ext.draw.Draw.degrees(b.angle);
    }
  },
  setX: function (a) {
    this.x = a;
    this.calculatePolar();
  },
  setY: function (a) {
    this.y = a;
    this.calculatePolar();
  },
  set: function (a, b) {
    this.constructor(a, b);
  },
  setAngle: function (a) {
    this.angle = a;
    this.calculateCartesian();
  },
  setLength: function (a) {
    this.length = a;
    this.calculateCartesian();
  },
  setPolar: function (b, a) {
    this.angle = b;
    this.length = a;
    this.calculateCartesian();
  },
  clone: function () {
    return new Ext.draw.Point(this.x, this.y);
  },
  add: function (a, c) {
    var b = Ext.draw.Point.fly(a, c);
    return new Ext.draw.Point(this.x + b.x, this.y + b.y);
  },
  sub: function (a, c) {
    var b = Ext.draw.Point.fly(a, c);
    return new Ext.draw.Point(this.x - b.x, this.y - b.y);
  },
  mul: function (a) {
    return new Ext.draw.Point(this.x * a, this.y * a);
  },
  div: function (a) {
    return new Ext.draw.Point(this.x / a, this.y / a);
  },
  dot: function (a, c) {
    var b = Ext.draw.Point.fly(a, c);
    return this.x * b.x + this.y * b.y;
  },
  equals: function (a, c) {
    var b = Ext.draw.Point.fly(a, c);
    return this.x === b.x && this.y === b.y;
  },
  rotate: function (f, c) {
    var d, e, b, g, a;
    if (this.angleUnits === "degrees") {
      f = Ext.draw.Draw.rad(f);
      d = Math.sin(f);
      e = Math.cos(f);
    }
    if (c) {
      b = c.x;
      g = c.y;
    } else {
      b = 0;
      g = 0;
    }
    a = Ext.draw.Matrix.fly([
      e,
      d,
      -d,
      e,
      b - e * b + g * d,
      g - e * g + b * -d
    ]).transformPoint(this);
    return new Ext.draw.Point(a);
  },
  transform: function (a) {
    if (a && a.isMatrix) {
      return new Ext.draw.Point(a.transformPoint(this));
    } else {
      if (arguments.length === 6) {
        return new Ext.draw.Point(
          Ext.draw.Matrix.fly(arguments).transformPoint(this)
        );
      } else {
        Ext.raise("Invalid parameters.");
      }
    }
  },
  round: function () {
    return new Ext.draw.Point(Math.round(this.x), Math.round(this.y));
  },
  ceil: function () {
    return new Ext.draw.Point(Math.ceil(this.x), Math.ceil(this.y));
  },
  floor: function () {
    return new Ext.draw.Point(Math.floor(this.x), Math.floor(this.y));
  },
  abs: function (a, b) {
    return new Ext.draw.Point(Math.abs(this.x), Math.abs(this.y));
  },
  normalize: function (c) {
    var a = this.x,
      d = this.y,
      b = (c || 1) / Math.sqrt(a * a + d * d);
    return new Ext.draw.Point(a * b, d * b);
  },
  getDistanceToLine: function (c, b) {
    if (arguments.length === 4) {
      c = new Ext.draw.Point(arguments[0], arguments[1]);
      b = new Ext.draw.Point(arguments[2], arguments[3]);
    }
    var d = b.sub(c).normalize(),
      a = c.sub(this);
    return a.sub(d.mul(a.dot(d)));
  },
  isZero: function () {
    return this.x === 0 && this.y === 0;
  },
  isNumber: function () {
    return Ext.isNumber(this.x) && Ext.isNumber(this.y);
  }
});
Ext.define("Ext.draw.plugin.SpriteEvents", {
  extend: "Ext.plugin.Abstract",
  alias: "plugin.spriteevents",
  requires: ["Ext.draw.overrides.hittest.All"],
  mouseMoveEvents: { mousemove: true, mouseover: true, mouseout: true },
  spriteMouseMoveEvents: {
    spritemousemove: true,
    spritemouseover: true,
    spritemouseout: true
  },
  init: function (a) {
    var b = "handleEvent";
    this.drawContainer = a;
    a.addElementListener({
      click: b,
      dblclick: b,
      mousedown: b,
      mousemove: b,
      mouseup: b,
      mouseover: b,
      mouseout: b,
      priority: 1001,
      scope: this
    });
  },
  hasSpriteMouseMoveListeners: function () {
    var b = this.drawContainer.hasListeners,
      a;
    for (a in this.spriteMouseMoveEvents) {
      if (a in b) {
        return true;
      }
    }
    return false;
  },
  hitTestEvent: function (f) {
    var b = this.drawContainer.getItems(),
      a,
      d,
      c;
    for (c = b.length - 1; c >= 0; c--) {
      a = b.get(c);
      d = a.hitTestEvent(f);
      if (d) {
        return d;
      }
    }
    return null;
  },
  handleEvent: function (f) {
    var d = this,
      b = d.drawContainer,
      g = f.type in d.mouseMoveEvents,
      a = d.lastSprite,
      c;
    if (g && !d.hasSpriteMouseMoveListeners()) {
      return;
    }
    c = d.hitTestEvent(f);
    if (g && !Ext.Object.equals(c, a)) {
      if (a) {
        b.fireEvent("spritemouseout", a, f);
      }
      if (c) {
        b.fireEvent("spritemouseover", c, f);
      }
    }
    if (c) {
      b.fireEvent("sprite" + f.type, c, f);
    }
    d.lastSprite = c;
  }
});
Ext.define("Ext.chart.interactions.ItemInfo", {
  extend: "Ext.chart.interactions.Abstract",
  type: "iteminfo",
  alias: "interaction.iteminfo",
  config: {
    extjsGestures: {
      start: { event: "click", handler: "onInfoGesture" },
      move: { event: "mousemove", handler: "onInfoGesture" },
      end: { event: "mouseleave", handler: "onInfoGesture" }
    }
  },
  item: null,
  onInfoGesture: function (f, a) {
    var c = this,
      b = c.getItemForEvent(f),
      d = b && b.series.tooltip;
    if (d) {
      d.onMouseMove.call(d, f);
    }
    if (b !== c.item) {
      if (b) {
        b.series.showTip(b);
      } else {
        c.item.series.hideTip(c.item);
      }
      c.item = b;
    }
    return false;
  }
});
