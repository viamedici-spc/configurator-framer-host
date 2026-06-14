import EmbeddedConfiguratorNative from "./EmbeddedConfiguratorNative";
import EmbeddedConfiguratorIFrame from "./EmbeddedConfiguratorIFrame";
import {isParameterAttribute} from "./parameters";

export default class EmbeddedConfiguratorStrategy extends HTMLElement {
    static childAttributes = [...EmbeddedConfiguratorNative.attributeNames, ...EmbeddedConfiguratorIFrame.attributeNames];

    static get observedAttributes() {
        return ["isolated", ...EmbeddedConfiguratorStrategy.childAttributes];
    }

    private child: HTMLElement | null = null;
    private isIsolated: boolean = false;
    private parameterObserver: MutationObserver | null = null;

    constructor() {
        super();
    }

    connectedCallback() {
        this.initialize();
        this.startParameterObserver();
    }

    disconnectedCallback() {
        this.stopParameterObserver();
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
            const forward = EmbeddedConfiguratorStrategy.childAttributes.some(a => a === name) || isParameterAttribute(name);
            if (forward && value !== null) {
                element.setAttribute(name, value);
            }
        }
        this.appendChild(element);
        this.child = element;
    }

    /**
     * Custom parameter attributes (`data-*`) can have arbitrary names, so they cannot be
     * enumerated in the static `observedAttributes`. A MutationObserver forwards their
     * changes to the active child. It is intentionally scoped to parameter attributes only,
     * so it never overlaps with `attributeChangedCallback`, which owns the known attributes.
     */
    private startParameterObserver() {
        if (this.parameterObserver) {
            return;
        }
        this.parameterObserver = new MutationObserver(mutations => {
            if (!this.child) {
                return;
            }
            for (const mutation of mutations) {
                const name = mutation.attributeName;
                if (mutation.type !== "attributes" || name == null || !isParameterAttribute(name)) {
                    continue;
                }
                const value = this.getAttribute(name);
                if (value === null) {
                    this.child.removeAttribute(name);
                } else {
                    this.child.setAttribute(name, value);
                }
            }
        });
        this.parameterObserver.observe(this, {attributes: true});
    }

    private stopParameterObserver() {
        this.parameterObserver?.disconnect();
        this.parameterObserver = null;
    }
}