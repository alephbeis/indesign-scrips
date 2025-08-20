if (app.viewerVersion < 10) {
      app.addMenuItem({ cName: "PrepareforLulu", cUser: "Prepare for Lulu", cParent: "Tools", nPos: 1,
            cExec: "prepareForLulu()", cEnable: "event.rc = (event.target != null);"});
} else {
      app.addToolButton({ cName: "PrepareforLulu", cLabel: "Prepare for Lulu", cTooltext: "Remove the first two pages and reverse the page order",
            cExec: "prepareForLulu()", cEnable: "event.rc = (event.target != null);"});
}

function prepareForLulu() {
      // Delete the first two pages (cover plus following blank page)
      // Note: We delete page 0 twice because after deleting the first page,
      // what was page 1 becomes page 0
      if (this.numPages >= 2) {
            this.deletePages(0);
            this.deletePages(0);
      } else if (this.numPages === 1) {
            this.deletePages(0);
      }
      
      // Reverse the remaining pages
      for (var i = this.numPages - 1; i >= 0; i--) {
            this.movePage(i);
      }
}