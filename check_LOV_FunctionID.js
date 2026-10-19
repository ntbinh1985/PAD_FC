function ExecuteScript() {
    function checkAndCloseLov(win) {
        try {
            var doc = win.document;
            if (!doc) return false;

            // 1. Tìm trực tiếp khung bảng LOV
            var dialogs = doc.querySelectorAll('oj-dialog#scrollingDialog, div#scrollingDialog, div.lov-container');

            for (var d = 0; d < dialogs.length; d++) {
                var dialog = dialogs[d];
                var rect = dialog.getBoundingClientRect();
                var style = win.getComputedStyle(dialog);
                var isAriaHidden = dialog.getAttribute('aria-hidden') === 'true';

                // 2. Kiểm tra gắt gao: Phải to, đang hiển thị và không bị giấu ngầm mới là LOV thật
                if (rect.width > 50 && rect.height > 50 && style.display !== 'none' && !isAriaHidden) {
                    
                    // 3. Tiến hành đóng bảng LOV
                    if (typeof win.fnExitLov === 'function') {
                        win.fnExitLov(); // Ưu tiên gọi hàm native của Flexcube
                    } else {
                        // Chỉ tìm nút đóng nằm GỌN TRONG bảng LOV này (tránh click nhầm dấu X của màn hình chính)
                        var closeBtn = dialog.querySelector('.oj-dialog-header-close, #WNDbuttonsMin, button[title="Close"]');
                        if (closeBtn) {
                            var innerBtn = closeBtn.querySelector('button') || closeBtn;
                            innerBtn.click();
                        }
                    }

                    return true; // Xác nhận CÓ bảng LOV và đã xử lý
                }
            }

            // 4. Quét đệ quy vào các iframe con đang hiển thị
            var frames = doc.querySelectorAll('iframe');
            for (var i = 0; i < frames.length; i++) {
                var f = frames[i];
                var fRect = f.getBoundingClientRect();
                var fStyle = win.getComputedStyle(f);

                // Chỉ quét iframe nếu bản thân iframe đó đang hiển thị
                if (fStyle.display !== 'none' && fRect.width > 0) {
                    if (checkAndCloseLov(f.contentWindow)) {
                        return true;
                    }
                }
            }
        } catch(e) {
            // Bỏ qua lỗi CORS nếu có
        }

        return false;
    }

    // Bắt đầu quét từ cửa sổ gốc
    var isShowing = checkAndCloseLov(window);

    // KẾT LUẬN
    if (isShowing) {
        return "NOT_FOUND"; // Function ID sai -> Bung bảng LOV -> Trả về NOT_FOUND
    }

    return "Success"; // Function ID đúng -> Bảng ẩn/không bật -> Trả về Success
}