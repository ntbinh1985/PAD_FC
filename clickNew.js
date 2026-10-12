function ExecuteScript() {
    function simulateHumanClick(el) {
        var win = el.ownerDocument.defaultView || window;
        
        // 1. Focus vào phần tử
        if (typeof el.focus === "function") {
            el.focus();
        }

        // 2. Cuộn tới phần tử và lấy tọa độ thực
        if (typeof el.scrollIntoView === "function") {
            el.scrollIntoView({ block: "center", inline: "center" });
        }
        var rect = el.getBoundingClientRect();
        var clientX = Math.round(rect.left + (rect.width / 2) || 10);
        var clientY = Math.round(rect.top + (rect.height / 2) || 10);

        var eventInit = {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: win,
            detail: 1,
            screenX: clientX + 50,
            screenY: clientY + 100,
            clientX: clientX,
            clientY: clientY,
            button: 0,
            buttons: 1
        };

        // 3. Chuỗi sự kiện mô phỏng hành vi người dùng (Pointer + Mouse)
        var sequence = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
        
        sequence.forEach(function(type) {
            var evt;
            if (type.indexOf('pointer') === 0 && typeof win.PointerEvent === "function") {
                evt = new win.PointerEvent(type, Object.assign({}, eventInit, {
                    pointerId: 1,
                    pointerType: 'mouse',
                    isPrimary: true
                }));
            } else {
                evt = new win.MouseEvent(type, eventInit);
            }
            el.dispatchEvent(evt);
        });

        // 4. Kích hoạt thêm hàm native click
        if (typeof el.click === "function") {
            el.click();
        }
    }

    function scanFrames(win, depth) {
        if (!win || depth > 6) return "";
        try {
            var doc = win.document;
            if (!doc) return "";

            var btnHolder = doc.querySelector("oj-button#New, [id*='New']");
            if (btnHolder) {
                // Kiểm tra trạng thái disabled
                if (btnHolder.getAttribute("disabled") !== null || btnHolder.classList.contains("oj-disabled")) {
                    return "BUTTON_IS_DISABLED";
                }

                var target = (btnHolder.shadowRoot && btnHolder.shadowRoot.querySelector("button"))
                             || btnHolder.querySelector("button")
                             || btnHolder;

                simulateHumanClick(target);
                return "SUCCESS_HUMAN_CLICKED: " + (btnHolder.id || "element");
            }

            var frames = doc.querySelectorAll("iframe, frame");
            for (var i = 0; i < frames.length; i++) {
                try {
                    var res = scanFrames(frames[i].contentWindow, depth + 1);
                    if (res !== "") return res;
                } catch (e) {}
            }
        } catch (e) {
            return "ERROR: " + e.message;
        }
        return "";
    }

    var result = scanFrames(window, 0);
    return String(result !== "" ? result : "NOT_FOUND");
}