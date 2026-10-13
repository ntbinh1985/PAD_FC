function ExecuteScript() {
   function findTargetDoc(win) {
       try {
           var doc = win.document;
           if (doc.querySelector('#cmdAddRow_BLK_USERPRODUCTS')) return doc;
           var frames = doc.querySelectorAll('iframe');
           for (var i = 0; i < frames.length; i++) {
               var found = findTargetDoc(frames[i].contentWindow);
               if (found) return found;
           }
       } catch(e) {}
       return null;
   }

   var targetDoc = findTargetDoc(window);
   if (!targetDoc) return "Error: Không tìm thấy frame chứa nút Add Row Products";

   var ojButton = targetDoc.querySelector('oj-button#cmdAddRow_BLK_USERPRODUCTS') || targetDoc.querySelector('#cmdAddRow_BLK_USERPRODUCTS');
   if (!ojButton) return "Error: Không tìm thấy oj-button Add Row Products";

   // Kiểm tra trạng thái disabled / busy
   var btn = ojButton.querySelector('button') || ojButton;
   if (btn.disabled || ojButton.classList.contains('oj-disabled') || ojButton.getAttribute('aria-disabled') === 'true') {
       return "Warning: Nút Add Row Products đang ở trạng thái disabled/bận, cần thêm action Wait";
   }

   // Nhả focus từ phần tử trước đó
   if (targetDoc.activeElement && targetDoc.activeElement.blur) {
       targetDoc.activeElement.blur();
   }
   targetDoc.body.focus();

   // Kích hoạt chuỗi sự kiện click vào button thực tế
   ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(function(evtName) {
       var evt = new MouseEvent(evtName, {
           bubbles: true,
           cancelable: true,
           view: targetDoc.defaultView
       });
       btn.dispatchEvent(evt);
   });

   return "Clicked Add Row Products successfully";
}