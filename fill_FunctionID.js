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

   // 1. Tìm frame chứa input ROLEFUN của Maintenance
   var targetDoc = findDoc(window, 'input[id*="BLK_ROLEDETAIL__ROLEFUNRC"]') || findDoc(window, '#dataContainer_BLK_ROLEDETAIL') || findDoc(window, 'input[name="ROLEFUN"]');
   if (!targetDoc) return "ERROR_NO_FRAME";

   var funcIdVal = "%CurrentRow['FunctionID']%".trim();

   // 2. Tìm chính xác ô input ở dòng cuối cùng của bảng Maintenance
   var allInputs = Array.from(targetDoc.querySelectorAll('input[name="ROLEFUN"]'));
   var funcInputs = allInputs.filter(function(el) {
       return el.id.includes('BLK_ROLEDETAIL__') || (!el.id.includes('ROLEDETAILD') && el.id.includes('ROLEFUNRC'));
   });

   if (funcInputs.length === 0) funcInputs = allInputs;
   if (funcInputs.length === 0) return "ERROR_NO_ROW";

   var targetInput = funcInputs[funcInputs.length - 1];

   // 3. Kích hoạt chế độ soạn thảo và điền giá trị
   ['mousedown', 'mouseup', 'click'].forEach(function(evName) {
       targetInput.dispatchEvent(new MouseEvent(evName, { bubbles: true, cancelable: true, view: targetDoc.defaultView }));
   });
   targetInput.focus();
   targetInput.value = funcIdVal;
   targetInput.dispatchEvent(new Event('input', { bubbles: true }));
   targetInput.dispatchEvent(new Event('change', { bubbles: true }));

   // Gửi phím Enter hoặc Tab để trigger disp_auto_lov của FC
   targetInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, which: 13, bubbles: true }));
   targetInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, which: 9, bubbles: true }));

   // 4. Hàm quét và chọn dòng khớp trong LOV
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

   // 5. Hàm chỉ đóng bảng popup LOV
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

   // 6. Tách rời việc dọn dẹp vào setTimeout để bảng LOV có thời gian hiển thị
   setTimeout(function() {
       var isFound = checkAndSelectLov(window);
       if (!isFound) {
           // Nếu không tìm thấy sau thời gian chờ, mới xóa ô và tắt popup
           targetInput.focus();
           targetInput.value = "";
           targetInput.dispatchEvent(new Event('input', { bubbles: true }));
           targetInput.dispatchEvent(new Event('change', { bubbles: true }));
           targetInput.blur();

           closeLovModal(window);
           try {
               if (window.top && window.top !== window) {
                   closeLovModal(window.top);
               }
           } catch(e) {}
       }
   }, 600);

   return "SUCCESS_TRIGGERED";
}