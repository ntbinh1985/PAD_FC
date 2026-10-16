function ExecuteScript() {
    function findDoc(win) {
        try {
            var doc = win.document;
            if (doc.querySelector('oj-input-text[id*="BLK_ROLEDETAIL__ROLEFUNRC"]') || doc.querySelector('oj-input-text[dbt="BLK_ROLEDETAIL"][dbc="ROLEFUN"]')) {
                return doc;
            }
            var frames = doc.querySelectorAll('iframe');
            for (var i = 0; i < frames.length; i++) {
                var found = findDoc(frames[i].contentWindow);
                if (found) return found;
            }
        } catch(e) {}
        return null;
    }

    // 1. Tìm frame chứa component nhập liệu
    var targetDoc = findDoc(window);
    if (!targetDoc) return "ERROR_NO_FRAME";

    var funcIdVal = "%CurrentRow['FunctionID']%".trim();

    // 2. Tìm danh sách oj-input-text của bảng BLK_ROLEDETAIL
    var ojInputs = Array.from(targetDoc.querySelectorAll('oj-input-text[id*="BLK_ROLEDETAIL__ROLEFUNRC"], oj-input-text[dbt="BLK_ROLEDETAIL"][dbc="ROLEFUN"]'));
    if (ojInputs.length === 0) return "ERROR_NO_ROW";

    // Lấy dòng cuối cùng (dòng vừa add row hoặc dòng đang chờ nhập)
    var targetOj = ojInputs[ojInputs.length - 1];
    var innerInput = targetOj.querySelector('input');

    // 3. ĐIỀN DỮ LIỆU ĐỒNG THỜI VÀO CẢ ORACLE JET VÀ INPUT THẬT
    try {
        // Cập nhật giá trị trực tiếp cho Oracle JET Element
        targetOj.value = funcIdVal;
    } catch(e) {}

    if (innerInput) {
        innerInput.focus();
        innerInput.value = funcIdVal;
        innerInput.dispatchEvent(new Event('input', { bubbles: true }));
        innerInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Kích hoạt onchange trên thẻ oj-input-text để gọi disp_auto_lov của FC
    targetOj.dispatchEvent(new CustomEvent('valueChanged', { detail: { value: funcIdVal }, bubbles: true }));
    targetOj.dispatchEvent(new Event('change', { bubbles: true }));

    // 4. Quét kiểm tra LOV
    function checkAndSelectLov(win) {
        try {
            var doc = win.document;
            var cells = Array.from(doc.querySelectorAll('td, div[role="gridcell"], span.oj-table-cell-text'));
            for (var i = 0; i < cells.length; i++) {
                if (cells[i].textContent.trim().toUpperCase() === funcIdVal.toUpperCase()) {
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
                if (checkAndSelectLov(frames[j].contentWindow)) return true;
            }
        } catch(e) {}
        return false;
    }

    // 5. Hàm đóng riêng bảng popup LOV (dựa vào class và title)
    function closeLovModal(win) {
        try {
            var doc = win.document;
            var dialogs = Array.from(doc.querySelectorAll('oj-dialog, div[role="dialog"], .oj-dialog'));
            for (var d = 0; d < dialogs.length; d++) {
                var dlg = dialogs[d];
                var text = dlg.innerText || dlg.textContent || "";
                if (text.includes("List of Values Role Function")) {
                    var closeBtn = dlg.querySelector('.oj-dialog-header-close-wrapper button, button[title="Close"], .oj-dialog-close-icon');
                    if (closeBtn) {
                        closeBtn.click();
                        return true;
                    }
                }
            }
            var frames = doc.querySelectorAll('iframe');
            for (var k = 0; k < frames.length; k++) {
                if (closeLovModal(frames[k].contentWindow)) return true;
            }
        } catch(e) {}
        return false;
    }

    var isFound = checkAndSelectLov(window);

    if (!isFound) {
        // Xóa sạch để dùng lại dòng này
        try { targetOj.value = ""; } catch(e) {}
        if (innerInput) {
            innerInput.value = "";
            innerInput.dispatchEvent(new Event('input', { bubbles: true }));
            innerInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        targetOj.dispatchEvent(new Event('change', { bubbles: true }));

        // Tắt bảng LOV
        closeLovModal(window);
        try {
            if (window.top && window.top !== window) {
                closeLovModal(window.top);
            }
        } catch(e) {}

        return "NOT_FOUND";
    }

    return "SUCCESS";
}