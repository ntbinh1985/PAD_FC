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

    // 1. Quét tìm document chứa nút đóng hoặc dialog LOV
    function checkAndCloseLov(win) {
        try {
            var doc = win.document;
            if (!doc) return false;

            // Tìm dialog LOV theo id chuẩn trên HTML
            var dialog = doc.querySelector('oj-dialog#scrollingDialog');
            
            // Tìm nút đóng theo đúng ID "WNDbuttonsMin" và thuộc tính title="Close"
            var closeBtnComponent = doc.querySelector('#WNDbuttonsMin, oj-button[title="Close"]');
            var closeButtonEl = closeBtnComponent ? (closeBtnComponent.querySelector('button') || closeBtnComponent) : null;

            // Kiểm tra trạng thái hiển thị của dialog
            var isDialogVisible = false;
            if (dialog) {
                var style = win.getComputedStyle(dialog);
                if (style.display !== 'none' && style.visibility !== 'hidden' && dialog.offsetWidth > 0) {
                    isDialogVisible = true;
                }
            }

            // Nếu dialog hiển thị hoặc nút đóng WNDbuttonsMin đang tồn tại và nhìn thấy được
            if (isDialogVisible || (closeButtonEl && closeButtonEl.offsetWidth > 0)) {
                // Ưu tiên 1: Gọi hàm đóng gốc fnExitLov() của Flexcube nếu window chứa hàm này
                if (typeof win.fnExitLov === 'function') {
                    win.fnExitLov();
                } 
                // Ưu tiên 2: Click vào button thật sự bên trong oj-button
                else if (closeButtonEl) {
                    closeButtonEl.click();
                } else if (closeBtnComponent) {
                    closeBtnComponent.click();
                }

                return true;
            }

            // Đệ quy quét qua tất cả các iframe con
            var frames = doc.querySelectorAll('iframe');
            for (var i = 0; i < frames.length; i++) {
                if (checkAndCloseLov(frames[i].contentWindow)) return true;
            }
        } catch(e) {}
        return false;
    }

    // 2. Thực thi kiểm tra
    var isLovClosed = checkAndCloseLov(window);

    // Nếu phát hiện và đóng bảng LOV -> Function ID không tồn tại
    if (isLovClosed) {
        return "NOT_FOUND";
    }

    // Không xuất hiện bảng LOV -> Function ID hợp lệ
    return "Success";
}