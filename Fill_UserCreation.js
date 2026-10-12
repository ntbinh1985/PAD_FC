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
                var frames = doc.querySelectorAll("iframe, frame");
                for (var i = 0; i < frames.length; i++) {
                    try {
                        var res = findElementRecursive(iframes[i].contentWindow, id, depth + 1);
                        if (res) return res;
                    } catch (e) {}
                }
            } catch (e) {}
            return null;
        }

        // Hàm cập nhật chuẩn Oracle JET cho Flexcube
        function setJETValue(inputEl, val) {
            if (!inputEl) return;
            var win = inputEl.ownerDocument.defaultView || window;
            
            // 1. Focus vào ô
            try { inputEl.focus(); } catch(e) {}

            // 2. Gán native value
            try {
                var proto = win.HTMLInputElement.prototype;
                var nativeSetter = Object.getOwnPropertyDescriptor(proto, "value").set;
                nativeSetter.call(inputEl, val);
            } catch(e) {
                inputEl.value = val;
            }

            // 3. Cập nhật trực tiếp lên Web Component oj-input-text (nếu có)
            var ojComp = inputEl.closest ? inputEl.closest("oj-input-text, oj-combobox-one") : null;
            if (ojComp) {
                try {
                    if (typeof ojComp.setProperty === "function") {
                        ojComp.setProperty("value", val);
                        ojComp.setProperty("rawValue", val);
                    }
                } catch(e) {}
            }

            // 4. Kích hoạt chuỗi sự kiện DOM & Oracle JET Custom Events
            var eventList = ['input', 'change'];
            eventList.forEach(function(evtName) {
                try {
                    inputEl.dispatchEvent(new win.Event(evtName, { bubbles: true, cancelable: true }));
                } catch(e) {}
            });

            // Gửi thêm CustomEvent của JET nếu component hỗ trợ
            if (ojComp) {
                try {
                    ojComp.dispatchEvent(new win.CustomEvent('ojValueUpdated', {
                        detail: { value: val, previousValue: '' },
                        bubbles: true
                    }));
                } catch(e) {}
            }
        }

        // 1. Chờ ô USER_ID sẵn sàng
        var maxWaitMs = 8000;
        var startWait = new Date().getTime();
        var userIdEl = null;

        while (new Date().getTime() - startWait < maxWaitMs) {
            userIdEl = findElementRecursive(window, "BLK_USER__USER_ID|input", 0);
            if (userIdEl && !userIdEl.disabled && !userIdEl.readOnly) break;
            syncSleep(250);
        }

        if (!userIdEl) return "TIMEOUT_WAITING_USER_ID";

        // 2. Điền USER_ID & USER_NAME
        setJETValue(userIdEl, "TESTUSER");
        try { userIdEl.blur(); } catch(e) {}
        syncSleep(300);

        var nameEl = findElementRecursive(window, "BLK_USER__USER_NAME|input", 0);
        if (nameEl) {
            setJETValue(nameEl, "TEST USER");
            try { nameEl.blur(); } catch(e) {}
        }
        syncSleep(300);

        // 3. Điền HOME_ENTITY và ép kích hoạt Validation
        var entityEl = findElementRecursive(window, "BLK_USER__HOME_ENTITY|input", 0);
        if (entityEl) {
            var entityWin = entityEl.ownerDocument.defaultView || window;

            setJETValue(entityEl, "ENTITY_ID1");

            // Giả lập phím Tab/Enter trước khi rời ô
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

            // Blur khỏi ô HOME_ENTITY
            try { entityEl.blur(); } catch(e) {}
        }
        
        // Nghỉ 1 giây để Flexcube gửi AJAX lấy Entity Mapping
        syncSleep(1000);

        // 4. Điền PASSWORD
        var pwdEl = findElementRecursive(window, "BLK_USER__USER_PASSWORD|input", 0);
        if (pwdEl) {
            setJETValue(pwdEl, "Password@123");
            try { pwdEl.blur(); } catch(e) {}
        }

        return "SUCCESS_COMPLETED";

    } catch(err) {
        return "ERROR: " + err.message;
    }
}