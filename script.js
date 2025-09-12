document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('input');
    const output = document.getElementById('output');

    function renderContent() {
        const text = input.value;
        let html = marked.parse(text);

        // A simple regex to find and replace LaTeX might be fragile.
        // A better approach would be to use a library that integrates
        // markdown and latex rendering, but for this simple case,
        // we can try to replace it manually.

        // Block-level LaTeX $$...$$
        html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
            try {
                return katex.renderToString(latex, { displayMode: true, throwOnError: false });
            } catch (e) {
                return `<span class="katex-error">${e.message}</span>`;
            }
        });

        // Inline-level LaTeX $...$
        // This is a bit more tricky to not match regular dollar signs.
        // This regex looks for $...$ that is not preceded or followed by a digit.
        html = html.replace(/(^|\s)\$([^$]+?)\$($|\s)/g, (match, pre, latex, post) => {
             try {
                return pre + katex.renderToString(latex, { throwOnError: false }) + post;
            } catch (e) {
                return pre + `<span class="katex-error">${e.message}</span>` + post;
            }
        });


        output.innerHTML = html;
    }

    input.addEventListener('input', renderContent);

    // Initial render in case there's content on load (e.g. from browser cache)
    renderContent();
});
