/**
 * UIUtils.jsx — Standalone UI helpers for InDesign (ExtendScript, ES3-safe)
 * Namespace: UIUtils
 *
 * Provides:
 *  - UIUtils.showMessage(title, message, options)
 *  - UIUtils.alert(message, title?)
 *  - UIUtils.createProgressWindow(title, options) → { window, bar, label, update(v,text), close() }
 */

var UIUtils = UIUtils || {};

(function (NS) {
    NS.showMessage = function (title, message, options) {
        options = options || {};
        try {
            var win = new Window("dialog", title || "Message");
            win.orientation = "column";
            win.margins = options.margins || 16;
            win.spacing = options.spacing || 12;

            var txt = win.add("statictext", undefined, String(message), { multiline: true });
            txt.characters = options.characters || 60;

            var row = win.add("group");
            row.alignment = "right";
            row.spacing = 8;
            var ok = row.add("button", undefined, "OK", { name: "ok" });
            win.defaultElement = ok;
            win.cancelElement = ok;

            if (options.width) win.preferredSize.width = options.width;
            if (options.height) win.preferredSize.height = options.height;

            win.center();
            return win.show();
        } catch (e) {
            try {
                $.writeln(String(message));
            } catch (_) {}
            return 1;
        }
    };

    NS.alert = function (message, title) {
        try {
            return NS.showMessage(title || "Alert", String(message));
        } catch (e) {
            try {
                if (typeof alert === "function") return alert(message);
            } catch (_) {
                try {
                    $.writeln(String(message));
                } catch (__) {}
            }
        }
        return 1;
    };

    NS.createProgressWindow = function (title, options) {
        options = options || {};
        var progressWin = null;
        var progressBar = null;
        var progressLabel = null;
        try {
            progressWin = new Window("palette", title || "Working...");
            progressWin.orientation = "column";
            progressWin.margins = 16;
            progressWin.spacing = 12;
            progressWin.preferredSize.width = options.width || 400;

            if (options.showLabel !== false) {
                progressLabel = progressWin.add("statictext", undefined, options.initialText || "Processing...");
            }

            progressBar = progressWin.add("progressbar", undefined, 0, 100);
            progressBar.preferredSize.width = (options.width || 400) - 32;

            progressWin.show();

            return {
                window: progressWin,
                bar: progressBar,
                label: progressLabel,
                update: function (value, text) {
                    try {
                        if (typeof value === "number") progressBar.value = Math.max(0, Math.min(100, value));
                        if (text && progressLabel) progressLabel.text = String(text);
                        progressWin.update();
                    } catch (_) {}
                },
                close: function () {
                    try {
                        if (progressWin) progressWin.close();
                        progressWin = null;
                    } catch (_) {}
                }
            };
        } catch (e) {
            return { update: function () {}, close: function () {} };
        }
    };
})(UIUtils);
