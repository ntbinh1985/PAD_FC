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

   // Tìm frame có chứa ô nhập PRDPRDCD
   var targetDoc = findDoc(window, 'input[name="PRDPRDCD"]');
   if (!targetDoc) return "Error: Không tìm thấy frame nhập liệu Product";

   // Giá trị Product Code từ Power Automate Desktop
   var productVal = "%CurrentProduct['ProductCode']%".trim();

   // Lấy danh sách tất cả các ô input Product Code trên bảng (dòng cuối cùng là dòng vừa add)
   var productInputs = Array.from(targetDoc.querySelectorAll('input[id*="PRDPRDCDRC"]'));
   if (productInputs.length === 0) return "Error: Chưa có dòng nào trên bảng Product";

   var targetProductInput = productInputs[productInputs.length - 1];

   function fillField(inputEl, val) {
       if (!inputEl) return;
       inputEl.focus();
       inputEl.value = val;
       inputEl.dispatchEvent(new Event('input', { bubbles: true }));
       inputEl.dispatchEvent(new Event('change', { bubbles: true }));
       inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
       inputEl.blur();
   }

   // Điền Product Code vào dòng mới nhất
   fillField(targetProductInput, productVal);

   // Quét và tự động chọn kết quả LOV nếu bật popup/dropdown
   function handleLov(win) {
       try {
           var doc = win.document;
           var cells = Array.from(doc.querySelectorAll('td, div[role="gridcell"]'));
           for (var i = 0; i < cells.length; i++) {
               if (cells[i].textContent.trim() === productVal) {
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
               if (handleLov(frames[j].contentWindow)) return true;
           }
       } catch(e) {}
       return false;
   }

   // Chờ 500ms để bắt popup LOV nếu hệ thống gọi disp_auto_lov
   setTimeout(function() {
       handleLov(window);
       if (targetDoc.activeElement && targetDoc.activeElement.blur) {
           targetDoc.activeElement.blur();
       }
       targetDoc.body.focus();
   }, 500);

   return "Success";
}