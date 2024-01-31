function cssScopeInlineShadow(shadowRoot) {
    let cssScopeCount = 1;
    new MutationObserver(() => {
        shadowRoot.querySelectorAll('style:not([ready])').forEach(node => {
            var scope = 'me__'+(cssScopeCount++);
            node.parentNode.classList.add(scope);
            node.textContent = node.textContent
            .replace(/(?:^|\.|(\s|[^a-zA-Z0-9\-\_]))(me|this|self)(?![a-zA-Z])/g, '$1.'+scope)
            .replace(/((@keyframes|animation:|animation-name:)[^{};]*)\.me__/g, '$1me__')
            .replace(/(?:@media)\s(xs-|sm-|md-|lg-|xl-|sm|md|lg|xl|xx)/g,
                (match, part1) => { return '@media '+({'sm':'(min-width: 640px)','md':'(min-width: 768px)', 'lg':'(min-width: 1024px)', 'xl':'(min-width: 1280px)', 'xx':'(min-width: 1536px)', 'xs-':'(max-width: 639px)', 'sm-':'(max-width: 767px)', 'md-':'(max-width: 1023px)', 'lg-':'(max-width: 1279px)', 'xl-':'(max-width: 1535px)'}[part1]) }
            )
            node.setAttribute('ready', '');
        });
    }).observe(shadowRoot, {childList: true, subtree: true}); 
}

export default cssScopeInlineShadow;
