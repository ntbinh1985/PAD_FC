function ExecuteScript() {
    // 1. Quét tìm document chứa phần tử cần thao tác
    function findDoc(win, sel) {
        try {
            var doc = win.document;
            if (doc && doc.querySelector(sel)) return doc;
            var frames = doc ? doc.querySelectorAll('iframe') : [];
            for (var i = 0; i < frames.length; i++) {
                var found = findDoc(frames[i].contentWindow, sel);
                if (found) return found;
            }
        } catch(e) {}
        return null;
    }

    // 2. Tìm frame chứa ô nhập ROLEFUN
    var targetDoc = findDoc(window, 'input[name="ROLEFUN"]');
    if (!targetDoc) return "Error: Không tìm thấy frame chứa bảng Role Function";

    // 3. Biến đầu vào từ Power Automate Desktop
    var roleVal = "%CurrentRole['RoleFunction']%".trim();

    // 4. Lấy ô input ROLEFUN ở dòng mới nhất
    var roleInputs = Array.from(targetDoc.querySelectorAll('input[id*="BLK_ROLEDETAIL__ROLEFUNRC"]'));
    if (roleInputs.length === 0) return "Error: Chưa có dòng nào trên bảng Role Detail";

    var targetRoleInput = roleInputs[roleInputs.length - 1];

    // 5. Điền giá trị và kích hoạt trigger mở LOV
    targetRoleInput.focus();
    targetRoleInput.value = roleVal;
    targetRoleInput.dispatchEvent(new Event('input', { bubbles: true }));
    targetRoleInput.dispatchEvent(new Event('change', { bubbles: true }));

    var ojComponent = targetRoleInput.closest('oj-input-text');
    if (ojComponent) {
        ojComponent.value = roleVal;
        ojComponent.dispatchEvent(new Event('valueChanged', { bubbles: true }));
        ojComponent.dispatchEvent(new Event('change', { bubbles: true }));
    }

    targetRoleInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
    targetRoleInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Tab', keyCode: 9, bubbles: true }));
    targetRoleInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Tab', keyCode: 9, bubbles: true }));
    targetRoleInput.blur();

    // 6. Hàm kiểm tra sự xuất hiện và chọn giá trị trong LOV
    function checkAndSelectLov(win) {
        try {
            var doc = win.document;
            if (!doc) return { opened: false, found: false };

            // Nhận diện container LOV/Dropdown/Dialog của Flexcube
            var lovContainer = doc.querySelector('.oj-listbox-drop, .oj-dialog, div[role="dialog"], .lov-container, div[role="listbox"]');
            var isLovVisible = !!lovContainer;

            var cells = Array.from(doc.querySelectorAll('td, div[role="gridcell"], li[role="option"]'));
            for (var i = 0; i < cells.length; i++) {
                if (cells[i].textContent.trim().toUpperCase() === roleVal.toUpperCase()) {
                    var row = cells[i].closest('tr') || cells[i].closest('div[role="row"]') || cells[i];
                    ['mousedown', 'mouseup', 'click', 'dblclick'].forEach(function(evt) {
                        cells[i].dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: win }));
                        row.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: win }));
                    });
                    var enter = new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true });
                    row.dispatchEvent(enter);
                    cells[i].dispatchEvent(enter);
                    return { opened: true, found: true };
                }
            }

            var frames = doc.querySelectorAll('iframe');
            for (var j = 0; j < frames.length; j++) {
                var res = checkAndSelectLov(frames[j].contentWindow);
                if (res.found) return res;
                if (res.opened) isLovVisible = true;
            }

            return { opened: isLovVisible, found: false };
        } catch(e) {
            return { opened: false, found: false };
        }
    }

    // 7. Đồng bộ chờ bảng LOV phản hồi (Tối đa 2500ms)
    var startTime = new Date().getTime();
    var timeoutMs = 2500;
    var lovWasDetected = false;

    while (new Date().getTime() - startTime < timeoutMs) {
        var status = checkAndSelectLov(window);
        if (status.found) {
            return "Success";
        }
        if (status.opened) {
            lovWasDetected = true;
        }
    }

    // Nếu popup LOV đã mở ra nhưng hết timeout vẫn không khớp giá trị
    if (lovWasDetected) {
        return "NOT_FOUND";
    }

    // Trường hợp hệ thống nhận diện đúng luôn mà không cần bung popup LOV
    return "Success";
}