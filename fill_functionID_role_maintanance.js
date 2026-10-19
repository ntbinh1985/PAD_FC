function ExecuteScript() {
    function findDoc(win, sel) {
        try {
            var doc = win.document;
            if (doc && doc.querySelector(sel)) return doc;
            var frames = doc ? doc.querySelectorAll('iframe') : [];
            for (var i = 0; i < frames.length; i++) {
                var found = findDoc(frames[i].contentWindow, sel);
                if (found) return found;
            }
        } catch(e) {}
        return null;
    }

    var targetDoc = findDoc(window, 'input[name="ROLEFUN"]');
    if (!targetDoc) return "Error: Không tìm thấy frame nhập liệu";

    var roleVal = "%CurrentRow['FunctionID']%".trim();

    var roleInputs = Array.from(targetDoc.querySelectorAll('input[id*="BLK_ROLEDETAIL__ROLEFUNRC"]'));
    if (roleInputs.length === 0) return "Error: Chưa có dòng nào trên bảng";

    var targetRoleInput = roleInputs[roleInputs.length - 1];

    // Điền giá trị
    targetRoleInput.focus();
    targetRoleInput.value = roleVal;
    targetRoleInput.dispatchEvent(new Event('input', { bubbles: true }));
    targetRoleInput.dispatchEvent(new Event('change', { bubbles: true }));

    // Cập nhật lên component oj-input-text nếu có
    var ojComponent = targetRoleInput.closest('oj-input-text');
    if (ojComponent) {
        ojComponent.value = roleVal;
        ojComponent.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Tab out để trigger Flexcube kiểm tra mã
    targetRoleInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
    targetRoleInput.blur();

    return "INPUTTED";
}