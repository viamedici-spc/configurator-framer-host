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

            // Mandatory elements to bootstrap the app
            const style = doc.querySelector("style[data-framer-css-ssr-minified]");
            const mainDiv = doc.querySelector("div#main");
            const script = doc.querySelector('script[data-framer-bundle="main"]');

            if (!style || !style.textContent) {
                console.error("[Configurator] Failed to bootstrap configurator app: Could not find the style element.");
                return;
            }

            if (!mainDiv) {
                console.error("[Configurator] Failed to bootstrap configurator app: Could not find the main div.");
                return;
            }

            if (!script || !(script instanceof HTMLScriptElement)) {
                console.error("[Configurator] Failed to bootstrap configurator app: Could not find the entry script.");
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

            // Inject main div
            this.appendChild(mainDiv.cloneNode());

            // Inject entry script
            const newScript = document.createElement("script");
            newScript.type = "module";
            newScript.src = script.src;
            newScript.setAttribute("async", "");
            this.appendChild(newScript);
        } catch (e) {
            console.error("[Configurator] Failed to bootstrap configurator app", e);
        }
    }
}

