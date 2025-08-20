if (app.viewerVersion < 10) {
      app.addMenuItem({ cName: "PrepareShirHashirim", cUser: "Prepare Shir Hashirim", cParent: "Tools", nPos: 2,
            cExec: "prepareShirHashirim()", cEnable: "event.rc = (event.target != null);"});
} else {
      app.addToolButton({ cName: "PrepareShirHashirim", cLabel: "Prepare Shir Hashirim for Lulu", cTooltext: "Reverse the page order",
            cExec: "prepareShirHashirim()", cEnable: "event.rc = (event.target != null);"});
}

function prepareShirHashirim() {
      // Reverse the pages
      for (var i = this.numPages - 1; i >= 0; i--) {
            this.movePage(i);
      }
}