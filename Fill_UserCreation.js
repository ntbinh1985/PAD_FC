function ExecuteScript() {
    try {
        // Hàm dừng thời gian đồng bộ (chạy an toàn trong môi trường nhúng của PAD)
        function syncSleep(ms) {
            var start = new Date().getTime();
            while (new Date().getTime() - start < ms) {
                // chờ
            }
        }

        // Tìm element đệ quy qua các iframe
        function findElementRecursive(win, id, depth) {
            if (!win || depth > 5) return null;
            try {
                var doc = win.document;
                if (!doc) return null;

                var el = doc.getElementById(id);
                if (el) return el;

                var iframes = doc.querySelectorAll("iframe, frame");
                for (var i = 0; i < iframes.length; i++) {
                    try {
                        var res = findElementRecursive(iframes[i].contentWindow, id, depth + 1);
                        if (res) return res;
                    } catch (e) {}
                }
            } catch (e) {}
            return null;
        }

        // Điền giá trị và kích hoạt đầy đủ sự kiện của Oracle JET
        function setFieldValue(el, value) {
            if (!el) return false;

            try { el.focus(); } catch (e) {}

            try {
                var proto = el.ownerDocument.defaultView.HTMLInputElement.prototype;
                var nativeSetter = Object.getOwnPropertyDescriptor(proto, "value").set;
                nativeSetter.call(el, value);
            } catch (err) {
                el.value = value;
            }

            // Kích hoạt chuỗi sự kiện để Oracle JET / Knockout bắt được giá trị mới
            var win = el.ownerDocument.defaultView || window;
            ['input', 'change'].forEach(function(evtType) {
                try {
                    var evt = new win.Event(evtType, { bubbles: true, cancelable: true });
                    el.dispatchEvent(evt);
                } catch (e) {
                    var fallback = win.document.createEvent('Event');
                    fallback.initEvent(evtType, true, true);
                    el.dispatchEvent(fallback);
                }
            });

            try { el.blur(); } catch (e) {}
            return true;
        }

        // 1. Chờ ô USER_ID sẵn sàng (tối đa 10 giây, mỗi vòng lặp 250ms)
        var maxWaitMs = 10000;
        var startWait = new Date().getTime();
        var userIdField = null;

        while (new Date().getTime() - startWait < maxWaitMs) {
            userIdField = findElementRecursive(window, "BLK_USER__USER_ID|input", 0);
            
            if (userIdField && !userIdField.disabled && !userIdField.readOnly) {
                break; // Đã sẵn sàng
            }
            syncSleep(250);
        }

        if (!userIdField || userIdField.disabled || userIdField.readOnly) {
            return "TIMEOUT_WAITING_USER_ID";
        }

        // 2. Danh sách các trường cần điền tuần tự
        var fieldsToFill = [
            { id: "BLK_USER__USER_ID|input", value: "TESTUSER", delayAfter: 500 },
            { id: "BLK_USER__USER_NAME|input", value: "TEST USER", delayAfter: 500 },
            { id: "BLK_USER__HOME_ENTITY|input", value: "ENTITY_ID1", delayAfter: 800 },
            { id: "BLK_USER__USER_PASSWORD|input", value: "Password@123", delayAfter: 500 }
        ];

        var filledCount = 0;

        for (var i = 0; i < fieldsToFill.length; i++) {
            var item = fieldsToFill[i];
            var targetEl = (i === 0) ? userIdField : findElementRecursive(window, item.id, 0);

            if (targetEl) {
                setFieldValue(targetEl, item.value);
                filledCount++;
            }

            // Dừng nghỉ tuần tự giữa các trường
            syncSleep(item.delayAfter);
        }

        return "SUCCESS: FILLED_" + filledCount + "_OF_" + fieldsToFill.length;

    } catch (globalErr) {
        return "ERROR: " + globalErr.message;
    }
}