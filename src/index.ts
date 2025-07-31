import EmbeddedConfiguratorNative from "./EmbeddedConfiguratorNative";
import EmbeddedConfiguratorStrategy from "./EmbeddedConfiguratorStrategy";
import EmbeddedConfiguratorIFrame from "./EmbeddedConfiguratorIFrame";

export {
    EmbeddedConfiguratorNative,
    EmbeddedConfiguratorStrategy
};

customElements.define("spc-embedded-configurator", EmbeddedConfiguratorStrategy);
customElements.define("spc-embedded-configurator-native", EmbeddedConfiguratorNative);
customElements.define("spc-embedded-configurator-iframe", EmbeddedConfiguratorIFrame);