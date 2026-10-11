var reverseList = function(head) {
    let pre = null, p = head;
    while (p) {
        const next = p.next;
        p.next = pre;
        pre = p;
        p = next;
    }
    return pre;
}