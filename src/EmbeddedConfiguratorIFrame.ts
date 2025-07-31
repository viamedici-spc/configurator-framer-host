export default class EmbeddedConfiguratorIFrame extends HTMLElement {
    static readonly attributeNames = ["src", "no-auto-height"];

    static get observedAttributes() {
        return EmbeddedConfiguratorIFrame.attributeNames;
    }

    private src: string | null = null;
    private hasConnected = false;
    private iframe: HTMLIFrameElement | null = null;
    private autoHeightHandler: ((event: MessageEvent) => void) | null = null;
    private allowedOrigin: string | null = null;

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

    disconnectedCallback() {
        this.removeAutoHeightSync();
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (name === "src" && newValue !== oldValue) {
            this.src = newValue;

            if (this.hasConnected && this.isConnected && this.src) {
                console.log("[Configurator] The src was changed -> reinitialize the configurator app.");
                if (this.iframe) {
                    this.iframe.src = this.src;
                } else {
                    this.bootstrapApp();
                }
            }
        }
    }

    private bootstrapApp() {
        if (!this.src) {
            console.error("[Configurator] Cannot bootstrap iframe: src is missing.");
            return;
        }

        this.removeAutoHeightSync();
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }

        this.iframe = document.createElement("iframe");
        this.iframe.src = this.src;
        try {
            this.allowedOrigin = new URL(this.src).origin;
        } catch {
            console.warn("[Configurator] Invalid src URL provided, cannot derive allowed origin. Height synchronisation is disabled.");
            this.allowedOrigin = null;
        }
        this.iframe.width = "100%";
        this.iframe.height = "100%";
        this.iframe.style.border = "none";

        this.appendChild(this.iframe);

        const disableAutoSize = this.getAttribute("no-auto-height") != null && this.getAttribute("no-auto-height") != "false";
        if (!disableAutoSize) {
            this.useAutoHeightSync();
        }
    }

    private useAutoHeightSync() {
        this.autoHeightHandler = (event: MessageEvent) => {
            if (this.allowedOrigin && event.origin !== this.allowedOrigin) {
                return;
            }
            if (event.data?.type !== "spc.configurator.height" || typeof event.data.height !== "number") {
                return;
            }

            console.log("[Configurator] Received new height from iFrame -> Apply", event.data.height);
            this.iframe.style.height = `${event.data.height + 10}px`;
        };

        window.addEventListener("message", this.autoHeightHandler);
    }

    private removeAutoHeightSync() {
        if (this.autoHeightHandler) {
            window.removeEventListener("message", this.autoHeightHandler);
            this.autoHeightHandler = null;
        }
    }
}
