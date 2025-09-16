document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded.');

    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const renderBtn = document.getElementById('render-btn');

    if (!input || !output || !renderBtn) {
        console.error('Error: One or more HTML elements (input, output, or render-btn) were not found.');
        return;
    }
    console.log('All required elements found.');

    // Escape HTML special chars so inserted TeX doesn't break HTML parsing.
    const htmlEscape = (s) => s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    let md;
    try {
        md = window.markdownit({ html: true, breaks: false }); // allow raw HTML
        console.log('markdown-it initialized (without katex plugin).');
    } catch (e) {
        console.error('Failed to initialize markdown-it:', e);
        output.innerHTML = '<p style="color: red;">Critical: markdown-it failed to load.</p>';
        return;
    }

    function renderContent() {
        console.log('Render function called.');
        try {
            const raw = input.value;
            // Manual math handling before markdown rendering.
            // First render markdown (with placeholders to avoid interfering with markdown parsing)
            const placeholders = [];
            let temp = raw
                .replace(/\$\$([\s\S]*?)\$\$/g, (m, expr) => {
                    const i = placeholders.length;
                    placeholders.push({expr, display:true});
                    return `@@MATH_BLOCK_${i}@@`;
                })
                .replace(/\\\[([\s\S]*?)\\\]/g, (m, expr) => {
                    const i = placeholders.length;
                    placeholders.push({expr, display:true});
                    return `@@MATH_BLOCK_${i}@@`;
                })
                .replace(/\\\((.+?)\\\)/g, (m, expr) => {
                    const i = placeholders.length;
                    placeholders.push({expr, display:false});
                    return `@@MATH_INLINE_${i}@@`;
                })
                .replace(/\$(?!\$)([^\n$]+?)\$/g, (m, expr) => {
                    const i = placeholders.length;
                    placeholders.push({expr, display:false});
                    return `@@MATH_INLINE_${i}@@`;
                });

            let html = md.render(temp);
            // Replace placeholders with original TeX delimiters (HTML-escaped) so MathJax can process them safely
            html = html.replace(/@@MATH_BLOCK_(\d+)@@/g, (m, idxStr) => {
                const ph = placeholders[Number(idxStr)];
                return ph ? `$$${htmlEscape(ph.expr)}$$` : m;
            }).replace(/@@MATH_INLINE_(\d+)@@/g, (m, idxStr) => {
                const ph = placeholders[Number(idxStr)];
                return ph ? `$${htmlEscape(ph.expr)}$` : m;
            });

            output.innerHTML = html;
            const runTypeset = () => window.MathJax && window.MathJax.typesetPromise
                ? window.MathJax.typesetPromise([output]).catch(err => console.error('MathJax typeset error', err))
                : null;

            if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
                window.MathJax.startup.promise.then(runTypeset);
            } else {
                runTypeset();
            }
            console.log('Content rendered successfully.');
        } catch (e) {
            console.error('An error occurred during rendering:', e);
            output.innerHTML = `<p style="color: red;">An error occurred during rendering. Check the console for details.</p>`;
        }
    }

    renderBtn.addEventListener('click', () => {
        console.log('Render button clicked.');
        renderContent();
    });

    console.log('Click event listener added to the render button.');

    // Keyboard shortcut: Cmd+Enter (mac) or Ctrl+Enter (others) to render
    input.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            console.log('Shortcut render triggered');
            renderContent();
        }
    });
});
