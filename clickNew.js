function ExecuteScript() {
    try {
        function triggerRealClick(el) {
            var win = el.ownerDocument.defaultView || window;
            
            // 1. Focus vào phần tử
            try { el.focus(); } catch(e) {}

            // 2. Lấy tọa độ thực tế trên màn hình
            var rect = el.getBoundingClientRect();
            var cx = Math.round(rect.left + (rect.width / 2) || 10);
            var cy = Math.round(rect.top + (rect.height / 2) || 10);

            var eventTypes = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
            
            for (var i = 0; i < eventTypes.length; i++) {
                var t = eventTypes[i];
                var evt;
                try {
                    if (t.indexOf('pointer') === 0 && typeof win.PointerEvent === 'function') {
                        evt = new win.PointerEvent(t, {
                            bubbles: true,
                            cancelable: true,
                            view: win,
                            clientX: cx,
                            clientY: cy,
                            button: 0,
                            buttons: 1,
                            pointerId: 1,
                            pointerType: 'mouse',
                            isPrimary: true
                        });
                    } else {
                        evt = new win.MouseEvent(t, {
                            bubbles: true,
                            cancelable: true,
                            view: win,
                            clientX: cx,
                            clientY: cy,
                            button: 0,
                            buttons: 1
                        });
                    }
                    el.dispatchEvent(evt);
                } catch(err) {
                    // Fallback cho trình duyệt cũ
                    var fallbackEvt = win.document.createEvent('MouseEvents');
                    fallbackEvt.initMouseEvent(t, true, true, win, 1, 0, 0, cx, cy, false, false, false, false, 0, null);
                    el.dispatchEvent(fallbackEvt);
                }
            }

            // Gọi thêm native click
            try { el.click(); } catch(e) {}
        }

        function scan(win, depth) {
            if (!win || depth > 5) return "";
            try {
                var doc = win.document;
                if (!doc) return "";

                var btnHolder = doc.querySelector("oj-button#New, [id*='New']");
                if (btnHolder) {
                    if (btnHolder.getAttribute("disabled") !== null || btnHolder.className.indexOf("oj-disabled") !== -1) {
                        return "BUTTON_IS_DISABLED";
                    }

                    var target = (btnHolder.shadowRoot && btnHolder.shadowRoot.querySelector("button"))
                                 || btnHolder.querySelector("button")
                                 || btnHolder;

                    triggerRealClick(target);
                    return "SUCCESS_CLICKED";
                }

                var frames = doc.querySelectorAll("iframe, frame");
                for (var j = 0; j < frames.length; j++) {
                    try {
                        var res = scan(frames[j].contentWindow, depth + 1);
                        if (res !== "") return res;
                    } catch(e) {}
                }
            } catch(e) {
                return "ERROR: " + e.message;
            }
            return "";
        }

        var result = scan(window, 0);
        return result !== "" ? ("" + result) : "NOT_FOUND";
    } catch(globalError) {
        return "FATAL_ERROR: " + globalError.message;
    }
}