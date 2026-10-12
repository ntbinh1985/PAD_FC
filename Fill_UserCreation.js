function ExecuteScript() {
    try {
        function syncSleep(ms) {
            var start = new Date().getTime();
            while (new Date().getTime() - start < ms) {}
        }

        // Tìm kiếm document đang chứa con trỏ hoặc duyệt iframe
        function getActiveOrSearch(idSubstr) {
            // 1. Kiểm tra nếu con trỏ đang nhấp nháy tại chính ô input đó
            var activeDoc = document;
            if (activeDoc.activeElement && activeDoc.activeElement.tagName === "IFRAME") {
                try { activeDoc = activeDoc.activeElement.contentWindow.document; } catch(e) {}
            }
            if (activeDoc.activeElement && activeDoc.activeElement.tagName === "INPUT") {
                return activeDoc.activeElement;
            }

            // 2. Nếu không, quét đệ quy qua các iframe
            function scan(win, depth) {
                if (!win || depth > 5) return null;
                try {
                    var doc = win.document;
                    if (!doc) return null;

                    // Thử tìm theo activeElement trong iframe
                    if (doc.activeElement && doc.activeElement.tagName === "INPUT") {
                        return doc.activeElement;
                    }

                    // Thử tìm theo các dạng ID phổ biến của Flexcube
                    var selector = "input[id*='" + idSubstr + "'], [id*='" + idSubstr + "'] input";
                    var el = doc.querySelector(selector);
                    if (el) return el;

                    var frames = doc.querySelectorAll("iframe, frame");
                    for (var i = 0; i < frames.length; i++) {
                        var res = scan(frames[i].contentWindow, depth + 1);
                        if (res) return res;
                    }
                } catch(e) {}
                return null;
            }

            return scan(window, 0);
        }

        function findByFlexibleId(idSubstr) {
            function scan(win, depth) {
                if (!win || depth > 5) return null;
                try {
                    var doc = win.document;
                    if (!doc) return null;

                    var selector = "input[id*='" + idSubstr + "'], [id*='" + idSubstr + "'] input, input[name*='" + idSubstr + "']";
                    var el = doc.querySelector(selector);
                    if (el) return el;

                    var frames = doc.querySelectorAll("iframe, frame");
                    for (var i = 0; i < frames.length; i++) {
                        var res = scan(frames[i].contentWindow, depth + 1);
                        if (res) return res;
                    }
                } catch(e) {}
                return null;
            }
            return scan(window, 0);
        }

        function setJETValue(inputEl, val) {
            if (!inputEl) return;
            var win = inputEl.ownerDocument.defaultView || window;
            
            try { inputEl.focus(); } catch(e) {}

            try {
                var proto = win.HTMLInputElement.prototype;
                var nativeSetter = Object.getOwnPropertyDescriptor(proto, "value").set;
                nativeSetter.call(inputEl, val);
            } catch(e) {
                inputEl.value = val;
            }

            var ojComp = inputEl.closest ? inputEl.closest("oj-input-text, oj-combobox-one") : null;
            if (ojComp && typeof ojComp.setProperty === "function") {
                try {
                    ojComp.setProperty("value", val);
                    ojComp.setProperty("rawValue", val);
                } catch(e) {}
            }

            ['input', 'change'].forEach(function(evt) {
                try { inputEl.dispatchEvent(new win.Event(evt, { bubbles: true, cancelable: true })); } catch(e) {}
            });
        }

        // 1. Lấy ô USER_ID (Tận dụng ngay ô đang nhấp nháy con trỏ)
        var maxWaitMs = 6000;
        var startWait = new Date().getTime();
        var userIdEl = null;

        while (new Date().getTime() - startWait < maxWaitMs) {
            userIdEl = getActiveOrSearch("USER_ID");
            if (userIdEl && !userIdEl.disabled && !userIdEl.readOnly) {
                break;
            }
            syncSleep(200);
        }

        if (!userIdEl) return "TIMEOUT_WAITING_USER_ID";

        // 2. Điền USER_ID
        setJETValue(userIdEl, "TESTUSER");
        try { userIdEl.blur(); } catch(e) {}
        syncSleep(300);

        // 3. Điền USER_NAME
        var nameEl = findByFlexibleId("USER_NAME");
        if (nameEl) {
            setJETValue(nameEl, "TEST USER");
            try { nameEl.blur(); } catch(e) {}
        }
        syncSleep(300);

        // 4. Điền HOME_ENTITY và ép trigger kích hoạt bảng Entity Mapping
        var entityEl = findByFlexibleId("HOME_ENTITY");
        if (entityEl) {
            var entityWin = entityEl.ownerDocument.defaultView || window;
            setJETValue(entityEl, "ENTITY_ID1");

            // Bắn Tab và Enter
            [13, 9].forEach(function(code) {
                var k = (code === 13) ? 'Enter' : 'Tab';
                ['keydown', 'keyup'].forEach(function(evtType) {
                    try {
                        entityEl.dispatchEvent(new entityWin.KeyboardEvent(evtType, {
                            key: k, code: k, keyCode: code, which: code, bubbles: true
                        }));
                    } catch(e) {}
                });
            });

            try { entityEl.blur(); } catch(e) {}
        }
        syncSleep(1000);

        // 5. Điền PASSWORD
        var pwdEl = findByFlexibleId("USER_PASSWORD") || findByFlexibleId("PASSWORD");
        if (pwdEl) {
            setJETValue(pwdEl, "Password@123");
            try { pwdEl.blur(); } catch(e) {}
        }

        return "SUCCESS_COMPLETED";

    } catch(err) {
        return "ERROR: " + err.message;
    }
}