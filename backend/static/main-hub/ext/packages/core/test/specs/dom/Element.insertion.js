describe(
  "Ext.Element.insertion",
  function () {
    var el, span, child1, child2, child3;

    beforeEach(function () {
      el = Ext.getBody().createChild({
        id: "ExtElementHelper",
        children: [{ id: "child1" }, { id: "child2" }, { id: "child3" }]
      });

      span = Ext.getBody().createChild({
        id: "ExtElementSpanHelper",
        tag: "span"
      });

      child1 = Ext.get("child1");
      child2 = Ext.get("child2");
      child3 = Ext.get("child3");
    });

    afterEach(function () {
      // Prevent console warnings
      spyOn(Ext.Logger, "log");

      el.destroy();
      span.destroy();
      child1.destroy();
      child2.destroy();
      child3.destroy();
    });
    describe("appendChild", function () {
      it("should append the child", function () {
        expect(el.contains(span)).toBeFalsy();

        el.appendChild(span);

        expect(el.contains(span)).toBeTruthy();
      });
    });

    describe("appendTo", function () {
      it("should append the el to the specified el", function () {
        expect(span.contains(el)).toBeFalsy();

        el.appendTo(span);

        expect(span.contains(el)).toBeTruthy();
      });
    });

    describe("insertBefore", function () {
      it("should insert the el before the specified el", function () {
        var nodes = Ext.getDom(child1).parentNode.childNodes,
          array = Ext.toArray(nodes);

        expect(Ext.Array.indexOf(array, Ext.getDom(child2))).toEqual(1);

        child2.insertBefore(child1);

        nodes = Ext.getDom(child1).parentNode.childNodes;
        array = Ext.toArray(nodes);

        expect(Ext.Array.indexOf(array, Ext.getDom(child2))).toEqual(0);
      });
    });

    describe("insertAfter", function () {
      it("should insert the el after the specified el", function () {
        var nodes = Ext.getDom(child1).parentNode.childNodes,
          array = Ext.toArray(nodes);

        expect(Ext.Array.indexOf(array, Ext.getDom(child2))).toEqual(1);

        child2.insertAfter(child3);

        nodes = Ext.getDom(child1).parentNode.childNodes;
        array = Ext.toArray(nodes);

        expect(Ext.Array.indexOf(array, Ext.getDom(child2))).toEqual(2);
      });
    });

    describe("insertFirst", function () {
      it("should insert the el into the specified el", function () {
        var nodes = Ext.getDom(child2).childNodes;
        expect(nodes.length).toEqual(0);

        child2.insertFirst(child1);

        nodes = Ext.getDom(child2).childNodes;
        expect(nodes.length).toEqual(1);
      });
    });

    describe("insertSibling", function () {
      afterEach(function () {
        var sibling1 = Ext.get("sibling1"),
          sibling2 = Ext.get("sibling2");

        if (sibling1) {
          sibling1.destroy();
        }
        if (sibling2) {
          sibling2.destroy();
        }
      });
      describe("when array", function () {
        describe("after", function () {
          it("should create each of the elements and add them to the el parent", function () {
            var nodes = Ext.getDom(el).childNodes;
            expect(nodes.length).toEqual(3);

            child1.insertSibling(
              [{ id: "sibling1" }, { id: "sibling2" }],
              "after"
            );

            nodes = Ext.getDom(el).childNodes;
            expect(nodes.length).toEqual(5);
          });
        });

        describe("before", function () {
          it("should create each of the elements and add them to the el parent", function () {
            var nodes = Ext.getDom(el).childNodes;
            expect(nodes.length).toEqual(3);

            child1.insertSibling(
              [{ id: "sibling1" }, { id: "sibling2" }],
              "before"
            );

            nodes = Ext.getDom(el).childNodes;
            expect(nodes.length).toEqual(5);
          });
        });
      });

      describe("when Ext.Element", function () {
        describe("after", function () {
          it("should move the element next to the el", function () {
            var nodes = Ext.getDom(el).childNodes;
            expect(nodes.length).toEqual(3);

            child1.insertSibling(span, "after");

            nodes = Ext.getDom(el).childNodes;
            expect(nodes.length).toEqual(4);
          });
        });

        describe("before", function () {
          it("should move the element next to the el", function () {
            var nodes = Ext.getDom(el).childNodes;
            expect(nodes.length).toEqual(3);

            child1.insertSibling(span, "before");

            nodes = Ext.getDom(el).childNodes;
            expect(nodes.length).toEqual(4);
          });
        });
      });

      describe("other", function () {
        describe("after", function () {
          it("should move the element next to the el", function () {
            var nodes = Ext.getDom(el).childNodes;
            expect(nodes.length).toEqual(3);

            child1.insertSibling(
              {
                id: "sibling1"
              },
              "after"
            );

            nodes = Ext.getDom(el).childNodes;
            expect(nodes.length).toEqual(4);
          });
        });

        describe("before", function () {
          it("should move the element next to the el", function () {
            var nodes = Ext.getDom(el).childNodes;
            expect(nodes.length).toEqual(3);

            child1.insertSibling(
              {
                id: "sibling1"
              },
              "before"
            );

            nodes = Ext.getDom(el).childNodes;
            expect(nodes.length).toEqual(4);
          });

          describe("return dom", function () {
            it("should move the element next to the el", function () {
              var nodes = Ext.getDom(el).childNodes,
                dom;

              expect(nodes.length).toEqual(3);

              dom = child1.insertSibling(
                {
                  id: "sibling1"
                },
                "before",
                true
              );

              nodes = Ext.getDom(el).childNodes;
              expect(nodes.length).toEqual(4);
              expect(dom).toBeDefined();
            });
          });
        });
      });
    });

    describe("replace", function () {
      it("should replace the passed element with this element", function () {
        var nodes = Ext.getDom(el).childNodes;
        expect(nodes.length).toEqual(3);

        child1.replace(child2);

        nodes = Ext.getDom(el).childNodes;
        expect(nodes.length).toEqual(2);
      });
    });

    describe("replaceWith", function () {
      it("should replace this element with the passed element config", function () {
        var nodes = Ext.getDom(el).childNodes;
        expect(nodes.length).toEqual(3);

        child1.replaceWith({ tag: "div", cls: "childtestdiv" });

        expect(child1.hasCls("childtestdiv"));

        nodes = Ext.getDom(el).childNodes;
        expect(nodes.length).toEqual(3);
      });

      it("should replace this element with the passed Ext.Element", function () {
        var newNode = el.insertSibling({
          tag: "div",
          cls: "newNode"
        });

        child1.replaceWith(newNode);
        expect(newNode.dom.parentNode).toBe(el.dom);
        expect(Ext.getDom(el).childNodes.length).toEqual(3);
      });

      it("should replace this element with the passed dom element", function () {
        var newNode = el.insertSibling({
          tag: "div",
          cls: "newNode"
        });

        child1.replaceWith(newNode.dom);
        expect(newNode.dom.parentNode).toBe(el.dom);
        expect(Ext.getDom(el).childNodes.length).toEqual(3);
      });

      it("should replace this element with the passed element id", function () {
        var newNode = el.insertSibling({
          tag: "div",
          cls: "newNode",
          id: "replaceWithId"
        });

        child1.replaceWith("replaceWithId");
        expect(newNode.dom.parentNode).toBe(el.dom);
        expect(Ext.getDom(el).childNodes.length).toEqual(3);
      });
    });

    describe("createChild", function () {
      afterEach(function () {
        Ext.get("child4").destroy();
      });

      it("should create a child", function () {
        var nodes = Ext.getDom(el).childNodes;
        expect(nodes.length).toEqual(3);

        el.createChild({ id: "child4" });

        nodes = Ext.getDom(el).childNodes;
        expect(nodes.length).toEqual(4);
      });

      it("should create a child before an el", function () {
        var nodes = Ext.getDom(el).childNodes,
          array = Ext.toArray(nodes);

        expect(nodes.length).toEqual(3);
        expect(Ext.Array.indexOf(array, Ext.getDom(child2))).toEqual(1);

        el.createChild({ id: "child4" }, child2);

        nodes = Ext.getDom(el).childNodes;
        array = Ext.toArray(nodes);

        expect(nodes.length).toEqual(4);
        expect(Ext.Array.indexOf(array, Ext.getDom(child2))).toEqual(2);
      });
    });

    describe("wrap", function () {
      it("should wrap the element", function () {
        var parent = Ext.getDom(child1).parentNode;

        var wrap = child1.wrap({
          cls: "wrapper"
        });

        expect(Ext.getDom(child1).parentNode.parentNode).toEqual(parent);
        expect(Ext.getDom(child1).parentNode.className).toEqual("wrapper");
        wrap.destroy();
      });

      it("return the el", function () {
        var node = child1.wrap({
          cls: "wrapper"
        });

        expect(Ext.isElement(node)).toBeFalsy();
        node.destroy();
      });

      it("return the dom", function () {
        var node = child1.wrap(
          {
            cls: "wrapper"
          },
          true
        );

        expect(Ext.isElement(node)).toBeTruthy();
      });
    });

    describe("insertHtml", function () {
      describe("beforeBegin", function () {
        it("should insert the html", function () {
          expect(Ext.getDom(el).childNodes.length).toEqual(3);

          child1.insertHtml("beforeBegin", "<div></div>");

          expect(Ext.getDom(el).childNodes.length).toEqual(4);
        });
      });

      describe("afterBegin", function () {
        it("should insert the html", function () {
          expect(Ext.getDom(child1).childNodes.length).toEqual(0);

          child1.insertHtml("afterBegin", "<div></div>");

          expect(Ext.getDom(child1).childNodes.length).toEqual(1);
        });
      });

      describe("beforeEnd", function () {
        it("should insert the html", function () {
          expect(Ext.getDom(child1).childNodes.length).toEqual(0);

          child1.insertHtml("beforeEnd", "<div></div>");

          expect(Ext.getDom(child1).childNodes.length).toEqual(1);
        });
      });

      describe("afterEnd", function () {
        it("should insert the html", function () {
          expect(Ext.getDom(el).childNodes.length).toEqual(3);

          child1.insertHtml("afterEnd", "<div></div>");

          expect(Ext.getDom(el).childNodes.length).toEqual(4);
        });
      });

      it("should return a dom", function () {
        var node = child1.insertHtml("afterEnd", "<div></div>");

        expect(Ext.isElement(node)).toBeTruthy();
      });

      it("should return an el", function () {
        var node = child1.insertHtml("afterEnd", "<div></div>", true);

        expect(Ext.isElement(node)).toBeFalsy();
        node.destroy();
      });
    });
  },
  "/src/dom/Element.insertion.js"
);
