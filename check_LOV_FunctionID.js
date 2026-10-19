function ExecuteScript() {
    function checkAndCloseLov(win) {
        var doc;
        // Bọc try-catch riêng cho document để nếu đụng iframe cấm truy cập thì bỏ qua nhẹ nhàng
        try {
            doc = win.document;
        } catch(e) {
            return false; 
        }
        if (!doc) return false;

        // 1. Quét khung LOV ở cấp độ hiện tại
        try {
            var dialogs = doc.querySelectorAll('oj-dialog#scrollingDialog, div#scrollingDialog, div.lov-container');
            for (var d = 0; d < dialogs.length; d++) {
                var dialog = dialogs[d];
                var rect = dialog.getBoundingClientRect();
                var style = win.getComputedStyle(dialog);
                var isAriaHidden = dialog.getAttribute('aria-hidden') === 'true';

                // Hạ tiêu chuẩn kích thước xuống > 20px để bắt bảng kể cả khi nó đang animation
                if (rect.width > 20 && rect.height > 20 && style.display !== 'none' && !isAriaHidden) {
                    
                    if (typeof win.fnExitLov === 'function') {
                        win.fnExitLov();
                    } else {
                        var closeBtn = dialog.querySelector('.oj-dialog-header-close, #WNDbuttonsMin, button[title="Close"]');
                        if (closeBtn) {
                            var innerBtn = closeBtn.querySelector('button') || closeBtn;
                            innerBtn.click();
                        }
                    }
                    return true;
                }
            }
        } catch(e) {}

        // 2. Quét vào iframe con
        var frames;
        try {
            frames = doc.querySelectorAll('iframe');
        } catch(e) { 
            frames = []; 
        }

        for (var i = 0; i < frames.length; i++) {
            var f = frames[i];
            try {
                // CHỐT TỬ HUYỆT: try-catch phải nằm BÊN TRONG vòng lặp
                // Đề phòng 1 iframe bị lỗi CORS thì chỉ bỏ qua nó, vẫn quét tiếp các iframe khác!
                var fStyle = win.getComputedStyle(f);
                if (fStyle.display !== 'none') {
                    if (checkAndCloseLov(f.contentWindow)) {
                        return true;
                    }
                }
            } catch(e) {
                // Nuốt lỗi iframe này, âm thầm đi tiếp
            }
        }
        
        return false;
    }

    var isShowing = checkAndCloseLov(window);

    if (isShowing) {
        return "NOT_FOUND";
    }

    return "Success";
}