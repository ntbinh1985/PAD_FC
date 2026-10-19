function ExecuteScript() {
    // Hàm quét tìm và đóng bảng LOV xuyên qua mọi lớp iframe
    function scanAndCloseLov(win) {
        try {
            var doc = win.document;
            if (!doc) return false;

            // 1. Kiểm tra trực tiếp nút đóng WNDbuttonsMin trong window hiện tại
            var closeBtnComponent = doc.querySelector('#WNDbuttonsMin');
            if (closeBtnComponent && (closeBtnComponent.offsetWidth > 0 || closeBtnComponent.offsetHeight > 0)) {
                // Ưu tiên gọi hàm fnExitLov của hệ thống để đóng
                if (typeof win.fnExitLov === 'function') {
                    win.fnExitLov();
                } else {
                    var realBtn = closeBtnComponent.querySelector('button') || closeBtnComponent;
                    realBtn.click();
                }
                return true; // Đã tìm thấy và đóng
            }

            // 2. Tìm thẻ bọc ngoài ChildWin chứa iframe ifrSubScreen
            var childWin = doc.getElementById('ChildWin');
            if (childWin) {
                var style = win.getComputedStyle(childWin);
                if (style.display === 'block') { // Flexcube set style="display: block;" khi LOV hiện
                    
                    var subIframe = doc.getElementById('ifrSubScreen');
                    if (subIframe && subIframe.contentWindow) {
                        // Thử can thiệp vào iframe LOV con để tìm nút đóng
                        var subDoc = subIframe.contentWindow.document;
                        var subClose = subDoc.querySelector('#WNDbuttonsMin');
                        if (subClose) {
                            if (typeof subIframe.contentWindow.fnExitLov === 'function') {
                                subIframe.contentWindow.fnExitLov();
                            } else {
                                var btn = subClose.querySelector('button') || subClose;
                                btn.click();
                            }
                            return true;
                        }
                    }
                    
                    // Phương án dự phòng: Nếu không click được nút, ép ẩn hẳn thẻ div bọc ngoài
                    childWin.style.display = 'none';
                    return true; // LOV có xuất hiện (dù đóng bằng cách ép ẩn)
                }
            }

            // 3. Đệ quy tiếp tục chui vào các iframe khác (iframe giao diện chính của Flexcube)
            var frames = doc.querySelectorAll('iframe');
            for (var i = 0; i < frames.length; i++) {
                if (scanAndCloseLov(frames[i].contentWindow)) {
                    return true;
                }
            }
        } catch (e) {
            // Bỏ qua lỗi DOM bảo mật cross-origin nếu có
        }
        return false;
    }

    // Bắt đầu quét từ window ngoài cùng
    var isLovFound = scanAndCloseLov(window);

    if (isLovFound) {
        return "NOT_FOUND"; // Phát hiện có bảng LOV hiện lên -> Function ID sai
    }

    return "Success"; // Hoàn toàn không có bảng LOV nào hiển thị -> Function ID đúng
}