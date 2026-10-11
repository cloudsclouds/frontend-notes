var mergeTwoLists = function(list1, list2) {
    const dummy = new ListNode(-1);
    let p = list1, q = list2;
    let k = dummy;
    while (p && q) {
        if (p.val <= q.val) {
            k.next = p;
            p = p.next;
        } else {
            k.next = q;
            q = q.next;
        }
        k = k.next;
    }
    if (p) {
        k.next = p;
    }
    if (q) {
        k.next = q;
    }
    return dummy.next;
}