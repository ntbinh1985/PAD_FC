function ExecuteScript() {
    function fireClick(element) {
        ['mousedown', 'mouseup', 'click'].forEach(function(evtName) {
            var evt = new MouseEvent(evtName, {
                bubbles: true,
                cancelable: true,
                view: element.ownerDocument.defaultView
            });
            element.dispatchEvent(evt);
        });
    }

    function scanFrames(win, depth) {
        if (!win || depth > 6) return "";
        try {
            var doc = win.document;
            if (!doc) return "";

            // Tìm oj-button hoặc button có ID chứa New
            var btnHolder = doc.querySelector("oj-button#New, [id*='New']");
            if (btnHolder) {
                var target = (btnHolder.shadowRoot && btnHolder.shadowRoot.querySelector("button"))
                             || btnHolder.querySelector("button")
                             || btnHolder;
                
                fireClick(target);
                return "SUCCESS: Clicked on " + (btnHolder.id || "element") + " at depth " + depth;
            }

            // Quét tiếp vào các iframe
            var frames = doc.querySelectorAll("iframe, frame");
            for (var i = 0; i < frames.length; i++) {
                try {
                    var subWin = frames[i].contentWindow;
                    var res = scanFrames(subWin, depth + 1);
                    if (res !== "") return res;
                } catch (crossOriginErr) {
                    // Bị chặn bảo mật cross-origin
                }
            }
        } catch (e) {
            return "ERROR: " + e.message;
        }
        return "";
    }

    var finalResult = scanFrames(window, 0);
    
    // Luôn trả về kiểu Primitive String thuần túy
    if (finalResult !== "") {
        return String(finalResult);
    }
    return String("NOT_FOUND");
}