import {extractParameters, isParameterAttribute, isParametersRequest, PARAMETERS_MESSAGE_TYPE, ParametersMessage} from "./parameters";

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
    private parametersHandler: ((event: MessageEvent) => void) | null = null;
    private parameterObserver: MutationObserver | null = null;
    private iframeLoadHandler: (() => void) | null = null;

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
        this.removeParameterSync();
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (name === "src" && newValue !== oldValue) {
            this.src = newValue;

            if (this.hasConnected && this.isConnected && this.src) {
                console.log("[Configurator] The src was changed -> reinitialize the configurator app.");
                if (this.iframe) {
                    this.iframe.src = this.src;
                    // The new document re-runs the handshake on its own; recompute the origin so
                    // height sync and parameter posting target the (possibly new) origin.
                    this.updateAllowedOrigin();
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
        this.removeParameterSync();
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }

        this.iframe = document.createElement("iframe");
        this.iframe.src = this.src;
        this.updateAllowedOrigin();
        this.iframe.width = "100%";
        this.iframe.height = "100%";
        this.iframe.style.border = "none";

        this.appendChild(this.iframe);

        this.useParameterSync();

        const disableAutoSize = this.getAttribute("no-auto-height") != null && this.getAttribute("no-auto-height") != "false";
        if (!disableAutoSize) {
            this.useAutoHeightSync();
        }
    }

    private updateAllowedOrigin() {
        try {
            this.allowedOrigin = this.src ? new URL(this.src).origin : null;
        } catch {
            console.warn("[Configurator] Invalid src URL provided, cannot derive allowed origin. Height synchronisation and parameter forwarding are disabled.");
            this.allowedOrigin = null;
        }
    }

    /**
     * Bridges custom parameters into the sandboxed iframe. The embedded app cannot read the
     * host element's attributes across the iframe boundary, so we forward them via postMessage:
     *  - reply to the app's handshake request (reliable initial delivery once its listener is up),
     *  - push on every parameter attribute change (hot-reload),
     *  - push once on iframe load (covers apps that never change parameters afterwards).
     * Outbound messages always target the derived origin, never "*".
     */
    private useParameterSync() {
        this.parametersHandler = (event: MessageEvent) => {
            if (!this.iframe || event.source !== this.iframe.contentWindow) {
                return;
            }
            if (!isParametersRequest(event.data)) {
                return;
            }
            this.postParameters();
        };
        window.addEventListener("message", this.parametersHandler);

        this.parameterObserver = new MutationObserver(mutations => {
            if (mutations.some(m => m.type === "attributes" && m.attributeName != null && isParameterAttribute(m.attributeName))) {
                this.postParameters();
            }
        });
        this.parameterObserver.observe(this, {attributes: true});

        this.iframeLoadHandler = () => this.postParameters();
        this.iframe?.addEventListener("load", this.iframeLoadHandler);
    }

    private postParameters() {
        if (!this.iframe?.contentWindow || !this.allowedOrigin) {
            return;
        }
        const message: ParametersMessage = {
            type: PARAMETERS_MESSAGE_TYPE,
            parameters: extractParameters(this),
        };
        this.iframe.contentWindow.postMessage(message, this.allowedOrigin);
    }

    private removeParameterSync() {
        if (this.parametersHandler) {
            window.removeEventListener("message", this.parametersHandler);
            this.parametersHandler = null;
        }
        if (this.iframe && this.iframeLoadHandler) {
            this.iframe.removeEventListener("load", this.iframeLoadHandler);
        }
        this.iframeLoadHandler = null;
        this.parameterObserver?.disconnect();
        this.parameterObserver = null;
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
