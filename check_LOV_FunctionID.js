function ExecuteScript() {
    // Hàm quét ngược lên gốc DOM để đảm bảo không có bất kỳ thẻ cha nào bị ẩn
    function isTrulyVisible(el, win) {
        if (!el) return false;
        var current = el;
        
        while (current && current !== win.document) {
            if (current.nodeType === 1) { // Chỉ xét Element node
                var style = win.getComputedStyle(current);
                
                // Nếu thẻ hiện tại hoặc bất kỳ cha nào bị ẩn bằng css hoặc aria-hidden -> Trả về false ngay
                if (style.display === 'none' || style.visibility === 'hidden') return false;
                if (current.getAttribute('aria-hidden') === 'true') return false;
            }
            current = current.parentNode; // Tiến lên thẻ cha bọc ngoài
        }
        return true;
    }

    function checkAndCloseLov(win) {
        try {
            var doc = win.document;
            if (!doc) return false;

            // 1. Tìm nút đóng LOV trên khung hiện tại
            var closeBtns = doc.querySelectorAll('#WNDbuttonsMin, .oj-dialog-header-close');
            for (var b = 0; b < closeBtns.length; b++) {
                var btn = closeBtns[b];
                
                // Nút đóng phải thực sự tồn tại kích thước VÀ không bị ẩn bởi bất kỳ thẻ cha nào
                if (btn.offsetWidth > 0 && isTrulyVisible(btn, win)) {
                    
                    // Thực hiện đóng bảng LOV
                    if (typeof win.fnExitLov === 'function') {
                        win.fnExitLov();
                    } else {
                        var innerBtn = btn.querySelector('button') || btn;
                        innerBtn.click();
                    }
                    return true; // Xác nhận có bảng LOV thật bật lên
                }
            }

            // 2. Chui vào các iframe để tìm tiếp
            var frames = doc.querySelectorAll('iframe');
            for (var i = 0; i < frames.length; i++) {
                var frameEl = frames[i];
                
                // CHỐT CHẶN TỬ HUYỆT: Chỉ chui vào iframe quét nếu bản thân thẻ iframe đó 
                // (hoặc thẻ Div_ChildWin bọc ngoài nó) đang hiển thị thực sự trên màn hình
                if (isTrulyVisible(frameEl, win)) {
                    if (checkAndCloseLov(frameEl.contentWindow)) {
                        return true;
                    }
                }
            }
        } catch(e) {}
        
        return false;
    }

    // Bắt đầu thực thi
    var isShowing = checkAndCloseLov(window);
    
    // Nếu quét thấy nút đóng và bấm được -> Bảng LOV có thật -> FunctionID sai
    if (isShowing) {
        return "NOT_FOUND";
    }
    
    // An toàn lướt qua mọi thẻ ngầm -> Không có LOV -> FunctionID đúng
    return "Success";
}