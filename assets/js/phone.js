/*
    Phone layout (max-width: 736px).
    Adds section tabs, the collapsing identity bar, the experience accordion and
    the project bottom sheet. Everything is set up when the media query starts
    matching and torn down when it stops, so desktop always gets the plain page.
    Without JS, phones show every section stacked.
*/

(function() {

    var phoneQuery = window.matchMedia('(max-width: 736px)'),
        reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)'),
        body = document.body,
        header = document.getElementById('header'),
        topbar = document.getElementById('phone-topbar'),
        tablist = document.querySelector('.phone-tabs'),
        tabs = Array.prototype.slice.call(document.querySelectorAll('.phone-tab')),
        sections = Array.prototype.slice.call(document.querySelectorAll('#main > section[data-tab]')),
        work = document.getElementById('work'),
        workItems = Array.prototype.slice.call(document.querySelectorAll('#work .work-item')),
        jobHeads = Array.prototype.slice.call(document.querySelectorAll('.timeline-head')),
        actions = document.getElementById('phone-actions'),
        sheet = document.getElementById('project-sheet'),
        backdrop = document.getElementById('sheet-backdrop'),
        observer = null,
        opener = null,
        closeTimer = null;

    // Tabs.

        function selectTab(name, focusTab) {
            tabs.forEach(function(tab) {
                var selected = tab.dataset.tab === name;
                tab.setAttribute('aria-selected', selected ? 'true' : 'false');
                tab.tabIndex = selected ? 0 : -1;
                if (selected && focusTab) tab.focus();
            });

            sections.forEach(function(section) {
                section.hidden = section.dataset.tab !== name;
            });

            // Keep the tab bar at the top if the visitor had scrolled past the header.
            var underHeader = header.offsetTop + header.offsetHeight;
            if (window.scrollY > underHeader) window.scrollTo(0, underHeader);
        }

        function onTabClick(event) {
            var tab = event.target.closest('.phone-tab');
            if (tab) selectTab(tab.dataset.tab, false);
        }

        function onTabKey(event) {
            var index = tabs.indexOf(document.activeElement),
                next = null;
            if (index < 0) return;

            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = tabs.length - 1;
            if (next === null) return;

            event.preventDefault();
            selectTab(tabs[next].dataset.tab, true);
        }

    // Collapsed identity bar.

        function onHeaderVisibility(entries) {
            var collapsed = !entries[0].isIntersecting;
            topbar.classList.toggle('is-visible', collapsed);
            body.classList.toggle('topbar-visible', collapsed);
        }

    // Experience accordion (one entry open at a time).

        function openJob(index) {
            jobHeads.forEach(function(head, i) {
                var open = i === index;
                head.setAttribute('aria-expanded', open ? 'true' : 'false');
                head.nextElementSibling.hidden = !open;
            });
        }

        function onJobActivate(event) {
            var head = event.target.closest('.timeline-head');
            if (!head) return;
            if (event.type === 'keydown') {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
            }
            var index = jobHeads.indexOf(head);
            openJob(head.getAttribute('aria-expanded') === 'true' ? -1 : index);
        }

    // Project bottom sheet.

        function fillSheet(item) {
            var link = item.querySelector('a.image'),
                thumb = link.querySelector('img'),
                image = sheet.querySelector('.sheet-image img'),
                tags = sheet.querySelector('.sheet-tags'),
                links = sheet.querySelector('.sheet-links');

            // The card's thumbnail is already loaded and large enough for the sheet.
            image.src = thumb ? thumb.currentSrc || thumb.src : link.getAttribute('href');
            image.alt = thumb ? thumb.alt : '';
            // Match the card: diagrams and cutouts are fitted on their own background colour.
            image.parentNode.style.background = window.getComputedStyle(link).backgroundColor;
            image.style.objectFit = thumb ? window.getComputedStyle(thumb).objectFit : '';
            sheet.querySelector('.sheet-org').textContent = item.querySelector('.work-org').textContent;
            sheet.querySelector('.sheet-title').textContent = item.querySelector('h3').textContent;
            sheet.querySelector('.sheet-desc').textContent = item.querySelector('.work-desc').textContent;

            tags.textContent = '';
            item.querySelectorAll('.tag').forEach(function(tag) {
                var li = document.createElement('li');
                li.textContent = tag.textContent;
                tags.appendChild(li);
            });

            links.textContent = '';
            item.querySelectorAll('.project-links a').forEach(function(a) {
                links.appendChild(a.cloneNode(true));
            });
            links.hidden = !links.children.length;
        }

        function openSheet(item) {
            window.clearTimeout(closeTimer);
            opener = item;
            fillSheet(item);
            backdrop.hidden = false;
            sheet.hidden = false;
            body.classList.add('sheet-open');
            // Next frame, so the slide-in transition runs from the hidden state.
            window.requestAnimationFrame(function() {
                window.requestAnimationFrame(function() {
                    sheet.classList.add('is-open');
                    backdrop.classList.add('is-open');
                });
            });
            sheet.scrollTop = 0;
            sheet.focus();
            document.addEventListener('keydown', onSheetKey);
        }

        function closeSheet(immediate) {
            if (sheet.hidden) return;
            sheet.classList.remove('is-open');
            backdrop.classList.remove('is-open');
            body.classList.remove('sheet-open');
            document.removeEventListener('keydown', onSheetKey);

            var finish = function() {
                sheet.hidden = true;
                backdrop.hidden = true;
            };
            if (immediate === true || reducedMotion.matches) finish();
            else closeTimer = window.setTimeout(finish, 260);

            if (opener && immediate !== true) opener.focus();
            opener = null;
        }

        function onSheetKey(event) {
            if (event.key === 'Escape') {
                closeSheet();
                return;
            }
            if (event.key !== 'Tab') return;

            // Keep focus inside the sheet while it is open.
            var focusable = Array.prototype.slice.call(sheet.querySelectorAll('a[href], button'));
            if (!focusable.length) return;
            var first = focusable[0],
                last = focusable[focusable.length - 1];
            if (event.shiftKey && (document.activeElement === first || document.activeElement === sheet)) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        // Capture phase, so the tap opens the sheet before Poptrox's lightbox sees it.
        function onWorkClick(event) {
            var item = event.target.closest('.work-item');
            if (!item) return;
            event.preventDefault();
            event.stopPropagation();
            openSheet(item);
        }

        function onWorkKey(event) {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            var item = event.target.closest('.work-item');
            if (!item || event.target !== item) return;
            event.preventDefault();
            openSheet(item);
        }

        function onSheetClose(event) {
            if (event.target === backdrop || event.target.closest('.sheet-close')) closeSheet();
        }

    // Setup / teardown.

        function setup() {
            body.classList.add('phone-ui');

            tablist.hidden = false;
            tabs.forEach(function(tab) {
                tab.setAttribute('aria-selected', 'false');
            });
            sections.forEach(function(section) {
                section.setAttribute('role', 'tabpanel');
                section.setAttribute('aria-labelledby', 'tab-' + section.dataset.tab);
            });
            tablist.addEventListener('click', onTabClick);
            tablist.addEventListener('keydown', onTabKey);
            selectTab('work', false);

            jobHeads.forEach(function(head, i) {
                var desc = head.nextElementSibling;
                desc.id = desc.id || 'job-desc-' + i;
                head.setAttribute('role', 'button');
                head.setAttribute('aria-controls', desc.id);
                head.tabIndex = 0;
                head.addEventListener('click', onJobActivate);
                head.addEventListener('keydown', onJobActivate);
            });
            openJob(0);

            workItems.forEach(function(item) {
                item.tabIndex = 0;
                item.setAttribute('role', 'button');
                item.setAttribute('aria-haspopup', 'dialog');
                item.setAttribute('aria-label', item.querySelector('h3').textContent + ', show details');
                item.querySelectorAll('a').forEach(function(a) {
                    a.tabIndex = -1;
                });
            });
            work.addEventListener('click', onWorkClick, true);
            work.addEventListener('keydown', onWorkKey);
            backdrop.addEventListener('click', onSheetClose);
            sheet.addEventListener('click', onSheetClose);
            sheet.tabIndex = -1;

            topbar.hidden = false;
            actions.hidden = false;
            if ('IntersectionObserver' in window) {
                observer = new IntersectionObserver(onHeaderVisibility);
                observer.observe(header);
            }
        }

        function teardown() {
            closeSheet(true);
            body.classList.remove('phone-ui', 'topbar-visible');

            tablist.hidden = true;
            tablist.removeEventListener('click', onTabClick);
            tablist.removeEventListener('keydown', onTabKey);
            sections.forEach(function(section) {
                section.hidden = false;
                section.removeAttribute('role');
                section.removeAttribute('aria-labelledby');
            });

            jobHeads.forEach(function(head) {
                head.nextElementSibling.hidden = false;
                ['role', 'aria-controls', 'aria-expanded', 'tabindex'].forEach(function(name) {
                    head.removeAttribute(name);
                });
                head.removeEventListener('click', onJobActivate);
                head.removeEventListener('keydown', onJobActivate);
            });

            workItems.forEach(function(item) {
                ['tabindex', 'role', 'aria-haspopup', 'aria-label'].forEach(function(name) {
                    item.removeAttribute(name);
                });
                item.querySelectorAll('a').forEach(function(a) {
                    a.removeAttribute('tabindex');
                });
            });
            work.removeEventListener('click', onWorkClick, true);
            work.removeEventListener('keydown', onWorkKey);
            backdrop.removeEventListener('click', onSheetClose);
            sheet.removeEventListener('click', onSheetClose);

            if (observer) observer.disconnect();
            observer = null;
            topbar.classList.remove('is-visible');
            topbar.hidden = true;
            actions.hidden = true;
        }

        function onQueryChange() {
            if (phoneQuery.matches) setup();
            else teardown();
        }

        if (phoneQuery.addEventListener) phoneQuery.addEventListener('change', onQueryChange);
        else phoneQuery.addListener(onQueryChange);

        if (phoneQuery.matches) setup();

})();
