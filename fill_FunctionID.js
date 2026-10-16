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

   // 1. Tìm frame chứa ô nhập liệu Function ID
   var targetDoc = findDoc(window, 'input[name="ROLEFUN"]');
   if (!targetDoc) return "ERROR_NO_FRAME";

   // Lấy giá trị biến Function ID từ Power Automate Desktop
   var funcIdVal = "%CurrentRow['FunctionID']%".trim();

   // Lấy danh sách các ô input ROLEFUN trên bảng (dòng cuối cùng là dòng cần điền)
   var funcInputs = Array.from(targetDoc.querySelectorAll('input[id*="ROLEFUNRC"]'));
   if (funcInputs.length === 0) return "ERROR_NO_ROW";

   var targetInput = funcInputs[funcInputs.length - 1];

   // 2. Điền giá trị vào ô input và kích hoạt các event
   targetInput.focus();
   targetInput.value = funcIdVal;
   targetInput.dispatchEvent(new Event('input', { bubbles: true }));
   targetInput.dispatchEvent(new Event('change', { bubbles: true }));
   targetInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
   targetInput.blur();

   // 3. Hàm quét và chọn dòng khớp trong LOV
   function checkAndSelectLov(win) {
       try {
           var doc = win.document;
           var cells = Array.from(doc.querySelectorAll('td, div[role="gridcell"], span.oj-table-cell-text'));
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

   // 4. Hàm đóng triệt để LOV/Popup trên mọi frame
   function forceCloseLov(win) {
       try {
           var doc = win.document;
           var closeSelectors = [
               '.oj-dialog-header-close-wrapper button',
               'button[title="Close"]',
               'button[aria-label="Close"]',
               '.ui-dialog-titlebar-close',
               '#BTN_EXIT',
               '#BTN_CANCEL',
               '.oj-dialog-footer button'
           ];
           for (var s = 0; s < closeSelectors.length; s++) {
               var btns = doc.querySelectorAll(closeSelectors[s]);
               btns.forEach(function(b) {
                   try { b.click(); } catch(err) {}
               });
           }

           // Gửi phím Escape vào document và activeElement
           var esc = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true });
           doc.dispatchEvent(esc);
           if (doc.activeElement) {
               doc.activeElement.dispatchEvent(esc);
           }

           var frames = doc.querySelectorAll('iframe');
           for (var k = 0; k < frames.length; k++) {
               forceCloseLov(frames[k].contentWindow);
           }
       } catch(e) {}
   }

   // 5. Kiểm tra kết quả hiển thị
   var isFound = checkAndSelectLov(window);

   if (!isFound) {
       // Xóa sạch ô nhập hiện tại để tái sử dụng ngay vị trí này cho dòng sau
       targetInput.focus();
       targetInput.value = "";
       targetInput.dispatchEvent(new Event('input', { bubbles: true }));
       targetInput.dispatchEvent(new Event('change', { bubbles: true }));
       targetInput.blur();

       // Đóng popup ở window hiện tại và window top
       forceCloseLov(window);
       try {
           if (window.top && window.top !== window) {
               forceCloseLov(window.top);
           }
       } catch(e) {}

       return "NOT_FOUND";
   }

   return "SUCCESS";
}