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

   // 1. Tìm frame chứa input ROLEFUN của bảng Maintenance
   var targetDoc = findDoc(window, 'input[id*="BLK_ROLEDETAIL__ROLEFUNRC"]');
   if (!targetDoc) {
       targetDoc = findDoc(window, 'input[name="ROLEFUN"]');
   }
   if (!targetDoc) return "ERROR_NO_FRAME";

   var funcIdVal = "%CurrentRow['FunctionID']%".trim();
   var funcInputs = Array.from(targetDoc.querySelectorAll('input[id*="BLK_ROLEDETAIL__ROLEFUNRC"]'));
   if (funcInputs.length === 0) {
       funcInputs = Array.from(targetDoc.querySelectorAll('input[name="ROLEFUN"]'));
   }
   if (funcInputs.length === 0) return "ERROR_NO_ROW";

   var targetInput = funcInputs[funcInputs.length - 1];

   // 2. Điền giá trị vào ô input
   targetInput.focus();
   targetInput.value = funcIdVal;
   targetInput.dispatchEvent(new Event('input', { bubbles: true }));
   targetInput.dispatchEvent(new Event('change', { bubbles: true }));
   targetInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
   targetInput.blur();

   // 3. Quét chọn kết quả khớp trong bảng LOV
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

   // 4. Hàm đóng duy nhất popup LOV "List of Values Role Function"
   function closeLovModal(win) {
       try {
           var doc = win.document;

           // Tìm chính xác hộp thoại LOV qua tiêu đề của nó
           var allDialogs = Array.from(doc.querySelectorAll('oj-dialog, div[role="dialog"], .oj-dialog'));
           for (var d = 0; d < allDialogs.length; d++) {
               var dlg = allDialogs[d];
               var titleText = dlg.innerText || dlg.textContent || "";
               if (titleText.includes("List of Values Role Function")) {
                   var closeBtn = dlg.querySelector('.oj-dialog-header-close-wrapper button, button[title="Close"], .oj-dialog-close-icon, a.ui-dialog-titlebar-close');
                   if (closeBtn) {
                       ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(function(evName) {
                           closeBtn.dispatchEvent(new MouseEvent(evName, { bubbles: true, cancelable: true, view: win }));
                       });
                       return true;
                   }
               }
           }

           var frames = doc.querySelectorAll('iframe');
           for (var k = 0; k < frames.length; k++) {
               if (closeLovModal(frames[k].contentWindow)) return true;
           }
       } catch(e) {}
       return false;
   }

   // 5. Kiểm tra kết quả
   var isFound = checkAndSelectLov(window);

   if (!isFound) {
       // Xóa sạch ô nhập để tái sử dụng ngay dòng này cho function tiếp theo
       targetInput.focus();
       targetInput.value = "";
       targetInput.dispatchEvent(new Event('input', { bubbles: true }));
       targetInput.dispatchEvent(new Event('change', { bubbles: true }));
       targetInput.blur();

       // Gọi đóng popup LOV
       var closed = closeLovModal(window);
       if (!closed) {
           try {
               if (window.top && window.top !== window) {
                   closeLovModal(window.top);
               }
           } catch(e) {}
       }

       return "NOT_FOUND";
   }

   return "SUCCESS";
}