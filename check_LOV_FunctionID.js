function ExecuteScript() {
    // 1. Kiểm tra khung chứa popup LOV trên trang chính
    var childWin = document.getElementById('ChildWin');
    var iframe = document.getElementById('ifrSubScreen');

    // Nếu thẻ bọc ngoài không tồn tại, bị ẩn (display: none), hoặc không có iframe
    // => Chắc chắn LOV không xuất hiện => Trả về Success
    if (!childWin || childWin.style.display === 'none' || !iframe) {
        return "Success";
    }

    // 2. Can thiệp vào bên trong iframe chứa LOV
    try {
        var doc = iframe.contentWindow.document;
        var win = iframe.contentWindow;

        // Bắt chính xác bảng LOV theo ID
        var dialog = doc.getElementById('scrollingDialog');
        
        if (dialog) {
            var style = win.getComputedStyle(dialog);
            // Xác nhận bảng thực sự đang hiển thị
            if (style.display !== 'none' && style.visibility !== 'hidden') {
                
                // Tìm nút đóng
                var closeBtnComponent = doc.getElementById('WNDbuttonsMin');
                if (closeBtnComponent) {
                    
                    // Phương án A: Gọi trực tiếp hàm gốc của Flexcube nằm trong iframe
                    if (typeof win.fnExitLov === 'function') {
                        win.fnExitLov();
                    } 
                    // Phương án B: Click vật lý vào thẻ button bên trong
                    else {
                        var realBtn = closeBtnComponent.querySelector('button');
                        if (realBtn) {
                            realBtn.click();
                        } else {
                            closeBtnComponent.click();
                        }
                    }
                    
                    // Đã đóng thành công bảng LOV => Function ID không hợp lệ
                    return "NOT_FOUND";
                }
            }
        }
    } catch (e) {
        // Lỗi DOM / Cross-Origin (ít xảy ra vì chung hệ thống)
        // Nếu div ChildWin đang block mà không can thiệp được iframe, ép ẩn div đó đi
        if (childWin && childWin.style.display === 'block') {
            childWin.style.display = 'none';
            return "NOT_FOUND";
        }
    }

    return "Success";
}