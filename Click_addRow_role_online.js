function ExecuteScript() {
   function findTargetDoc(win) {
       try {
           var doc = win.document;
           if (doc.querySelector('#cmdAddRow_BLK_ROLEDETAILD')) return doc;
           var frames = doc.querySelectorAll('iframe');
           for (var i = 0; i < frames.length; i++) {
               var found = findTargetDoc(frames[i].contentWindow);
               if (found) return found;
           }
       } catch(e) {}
       return null;
   }

   var targetDoc = findTargetDoc(window);
   if (!targetDoc) return "Error: Không tìm thấy frame chứa nút Add Row Role Detail";

   var ojButton = targetDoc.querySelector('oj-button#cmdAddRow_BLK_ROLEDETAILD') || targetDoc.querySelector('#cmdAddRow_BLK_ROLEDETAILD');
   if (!ojButton) return "Error: Không tìm thấy oj-button Add Row Role Detail";

   var btn = ojButton.querySelector('button') || ojButton;
   if (btn.disabled || ojButton.classList.contains('oj-disabled') || ojButton.getAttribute('aria-disabled') === 'true') {
       return "Warning: Nút Add Row đang bận/disabled";
   }

   if (targetDoc.activeElement && targetDoc.activeElement.blur) {
       targetDoc.activeElement.blur();
   }
   targetDoc.body.focus();

   ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(function(evtName) {
       var evt = new MouseEvent(evtName, {
           bubbles: true,
           cancelable: true,
           view: targetDoc.defaultView
       });
       btn.dispatchEvent(evt);
   });

   return "Clicked Add Row Role Detail successfully";
}