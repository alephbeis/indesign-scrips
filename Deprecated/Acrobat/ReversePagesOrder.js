

// FREE VERSION. All Rights Reserved to Gilad Denneboom. Distribution without permission is not allowed.
// You can contact me at try6767@gmail.com or via my website: http://try67.blogspot.com

if (app.viewerVersion < 10) {
	app.addMenuItem({ cName: "ReversePagesOrder", cUser: "Reverse Pages Order", cParent: "Tools", nPos: 1, 
		cExec: "reversePagesOrder()", cEnable: "event.rc = (event.target != null);"}); 
} else {
	app.addToolButton({ cName: "ReversePagesOrder", cLabel: "Reverse Pages Order", cTooltext: "Reverse Pages Order", 
		cExec: "reversePagesOrder()", cEnable: "event.rc = (event.target != null);"});
}

function reversePagesOrder() {
	for (var i = this.numPages - 1; i >= 0; i--) this.movePage(i);
}

// FREE VERSION. All Rights Reserved to Gilad Denneboom. Distribution without permission is not allowed.
// You can contact me at try6767@gmail.com or via my website: http://try67.blogspot.com
