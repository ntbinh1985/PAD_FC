function ExecuteScript() {
    function findDoc(win, sel) {
        try {
            var doc = win.document;
            if (doc.querySelector(sel)) return doc;
            var frames = doc.querySelectorAll('iframe');
            for (var i = 0; i < frames.length; i++) {
                var found = findDoc(frames[i].contentWindow, sel);
                if (found) return found;
            }
        } catch(e) {}
        return null;
    }

    // 1. Tìm frame chứa bảng Maintenance
    var targetDoc = findDoc(window, '#dataContainer_BLK_ROLEDETAIL') || findDoc(window, 'input[id*="BLK_ROLEDETAIL__ROLEFUNRC"]') || findDoc(window, 'input[name="ROLEFUN"]');
    if (!targetDoc) return "ERROR_NO_FRAME";

    var funcIdVal = "%CurrentRow['FunctionID']%".trim();

    // 2. Tìm ô input ở dòng cuối cùng
    var allInputs = Array.from(targetDoc.querySelectorAll('input[name="ROLEFUN"]'));
    var funcInputs = allInputs.filter(function(el) {
        return el.id.includes('BLK_ROLEDETAIL__') || (!el.id.includes('ROLEDETAILD') && el.id.includes('ROLEFUNRC'));
    });
    if (funcInputs.length === 0) funcInputs = allInputs;
    if (funcInputs.length === 0) return "ERROR_NO_ROW";

    var targetInput = funcInputs[funcInputs.length - 1];

    // 3. Điền giá trị vào ô input và giữ nguyên (KHÔNG BAO GIỜ XÓA)
    targetInput.focus();
    targetInput.value = funcIdVal;
    targetInput.dispatchEvent(new Event('input', { bubbles: true }));
    targetInput.dispatchEvent(new Event('change', { bubbles: true }));
    targetInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
    targetInput.blur();

    // 4. Hàm tìm và đóng riêng popup "List of Values Role Function"
    function forceCloseLovPopup(win) {
        try {
            var doc = win.document;
            
            // Tìm tất cả các dialog đang hiển thị
            var dialogs = Array.from(doc.querySelectorAll('oj-dialog, div[role="dialog"], .oj-dialog, .ui-dialog'));
            for (var i = 0; i < dialogs.length; i++) {
                var dlg = dialogs[i];
                var text = dlg.innerText || dlg.textContent || "";
                
                // Nhận diện chính xác popup LOV Role Function
                if (text.includes("List of Values Role Function")) {
                    // Quét toàn bộ các selector nút đóng X của Oracle JET
                    var closeBtn = dlg.querySelector('.oj-dialog-header-close-wrapper button') ||
                                   dlg.querySelector('button[title="Close"]') ||
                                   dlg.querySelector('button[aria-label="Close"]') ||
                                   dlg.querySelector('.oj-dialog-close-icon') ||
                                   dlg.querySelector('.oj-dialog-header-close-wrapper a') ||
                                   dlg.querySelector('a.ui-dialog-titlebar-close');

                    if (closeBtn) {
                        try { closeBtn.click(); } catch(e) {}
                        ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(function(evName) {
                            var ev = new MouseEvent(evName, { bubbles: true, cancelable: true, view: win });
                            closeBtn.dispatchEvent(ev);
                        });
                        return true;
                    }
                }
            }

            var frames = doc.querySelectorAll('iframe');
            for (var j = 0; j < frames.length; j++) {
                if (forceCloseLovPopup(frames[j].contentWindow)) return true;
            }
        } catch(e) {}
        return false;
    }

    // 5. Hàm quét dòng kết quả trong LOV
    function checkAndHandleLov(win) {
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
            for (var k = 0; k < frames.length; k++) {
                if (checkAndHandleLov(frames[k].contentWindow)) return true;
            }
        } catch(e) {}
        return false;
    }

    // 6. Xử lý sau 1.2s: nếu tìm thấy thì chọn, nếu không thì chỉ đóng LOV
    setTimeout(function() {
        var found = checkAndHandleLov(window);
        if (!found) {
            // Không tìm thấy trong LOV: Chỉ tắt bảng LOV đi, giá trị đã điền trong ô targetInput giữ nguyên 100%
            var closed = forceCloseLovPopup(window);
            if (!closed) {
                try {
                    if (window.top && window.top !== window) {
                        forceCloseLovPopup(window.top);
                    }
                } catch(e) {}
            }
        }
    }, 1200);

    return "SUCCESS";
}