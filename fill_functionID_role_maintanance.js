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

   // 1. Tìm đúng frame chứa bảng BLK_ROLEDETAIL của tab Maintenance
   var targetDoc = findDoc(window, '#dataContainer_BLK_ROLEDETAIL') || findDoc(window, 'input[id*="BLK_ROLEDETAIL__ROLEFUNRC"]');
   if (!targetDoc) {
       // Dự phòng quét theo name ROLEFUN nếu không bọc trong dataContainer
       targetDoc = findDoc(window, 'input[name="ROLEFUN"]');
   }
   if (!targetDoc) return "ERROR_NO_FRAME";

   var funcIdVal = "%CurrentRow['FunctionID']%".trim();

   // 2. Lấy danh sách ô input Function ID của riêng tab Maintenance
   // Loại trừ BLK_ROLEDETAILD của tab Online để không bị nhầm dòng
   var allInputs = Array.from(targetDoc.querySelectorAll('input[name="ROLEFUN"]'));
   var funcInputs = allInputs.filter(function(el) {
       return el.id.includes('BLK_ROLEDETAIL__') || (!el.id.includes('ROLEDETAILD') && el.id.includes('ROLEFUNRC'));
   });

   if (funcInputs.length === 0) {
       funcInputs = allInputs; // fallback nếu không match filter id
   }
   if (funcInputs.length === 0) return "ERROR_NO_ROW";

   // Dòng cuối cùng chính là dòng vừa add row
   var targetInput = funcInputs[funcInputs.length - 1];

   // 3. Hàm điền chuẩn y hệt bản gốc của Tab Online
   function fillField(inputEl, val) {
       if (!inputEl) return;
       inputEl.focus();
       inputEl.value = val;
       inputEl.dispatchEvent(new Event('input', { bubbles: true }));
       inputEl.dispatchEvent(new Event('change', { bubbles: true }));
       inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
       inputEl.blur();
   }

   // Thực hiện điền
   fillField(targetInput, funcIdVal);

   // 4. Quét và chọn kết quả trong LOV
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

   // 5. Hàm tắt bảng LOV (chỉ đóng riêng hộp thoại LOV, không đóng màn hình chính)
   function closeLovModal(win) {
       try {
           var doc = win.document;
           var dialogs = Array.from(doc.querySelectorAll('oj-dialog, div[role="dialog"], .oj-dialog'));
           for (var d = 0; d < dialogs.length; d++) {
               var dlg = dialogs[d];
               var text = dlg.innerText || dlg.textContent || "";
               if (text.includes("List of Values Role Function")) {
                   var closeBtn = dlg.querySelector('.oj-dialog-header-close-wrapper button, button[title="Close"], .oj-dialog-close-icon');
                   if (closeBtn) {
                       ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(function(ev) {
                           closeBtn.dispatchEvent(new MouseEvent(ev, { bubbles: true, cancelable: true, view: win }));
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

   // Kiểm tra LOV
   var isFound = checkAndSelectLov(window);

   if (!isFound) {
       // Xóa trắng ô hiện tại để điền function tiếp theo vào đúng dòng này
       fillField(targetInput, "");

       // Tắt bảng LOV
       closeLovModal(window);
       try {
           if (window.top && window.top !== window) {
               closeLovModal(window.top);
           }
       } catch(e) {}

       return "NOT_FOUND";
   }

   return "SUCCESS";
}