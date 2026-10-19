function ExecuteScript() {
    function checkAndCloseLov(win) {
        try {
            var doc = win.document;
            if (!doc) return false;

            // 1. Kiểm tra chính xác thẻ bọc ngoài bảng LOV (Div_ChildWin hoặc ChildWin)
            var divChildWin = doc.getElementById('Div_ChildWin');
            var childWin = doc.getElementById('ChildWin');
            var targetWin = divChildWin || childWin;

            if (targetWin) {
                // Kiểm tra xem hệ thống có đang đánh dấu ẩn thẻ này không
                var isAriaHidden = targetWin.getAttribute('aria-hidden') === 'true';
                var style = win.getComputedStyle(targetWin);
                
                // CHỈ KHI thẻ không bị aria-hidden VÀ có display khác none => Bảng LOV thực sự đang bật lên
                if (!isAriaHidden && style.display !== 'none' && style.visibility !== 'hidden') {
                    
                    // Bảng đang mở -> Xử lý đóng bảng
                    var iframe = doc.getElementById('ifrSubScreen');
                    if (iframe && iframe.contentWindow) {
                        try {
                            var subWin = iframe.contentWindow;
                            if (typeof subWin.fnExitLov === 'function') {
                                subWin.fnExitLov();
                            } else {
                                var closeBtn = subWin.document.querySelector('#WNDbuttonsMin button') || subWin.document.getElementById('WNDbuttonsMin');
                                if (closeBtn) closeBtn.click();
                            }
                        } catch(e) {}
                    }
                    // Báo hiệu đã tìm thấy bảng LOV hiển thị
                    return true; 
                }
            }

            // 2. Dự phòng: Quét dialog LOV ở lớp ngoài cùng (nếu có)
            var dialog = doc.getElementById('scrollingDialog');
            if (dialog) {
                var dIsAriaHidden = dialog.getAttribute('aria-hidden') === 'true';
                var dStyle = win.getComputedStyle(dialog);
                
                if (!dIsAriaHidden && dStyle.display !== 'none' && dialog.classList.contains('oj-dialog-open')) {
                    var dCloseBtn = doc.querySelector('#WNDbuttonsMin');
                    if (typeof win.fnExitLov === 'function') {
                        win.fnExitLov();
                    } else if (dCloseBtn) {
                        dCloseBtn.click();
                    }
                    return true;
                }
            }

            // 3. Đệ quy tiếp tục chui vào các iframe con để quét
            var frames = doc.querySelectorAll('iframe');
            for (var i = 0; i < frames.length; i++) {
                if (checkAndCloseLov(frames[i].contentWindow)) return true;
            }
        } catch(e) {}
        
        return false;
    }

    // Bắt đầu thực thi từ cửa sổ gốc
    var isShowing = checkAndCloseLov(window);
    
    if (isShowing) {
        // Bảng LOV xuất hiện thật trên màn hình -> FunctionID không tồn tại
        return "NOT_FOUND"; 
    }
    
    // Không có bảng LOV nào hiển thị -> FunctionID hợp lệ
    return "Success"; 
}