import EmbeddedConfiguratorNative from "./EmbeddedConfiguratorNative";
import EmbeddedConfiguratorIFrame from "./EmbeddedConfiguratorIFrame";

export default class EmbeddedConfiguratorStrategy extends HTMLElement {
    static childAttributes = [...EmbeddedConfiguratorNative.attributeNames, ...EmbeddedConfiguratorIFrame.attributeNames];

    static get observedAttributes() {
        return ["isolated", ...EmbeddedConfiguratorStrategy.childAttributes];
    }

    private child: HTMLElement | null = null;
    private isIsolated: boolean = false;

    constructor() {
        super();
    }

    connectedCallback() {
        this.initialize();
    }

    disconnectedCallback() {
        if (this.child && this.contains(this.child)) {
            this.removeChild(this.child);
        }
        this.child = null;
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (name === "isolated") {
            const newIsolated = newValue !== null && newValue !== "false";
            if (newIsolated !== this.isIsolated) {
                console.log("[Configurator] The isolation mode was changed -> reinitialize the configurator app.");
                this.isIsolated = newIsolated;
                this.initialize();
                return;
            }
        }

        if (this.child && oldValue !== newValue) {
            if (newValue === null) {
                this.child.removeAttribute(name);
            } else {
                this.child.setAttribute(name, newValue);
            }
        }
    }

    private initialize() {
        const isIsolated = this.getAttribute("isolated");
        this.isIsolated = isIsolated !== null && isIsolated !== "false";
        const tagName = this.isIsolated
            ? "spc-embedded-configurator-iframe"
            : "spc-embedded-configurator-native";

        if (this.child && this.child.tagName.toLowerCase() === tagName) {
            return; // no need to recreate
        }

        if (this.child) {
            this.removeChild(this.child);
        }

        const element = document.createElement(tagName);
        for (const {name, value} of Array.from(this.attributes)) {
            if (EmbeddedConfiguratorStrategy.childAttributes.some(a => a === name) && value !== null) {
                element.setAttribute(name, value);
            }
        }
        this.appendChild(element);
        this.child = element;
    }
}