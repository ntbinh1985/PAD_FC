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

    // 1. Tìm frame chứa input ROLEFUN của Maintenance
    var targetDoc = findDoc(window, '#dataContainer_BLK_ROLEDETAIL') || findDoc(window, 'input[id*="BLK_ROLEDETAIL__ROLEFUNRC"]') || findDoc(window, 'input[name="ROLEFUN"]');
    if (!targetDoc) return "ERROR_NO_FRAME";

    var funcIdVal = "%CurrentRow['FunctionID']%".trim();

    // 2. Lấy ô input ở dòng cuối cùng của bảng Maintenance
    var allInputs = Array.from(targetDoc.querySelectorAll('input[name="ROLEFUN"]'));
    var funcInputs = allInputs.filter(function(el) {
        return el.id.includes('BLK_ROLEDETAIL__') || (!el.id.includes('ROLEDETAILD') && el.id.includes('ROLEFUNRC'));
    });
    if (funcInputs.length === 0) funcInputs = allInputs;
    if (funcInputs.length === 0) return "ERROR_NO_ROW";

    var targetInput = funcInputs[funcInputs.length - 1];

    // 3. Điền giá trị vào ô input và kích hoạt sự kiện của FC
    targetInput.focus();
    targetInput.value = funcIdVal;
    targetInput.dispatchEvent(new Event('input', { bubbles: true }));
    targetInput.dispatchEvent(new Event('change', { bubbles: true }));
    targetInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
    targetInput.blur();

    // 4. Hàm tìm bảng LOV xem có đang mở trên màn hình không
    function findLovDialog(win) {
        try {
            var doc = win.document;
            var dialogs = Array.from(doc.querySelectorAll('oj-dialog, div[role="dialog"], .oj-dialog'));
            for (var i = 0; i < dialogs.length; i++) {
                var titleText = dialogs[i].innerText || dialogs[i].textContent || "";
                if (titleText.includes("List of Values Role Function")) {
                    return { doc: doc, dlg: dialogs[i] };
                }
            }
            var frames = doc.querySelectorAll('iframe');
            for (var j = 0; j < frames.length; j++) {
                var res = findLovDialog(frames[j].contentWindow);
                if (res) return res;
            }
        } catch(e) {}
        return null;
    }

    // 5. Hàm đóng riêng bảng popup LOV
    function closeLov(lovObj) {
        if (!lovObj || !lovObj.dlg) return;
        var closeBtn = lovObj.dlg.querySelector('.oj-dialog-header-close-wrapper button, button[title="Close"], .oj-dialog-close-icon');
        if (closeBtn) {
            ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(function(ev) {
                closeBtn.dispatchEvent(new MouseEvent(ev, { bubbles: true, cancelable: true, view: lovObj.doc.defaultView }));
            });
        }
    }

    // 6. Kiểm tra sau khi đã chờ hệ thống xử lý
    setTimeout(function() {
        var lovObj = findLovDialog(window);

        // Trường hợp A: Bảng LOV KHÔNG xuất hiện -> FC đã tự động nhận diện giá trị khớp hoàn toàn
        if (!lovObj) {
            // Giữ nguyên dữ liệu, không làm gì cả
            return;
        }

        // Trường hợp B: Bảng LOV CÓ xuất hiện -> Quét tìm dòng khớp bên trong bảng
        var cells = Array.from(lovObj.dlg.querySelectorAll('td, div[role="gridcell"], span.oj-table-cell-text'));
        var foundCell = null;

        for (var i = 0; i < cells.length; i++) {
            if (cells[i].textContent.trim().toUpperCase() === funcIdVal.toUpperCase()) {
                foundCell = cells[i];
                break;
            }
        }

        if (foundCell) {
            // Tìm thấy -> Click chọn dòng và bấm Enter
            var row = foundCell.closest('tr') || foundCell.closest('div[role="row"]') || foundCell;
            ['mousedown', 'mouseup', 'click', 'dblclick'].forEach(function(evt) {
                foundCell.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: lovObj.doc.defaultView }));
                row.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: lovObj.doc.defaultView }));
            });
            var enter = new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true });
            row.dispatchEvent(enter);
            foundCell.dispatchEvent(enter);
        } else {
            // Không tìm thấy trong danh sách LOV -> Lúc này MỚI xóa trắng ô và tắt LOV
            targetInput.focus();
            targetInput.value = "";
            targetInput.dispatchEvent(new Event('input', { bubbles: true }));
            targetInput.dispatchEvent(new Event('change', { bubbles: true }));
            targetInput.blur();

            closeLov(lovObj);
        }
    }, 1500); // Tăng thời gian chờ lên 1.5s để LOV kịp tải danh sách từ server

    return "SUCCESS";
}