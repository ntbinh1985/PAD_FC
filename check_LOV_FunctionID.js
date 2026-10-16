function ExecuteScript() {
    function checkLovDialog(win) {
        try {
            var doc = win.document;
            if (!doc) return null;

            // Bắt chính xác id "scrollingDialog" từ HTML của Flexcube
            var dialog = doc.querySelector('oj-dialog#scrollingDialog, div#scrollingDialog_layer, oj-dialog[aria-labelledby="WNDtitlebar"]');

            if (dialog) {
                var rect = dialog.getBoundingClientRect();
                var style = win.getComputedStyle(dialog);
                
                // Kiểm tra xem dialog có đang hiển thị thực tế không
                if (rect.width > 100 && rect.height > 100 && style.display !== 'none' && style.visibility !== 'hidden') {
                    // Tìm và bấm nút đóng (dấu X) trên dialog để đóng bảng lại
                    var closeBtn = dialog.querySelector('.oj-dialog-header-close-wrapper button, a.oj-dialog-header-close, button[title="Close"]');
                    if (closeBtn) {
                        closeBtn.click();
                    } else {
                        // Nếu không thấy nút đóng thì gửi phím Escape
                        var escEvent = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, which: 27, bubbles: true });
                        dialog.dispatchEvent(escEvent);
                    }
                    return true;
                }
            }

            var frames = doc.querySelectorAll('iframe');
            for (var i = 0; i < frames.length; i++) {
                if (checkLovDialog(frames[i].contentWindow)) return true;
            }
        } catch(e) {}
        return false;
    }

    // Nếu bảng LOV đang mở -> FunctionID không tồn tại
    if (checkLovDialog(window)) {
        return "NOT_FOUND_INFO";
    }

    return "Success";
}