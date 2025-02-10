Ext.define("MainHub.view.main.Main", {
  extend: "Ext.container.Viewport",

  requires: [
    "Ext.list.Tree",
    "Ext.tab.Panel",
    "MainHub.view.main.MainController",
    "MainHub.view.main.MainContainerWrap",
    "MainHub.view.requests.Requests",
    "MainHub.view.libraries.Libraries",
    "MainHub.view.incominglibraries.IncomingLibraries",
    "MainHub.view.indexgenerator.IndexGenerator",
    "MainHub.view.librarypreparation.LibraryPreparation",
    "MainHub.view.pooling.Pooling",
    "MainHub.view.flowcell.Flowcells",
    "MainHub.view.invoicing.Invoicing",
    "MainHub.view.usage.Usage",
    "MainHub.view.statistics.RunStatistics",
    "MainHub.view.statistics.Sequences"
  ],

  controller: "main",

  cls: "sencha-dash-viewport",
  itemd: "mainView",

  layout: {
    type: "vbox",
    align: "stretch"
  },

  listeners: {
    render: "onMainViewRender"
  },

  items: [
    {
      xtype: "toolbar",
      id: "headerBar",
      itemId: "headerBar",
      cls: "sencha-dash-dash-headerbar shadow bg-color-beige",
      height: 64,
      padding: 0,
      items: [
        {
          xtype: "component",
          reference: "logo",
          cls: "main-logo",
          html: '<div class="logo"><img src="static/main-hub/resources/images/logo1.svg"><div id="header-title" class="title" style="text-color:red !important"><span>Parkour LIMS</div></div>',
          width: 300,
          // Set the width of this element based on that of the navigationTreeList
          listeners: {
            beforerender: function (cmp) {
              cmp.width = cmp.up().up().down("#navigationTreeList").getWidth();
            },
          },
        },
        {
          margin: "0 0 0 8",
          ui: 'header',
          iconCls: "x-fa fa-navicon color-bluish-grey",
          id: "main-navigation-btn",
          handler: "onToggleNavigationSize",
          tooltip: "Expand/Collapse Navigation Bar"
        },
        "->",
        {
          xtype: "tbtext",
          cls: "header-username color-bluish-grey",
          text: USER.name // from 'globals.html'
        },
        {
          xtype: "button",
          ui: "header",
          id: "adminSiteBtn",
          iconCls: "x-fa fa-cog color-bluish-grey",
          href: "admin",
          tooltip: "Site Administration"
        },
        {
          xtype: "button",
          ui: "header",
          iconCls: "x-fa fa-book color-bluish-grey",
          href: DOCUMENTATION_URL,
          tooltip: "Documentation",
        },
        // {
        //   xtype: "button",
        //   ui: "header",
        //   id: "dutiesBtn",
        //   iconCls: "x-fa fa-calendar color-bluish-grey",
        //   href: "vue/duties",
        //   tooltip: "Duties",
        // },
        {
          xtype: "container",
          html:
            '<form id="logout-form" method="post" action="logout/" style="display:inline;">' +
            '    <input type="hidden" name="csrfmiddlewaretoken" value="' + CSRF_TOKEN +'">' +
            '    <button type="submit" style="background: none; padding: 0px; border: none; cursor: pointer">' +
            '        <i style="font-size: 16px; font-style: normal !important; padding: 0px;" class="x-fa fa-sign-out color-bluish-grey"></i>' +
            '    </button>' +
            '</form>'
          ,
          width: 30,
          height: 30,
          padding: 7,
          listeners: {
            render: function (component) {
              Ext.create("Ext.tip.ToolTip", {
                target: component.getEl(),
                html: "Logout"
              });
            }
          }
        }
      ]
    },
    {
      xtype: "maincontainerwrap",
      id: "main-view-detail-wrap",
      reference: "mainContainerWrap",
      flex: 1,
      items: [
        {
          xtype: "treelist",
          reference: "navigationTreeList",
          itemId: "navigationTreeList",
          ui: "navigation",
          store: "NavigationTree",
          // If present, get the value for the navPanelState cookie and
          // set the width of the nav panel accordingly
          width:
            Ext.util.Cookies.get("navPanelState") !== "extended" ? 64 : 300,
          expanderFirst: false,
          expanderOnly: false,
          listeners: {
            selectionchange: "onNavigationTreeSelectionChange"
          }
        },
        {
          xtype: "container",
          flex: 1,
          reference: "mainCardPanel",
          cls: "sencha-dash-right-main-container",
          itemId: "contentPanel",
          layout: {
            type: "card",
            anchor: "100%"
          }
        }
      ]
    }
  ]
});
