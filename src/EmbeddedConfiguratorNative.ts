import urlJoin from "url-join";

export default class EmbeddedConfiguratorNative extends HTMLElement {
    static readonly proxyBaseUrl = "https://spc.cloud.ceventis.de/framer/host-proxy";
    static readonly attributeNames = ["src", "proxy-base-url"];

    static get observedAttributes() {
        return EmbeddedConfiguratorNative.attributeNames;
    }

    private src: string | null = null;
    private proxyBaseUrl: string = EmbeddedConfiguratorNative.proxyBaseUrl;
    private hasConnected = false;

    constructor() {
        super();
    }

    connectedCallback() {
        this.hasConnected = true;

        if (this.src) {
            console.log("[Configurator] Web Component connected -> reinitialize the configurator app.");
            this.bootstrapApp();
        }
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (name === "src" && newValue !== oldValue) {
            this.src = newValue;

            if (this.hasConnected && this.isConnected && this.src) {
                console.log("[Configurator] The URL was changed -> reinitialize the configurator app.");
                this.bootstrapApp();
            }
        } else if (name === "proxy-base-url" && newValue !== oldValue) {
            this.proxyBaseUrl = newValue ?? EmbeddedConfiguratorNative.proxyBaseUrl;
        }
    }

    private async bootstrapApp() {
        try {
            let response: Response;
            try {
                const src = urlJoin(this.proxyBaseUrl, `?url=${this.src}`);
                response = await fetch(src);
            } catch (e) {
                console.error("[Configurator] Failed to bootstrap configurator app: Failed to load index.html.", e);
                return;
            }

            while (this.firstChild) {
                this.removeChild(this.firstChild);
            }

            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, "text/html");

            // Elements to bootstrap the app
            const style = doc.querySelector("style[data-framer-css-ssr-minified]") || doc.querySelector("style[data-framer-css-ssr]");
            const fonts = doc.querySelector("style[data-framer-fonts-ssr-minified]") || doc.querySelector("style[data-framer-font-css]");
            const mainDiv = doc.querySelector("div#main");
            const mainScript = doc.querySelector('script[data-framer-bundle="main"]');
            const importMapScript = doc.querySelector('script[type="importmap"][data-framer-importmap]');

            if (!style || !style.textContent) {
                console.error("[Configurator] Failed to bootstrap configurator app: Could not find the CSS style element.");
                return;
            }

            if (!fonts || !fonts.textContent) {
                console.error("[Configurator] Failed to bootstrap configurator app: Could not find the fonts style element.");
                return;
            }

            if (!mainDiv) {
                console.error("[Configurator] Failed to bootstrap configurator app: Could not find the main div.");
                return;
            }

            if (!mainScript || !(mainScript instanceof HTMLScriptElement)) {
                console.error("[Configurator] Failed to bootstrap configurator app: Could not find the main entry script.");
                return;
            }

            // Inject static CSS
            const cleanedCss = style.textContent
                .split("}")
                .filter(rule => {
                    const trimmed = rule.trim();
                    return !(
                        // Remove some rules that may interfere too much with the host
                        trimmed.startsWith("html,body,#main") ||
                        trimmed.startsWith("h1,h2,h3,h4,h5,h6,p,figure") ||
                        trimmed.startsWith("body,input,textarea,select,button")
                    );
                })
                .map(rule => rule.trim())
                .join("}\n");

            const cleanedStyle = document.createElement("style");
            for (const attr of style.attributes) {
                cleanedStyle.setAttribute(attr.name, attr.value);
            }
            cleanedStyle.textContent = cleanedCss;
            this.appendChild(cleanedStyle);

            // Inject static fonts
            const clonedFonts = document.createElement("style");
            for (const attr of fonts.attributes) {
                clonedFonts.setAttribute(attr.name, attr.value);
            }
            clonedFonts.textContent = fonts.textContent;
            this.appendChild(clonedFonts);

            // Inject main div
            this.appendChild(mainDiv.cloneNode());

            // Optionally inject import map script
            if (importMapScript && importMapScript.textContent) {
                const newImportMapScript = document.createElement("script");
                newImportMapScript.type = "importmap";
                newImportMapScript.textContent = importMapScript.textContent;
                this.appendChild(newImportMapScript);
            }

            // Inject main entry script
            if (mainScript.src) {
                const newScript = document.createElement("script");
                newScript.type = "module";
                newScript.src = mainScript.src;
                newScript.setAttribute("async", "");
                this.appendChild(newScript);
            } else if (mainScript.textContent) {
                const inlineScript = document.createElement("script");
                inlineScript.type = "module";
                inlineScript.textContent = mainScript.textContent;
                this.appendChild(inlineScript);
            } else {
                console.error("[Configurator] Script tag found, but no src or content available.");
            }
        } catch (e) {
            console.error("[Configurator] Failed to bootstrap configurator app", e);
        }
    }
}
