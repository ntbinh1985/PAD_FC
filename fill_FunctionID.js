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

   // 1. Tìm frame chứa ô nhập Function ID
   var targetDoc = findDoc(window, 'input[name="ROLEFUN"]');
   if (!targetDoc) return "ERROR_NO_FRAME";

   // Biến Function ID truyền từ vòng lặp Excel trong PAD
   var funcIdVal = "%CurrentRow['FunctionId']%".trim();

   // Lấy ô input Function ID ở dòng cuối cùng (dòng đang thêm/dòng trống)
   var funcInputs = Array.from(targetDoc.querySelectorAll('input[id*="ROLEFUNRC"]'));
   if (funcInputs.length === 0) return "ERROR_NO_ROW";

   var targetInput = funcInputs[funcInputs.length - 1];

   // 2. Điền giá trị vào ô Function ID
   targetInput.focus();
   targetInput.value = funcIdVal;
   targetInput.dispatchEvent(new Event('input', { bubbles: true }));
   targetInput.dispatchEvent(new Event('change', { bubbles: true }));
   targetInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
   targetInput.blur();

   // 3. Hàm tìm và chọn giá trị trong LOV
   function checkAndSelectLov(win) {
       try {
           var doc = win.document;
           var cells = Array.from(doc.querySelectorAll('td, div[role="gridcell"]'));
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
           for (var j = 0; j < frames.length; j++) {
               if (checkAndSelectLov(frames[j].contentWindow)) return true;
           }
       } catch(e) {}
       return false;
   }

   // 4. Hàm đóng LOV / Popup nếu không tìm thấy
   function closeLovPopup(win) {
       try {
           var doc = win.document;
           // Tìm nút Close / Cancel hoặc gửi ESC
           var closeBtn = doc.querySelector('.oj-dialog-header-close-wrapper button, button[title="Close"], .ui-dialog-titlebar-close');
           if (closeBtn) {
               closeBtn.click();
           } else {
               var escEvt = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true });
               doc.dispatchEvent(escEvt);
               if (doc.activeElement) doc.activeElement.dispatchEvent(escEvt);
           }
           var frames = doc.querySelectorAll('iframe');
           for (var j = 0; j < frames.length; j++) {
               closeLovPopup(frames[j].contentWindow);
           }
       } catch(e) {}
   }

   // 5. Kiểm tra đồng bộ kết quả LOV (thử quét ngay và qua các frame)
   var isFound = checkAndSelectLov(window);

   if (!isFound) {
       // Nếu không tìm thấy, xóa trắng ô hiện tại để tái sử dụng ngay dòng này cho lần lặp tiếp theo
       targetInput.focus();
       targetInput.value = "";
       targetInput.dispatchEvent(new Event('input', { bubbles: true }));
       targetInput.dispatchEvent(new Event('change', { bubbles: true }));
       targetInput.blur();

       // Đóng popup cảnh báo / popup LOV rác nếu có
       closeLovPopup(window);
       return "NOT_FOUND";
   }

   return "SUCCESS";
}