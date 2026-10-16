function ExecuteScript() {
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
    if (!targetDoc) return "Error: Không tìm thấy frame nhập liệu";

    var roleVal = "%CurrentRole['RoleFunction']%".trim();

    var roleInputs = Array.from(targetDoc.querySelectorAll('input[id*="BLK_ROLEDETAIL__ROLEFUNRC"]'));
    if (roleInputs.length === 0) return "Error: Chưa có dòng nào trên bảng";

    var targetRoleInput = roleInputs[roleInputs.length - 1];

    function fillField(inputEl, val) {
        if (!inputEl) return;
        inputEl.focus();
        inputEl.value = val;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
        inputEl.blur();
    }

    // Điền Role Function
    fillField(targetRoleInput, roleVal);

    // Quét và xử lý popup LOV (nếu bật lên)
    function handleLov(win) {
        try {
            var doc = win.document;
            var cells = Array.from(doc.querySelectorAll('td, div[role="gridcell"]'));
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
            var frames = doc.querySelectorAll('iframe');
            for (var j = 0; j < frames.length; j++) {
                if (handleLov(frames[j].contentWindow)) return true;
            }
        } catch(e) {}
        return false;
    }

    // Chờ 600ms cho popup LOV xuất hiện nếu có
    setTimeout(function() {
        handleLov(window);
        if (targetDoc.activeElement && targetDoc.activeElement.blur) {
            targetDoc.activeElement.blur();
        }
        if (targetDoc.body) {
            targetDoc.body.focus();
        }
    }, 600);

    return "DONE";
}