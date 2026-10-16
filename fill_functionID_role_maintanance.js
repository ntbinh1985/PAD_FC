function ExecuteScript() {
    // 1. Quét tìm document chứa input
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

    var targetDoc = findDoc(window, 'input[name="ROLEFUN"]');
    if (!targetDoc) return "Error: Không tìm thấy frame chứa bảng Role Function";

    var roleVal = "%CurrentRole['RoleFunction']%".trim();

    var roleInputs = Array.from(targetDoc.querySelectorAll('input[id*="BLK_ROLEDETAIL__ROLEFUNRC"]'));
    if (roleInputs.length === 0) return "Error: Chưa có dòng nào trên bảng Role Detail";

    var targetRoleInput = roleInputs[roleInputs.length - 1];

    // 2. Điền giá trị
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

    // Kích hoạt rời ô để FC chạy onchange/disp_auto_lov
    targetRoleInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
    targetRoleInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Tab', keyCode: 9, bubbles: true }));
    targetRoleInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Tab', keyCode: 9, bubbles: true }));
    targetRoleInput.blur();

    // 3. Hàm kiểm tra phần tử có thực sự hiển thị trên màn hình không
    function isVisible(el) {
        if (!el) return false;
        var style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetWidth > 0 && el.offsetHeight > 0;
    }

    // 4. Tìm kiếm popup LOV đang hiển thị trên tất cả window/iframe
    function getActiveLovContainer(win) {
        try {
            var doc = win.document;
            if (!doc) return null;

            // Các class popup LOV phổ biến của FC 14.8 / Oracle JET
            var selectors = [
                'oj-dialog[role="dialog"]',
                '.oj-dialog.oj-component',
                '.oj-listbox-drop',
                'div[role="dialog"]',
                '.lov-container'
            ];

            for (var s = 0; s < selectors.length; s++) {
                var dialogs = doc.querySelectorAll(selectors[s]);
                for (var d = 0; d < dialogs.length; d++) {
                    if (isVisible(dialogs[d])) {
                        // Loại trừ các dialog không phải LOV (nếu có modal cảnh báo lỗi hoặc LOV table)
                        return { doc: doc, win: win, container: dialogs[d] };
                    }
                }
            }

            var frames = doc.querySelectorAll('iframe');
            for (var f = 0; f < frames.length; f++) {
                var res = getActiveLovContainer(frames[f].contentWindow);
                if (res) return res;
            }
        } catch(e) {}
        return null;
    }

    // 5. Thử tìm và chọn giá trị bên trong LOV container
    function trySelectValueInLov(lovObj) {
        var container = lovObj.container;
        var win = lovObj.win;
        var cells = Array.from(container.querySelectorAll('td, div[role="gridcell"], li[role="option"]'));

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
                return true;
            }
        }
        return false;
    }

    // 6. Chờ LOV xuất hiện nếu mã sai / cần chọn
    var start = Date.now();
    var waitTime = 1800; // Chờ tối đa 1.8s
    var lovFound = null;

    while (Date.now() - start < waitTime) {
        lovFound = getActiveLovContainer(window);
        if (lovFound) {
            // Đã thấy popup LOV bật lên thực tế
            // Thử chọn giá trị nếu có trong danh sách
            var selected = trySelectValueInLov(lovFound);
            if (selected) {
                return "Success";
            }
        }
    }

    // Nếu sau thời gian chờ mà popup LOV đang hiển thị nhưng không tìm được giá trị khớp
    if (lovFound && isVisible(lovFound.container)) {
        return "NOT_FOUND";
    }

    // Nếu không có bất kỳ popup LOV nào hiện lên (hệ thống chấp nhận mã hợp lệ ngay lập tức)
    return "Success";
}