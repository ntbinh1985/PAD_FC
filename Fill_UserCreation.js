function ExecuteScript() {
    try {
        function syncSleep(ms) {
            var start = new Date().getTime();
            while (new Date().getTime() - start < ms) {}
        }

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

        // Hàm kích hoạt giả lập gõ phím Tab/Enter để trigger Flexcube LOV/Enrichment
        function triggerFlexcubeValidation(el, win) {
            var keys = [
                { key: 'Enter', keyCode: 13, which: 13 },
                { key: 'Tab', keyCode: 9, which: 9 }
            ];

            keys.forEach(function(k) {
                ['keydown', 'keypress', 'keyup'].forEach(function(evtType) {
                    try {
                        var keyEvt = new win.KeyboardEvent(evtType, {
                            key: k.key,
                            code: k.key,
                            keyCode: k.keyCode,
                            which: k.which,
                            bubbles: true,
                            cancelable: true
                        });
                        el.dispatchEvent(keyEvt);
                    } catch(e) {}
                });
            });
        }

        function setFieldValue(el, value, isEnrichment) {
            if (!el) return false;
            var win = el.ownerDocument.defaultView || window;

            // 1. Focus và click để component nhận trạng thái Active
            try { el.focus(); } catch (e) {}
            try { el.click(); } catch (e) {}

            // 2. Gán giá trị qua native setter (bỏ qua override của Knockout/JET)
            try {
                var proto = win.HTMLInputElement.prototype;
                var nativeSetter = Object.getOwnPropertyDescriptor(proto, "value").set;
                nativeSetter.call(el, value);
            } catch (err) {
                el.value = value;
            }

            // 3. Nếu là phần tử Oracle JET Custom Element (oj-input-text / oj-combobox)
            var parentOj = el.closest ? el.closest("oj-input-text, oj-combobox-one, oj-select-one") : null;
            if (parentOj && typeof parentOj.setProperty === "function") {
                try {
                    parentOj.setProperty('value', value);
                } catch(e) {}
            }

            // 4. Kích hoạt chuỗi sự kiện DOM
            ['input', 'change'].forEach(function(evtType) {
                try {
                    var evt = new win.Event(evtType, { bubbles: true, cancelable: true });
                    el.dispatchEvent(evt);
                } catch (e) {}
            });

            // 5. Nếu là trường kích hoạt bảng như HOME_ENTITY: giả lập Tab/Enter và Blur
            if (isEnrichment) {
                triggerFlexcubeValidation(el, win);
            }

            try { el.blur(); } catch (e) {}
            return true;
        }

        // Chờ ô USER_ID sẵn sàng
        var maxWaitMs = 10000;
        var startWait = new Date().getTime();
        var userIdField = null;

        while (new Date().getTime() - startWait < maxWaitMs) {
            userIdField = findElementRecursive(window, "BLK_USER__USER_ID|input", 0);
            if (userIdField && !userIdField.disabled && !userIdField.readOnly) {
                break;
            }
            syncSleep(250);
        }

        if (!userIdField || userIdField.disabled || userIdField.readOnly) {
            return "TIMEOUT_WAITING_USER_ID";
        }

        // Cấu hình các trường (đánh dấu isEnrichment = true cho HOME_ENTITY)
        var fieldsToFill = [
            { id: "BLK_USER__USER_ID|input", value: "TESTUSER", delayAfter: 500, isEnrichment: false },
            { id: "BLK_USER__USER_NAME|input", value: "TEST USER", delayAfter: 500, isEnrichment: false },
            { id: "BLK_USER__HOME_ENTITY|input", value: "ENTITY_ID1", delayAfter: 1500, isEnrichment: true },
            { id: "BLK_USER__USER_PASSWORD|input", value: "Password@123", delayAfter: 500, isEnrichment: false }
        ];

        var filledCount = 0;

        for (var i = 0; i < fieldsToFill.length; i++) {
            var item = fieldsToFill[i];
            var targetEl = (i === 0) ? userIdField : findElementRecursive(window, item.id, 0);

            if (targetEl) {
                setFieldValue(targetEl, item.value, item.isEnrichment);
                filledCount++;
            }

            syncSleep(item.delayAfter);
        }

        return "SUCCESS: FILLED_" + filledCount + "_OF_" + fieldsToFill.length;

    } catch (globalErr) {
        return "ERROR: " + globalErr.message;
    }
}