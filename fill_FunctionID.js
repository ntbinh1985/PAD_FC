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

   // 1. Tìm frame chứa ô nhập ROLEFUN
   var targetDoc = findDoc(window, 'input[name="ROLEFUN"]');
   if (!targetDoc) return "ERROR_NO_FRAME";

   var funcIdVal = "%CurrentRow['FunctionID']%".trim();
   var funcInputs = Array.from(targetDoc.querySelectorAll('input[id*="ROLEFUNRC"]'));
   if (funcInputs.length === 0) return "ERROR_NO_ROW";

   var targetInput = funcInputs[funcInputs.length - 1];

   // 2. Điền giá trị vào ô input
   targetInput.focus();
   targetInput.value = funcIdVal;
   targetInput.dispatchEvent(new Event('input', { bubbles: true }));
   targetInput.dispatchEvent(new Event('change', { bubbles: true }));
   targetInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
   targetInput.blur();

   // 3. Quét kết quả trong bảng LOV
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

   // 4. CHỈ ĐÓNG RIÊNG POPUP "List of Values Role Function"
   function closeOnlyLovPopup(win) {
       try {
           var doc = win.document;
           
           // Cách 1: Tìm dialog có tiêu đề chứa chữ "List of Values"
           var headers = Array.from(doc.querySelectorAll('.oj-dialog-title, .ui-dialog-title, h1, h2, h3, div'));
           for (var i = 0; i < headers.length; i++) {
               if (headers[i].textContent.includes('List of Values Role Function')) {
                   var dialogBox = headers[i].closest('oj-dialog, div[role="dialog"], .oj-dialog, .ui-dialog');
                   if (dialogBox) {
                       var closeBtn = dialogBox.querySelector('.oj-dialog-header-close-wrapper button, button[title="Close"], .ui-dialog-titlebar-close, .oj-dialog-close-icon');
                       if (closeBtn) {
                           closeBtn.click();
                           return true;
                       }
                   }
               }
           }

           // Cách 2: Nếu lồng trong iframe LOV riêng, tìm nút close trên dialog có z-index cao nhất
           var allDialogs = Array.from(doc.querySelectorAll('oj-dialog, div[role="dialog"], .oj-dialog'));
           if (allDialogs.length > 1) {
               // Dialog xuất hiện sau cùng chính là popup LOV
               var topDialog = allDialogs[allDialogs.length - 1];
               var topBtn = topDialog.querySelector('.oj-dialog-header-close-wrapper button, button[title="Close"], .oj-dialog-close-icon');
               if (topBtn) {
                   topBtn.click();
                   return true;
               }
           }

           var frames = doc.querySelectorAll('iframe');
           for (var k = 0; k < frames.length; k++) {
               if (closeOnlyLovPopup(frames[k].contentWindow)) return true;
           }
       } catch(e) {}
       return false;
   }

   // 5. Kiểm tra kết quả
   var isFound = checkAndSelectLov(window);

   if (!isFound) {
       // Xóa sạch ô nhập trên bảng Online để nhập Function ID khác vào chính dòng này
       targetInput.focus();
       targetInput.value = "";
       targetInput.dispatchEvent(new Event('input', { bubbles: true }));
       targetInput.dispatchEvent(new Event('change', { bubbles: true }));
       targetInput.blur();

       // Đóng duy nhất popup LOV
       closeOnlyLovPopup(window);

       return "NOT_FOUND";
   }

   return "SUCCESS";
}