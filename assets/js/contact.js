/*
    Contact address.
    The address is assembled here so it never appears as plain text in the HTML.
    Without JS, [data-mail] links keep their LinkedIn fallback.
    To rotate the address, change `user` below.
*/

(function() {

    var user = 'contact',
        domain = 'soren.haug.dk',
        address = user + '@' + domain;

    document.querySelectorAll('a[data-mail]').forEach(function(a) {
        a.href = 'mailto:' + address;
        a.removeAttribute('target');
        a.removeAttribute('rel');

        var text = a.querySelector('[data-mail-text]');
        if (text) text.textContent = address;
    });

})();
