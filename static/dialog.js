/**
 * modulo per la gestione di dialoghi personalizzati (alert, confirm, prompt) con supporto per input e accessibilità
 */
(function () {
    /**
     * Funzione di utilità per eseguire l'escape dei caratteri HTML in modo da prevenire vulnerabilità XSS 
     * lo scopo è garantire che una stringa potenzialmente pericolosa venga visualizzata come testo normale invece di essere interpretata come codice HTML
     */
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /**
     * Funzione principale per creare e gestire un dialogo personalizzato
     */
    function createDialog(options) {
        const {
            title = "Messaggio",
            message = "",
            confirmText = "OK",
            cancelText = "Annulla",
            showCancel = false,
            input = false,
            inputType = "text",
            inputPlaceholder = "",
            inputValue = ""
        } = options || {};

        return new Promise((resolve) => {
            const backdrop = document.createElement("div");
            backdrop.className = "app-dialog-backdrop";
            backdrop.innerHTML = `
                <div class="app-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
                    <div class="app-dialog-title">${escapeHtml(title)}</div>
                    <div class="app-dialog-body">${escapeHtml(message)}</div>
                    ${input ? `<input class="app-dialog-input" type="${escapeHtml(inputType)}" value="${escapeHtml(inputValue)}" placeholder="${escapeHtml(inputPlaceholder)}">` : ""}
                    <div class="app-dialog-actions">
                        ${showCancel ? `<button type="button" class="btn btn-outline-secondary app-dialog-cancel">${escapeHtml(cancelText)}</button>` : ""}
                        <button type="button" class="btn btn-brand app-dialog-confirm">${escapeHtml(confirmText)}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(backdrop);

            const dialog = backdrop.querySelector(".app-dialog");
            const confirmBtn = backdrop.querySelector(".app-dialog-confirm");
            const cancelBtn = backdrop.querySelector(".app-dialog-cancel");
            const inputEl = backdrop.querySelector(".app-dialog-input");

            /**
                * Funzione per chiudere il dialogo e risolvere la Promise con il risultato
             */
            function close(result) {
                document.removeEventListener("keydown", onKeyDown);
                backdrop.remove();
                resolve(result);
            }

            /**
                * Gestore per la pressione dei tasti, permette di chiudere il dialogo con Escape o confermare con Enter
             */
            function onKeyDown(event) {
                if (event.key === "Escape" && showCancel) {
                    close({ confirmed: false, value: null });
                    return;
                }

                if (event.key === "Enter") {
                    const value = inputEl ? inputEl.value : null;
                    close({ confirmed: true, value });
                }
            }

            document.addEventListener("keydown", onKeyDown);

            confirmBtn.addEventListener("click", () => {
                const value = inputEl ? inputEl.value : null;
                close({ confirmed: true, value });
            });

            if (cancelBtn) {
                cancelBtn.addEventListener("click", () => {
                    close({ confirmed: false, value: null });
                });
            }

            if (inputEl) {
                inputEl.focus();
                inputEl.select();
            } else {
                confirmBtn.focus();
            }

            if (dialog) {
                dialog.classList.add("app-dialog-visible");
            }
        });
    }

    /**
     * Funzioni di utilità per mostrare dialoghi di tipo alert, confirm e prompt con opzioni personalizzabili
     */
    window.showAppAlert = function (message, options) {
        return createDialog({
            title: (options && options.title) || "Attenzione",
            message,
            confirmText: (options && options.confirmText) || "OK",
            showCancel: false
        });
    };

    /**
        * Funzione per mostrare un dialogo di conferma con messaggio e opzioni personalizzabili, 
        * restituisce un contenitore che si risolve con true se l'utente conferma, false se annulla
     */
    window.showAppConfirm = function (message, options) {
        return createDialog({
            title: (options && options.title) || "Conferma",
            message,
            confirmText: (options && options.confirmText) || "Conferma",
            cancelText: (options && options.cancelText) || "Annulla",
            showCancel: true
        }).then((result) => result.confirmed);
    };

    window.showAppPrompt = function (message, options) {
        return createDialog({
            title: (options && options.title) || "Inserisci valore",
            message,
            confirmText: (options && options.confirmText) || "Conferma",
            cancelText: (options && options.cancelText) || "Annulla",
            showCancel: true,
            input: true,
            inputType: (options && options.inputType) || "text",
            inputPlaceholder: (options && options.placeholder) || "",
            inputValue: (options && options.defaultValue) || ""
        }).then((result) => (result.confirmed ? result.value : null));
    };
})();

