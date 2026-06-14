/**
 * Shared definitions for forwarding custom parameters from the host page to the
 * embedded configurator app. The same prefix and message types are mirrored in the
 * Framer library (`@viamedici-spc/configurator-framer`) — keep both sides in sync.
 *
 * A host passes parameters as `data-*` attributes on the web component, e.g.
 * `<spc-embedded-configurator data-region="eu" data-webshop="true">`. The prefix is
 * stripped to form the key, so `data-region` becomes the parameter `region`. Browsers
 * lowercase attribute names, so keys always arrive in lowercase.
 */

export const PARAMETER_PREFIX = "data-";

/** host → child: the current full set of parameters (push and handshake reply). */
export const PARAMETERS_MESSAGE_TYPE = "spc.configurator.parameters";
/** child → host: ask the host to (re)send the current parameters. */
export const PARAMETERS_REQUEST_MESSAGE_TYPE = "spc.configurator.parameters.request";

export type ParameterMap = Record<string, string>;

export interface ParametersMessage {
    type: typeof PARAMETERS_MESSAGE_TYPE;
    parameters: ParameterMap;
}

export interface ParametersRequestMessage {
    type: typeof PARAMETERS_REQUEST_MESSAGE_TYPE;
}

export function isParameterAttribute(name: string): boolean {
    return name.startsWith(PARAMETER_PREFIX) && name.length > PARAMETER_PREFIX.length;
}

/** "data-region" -> "region". Returns null if the name is not a parameter attribute. */
export function parameterKeyFromAttribute(name: string): string | null {
    return isParameterAttribute(name) ? name.slice(PARAMETER_PREFIX.length) : null;
}

export function extractParameters(element: Element): ParameterMap {
    const result: ParameterMap = {};
    for (const attr of Array.from(element.attributes)) {
        const key = parameterKeyFromAttribute(attr.name);
        if (key != null) {
            result[key] = attr.value;
        }
    }
    return result;
}

export function isParametersRequest(data: unknown): data is ParametersRequestMessage {
    return typeof data === "object"
        && data !== null
        && (data as { type?: unknown }).type === PARAMETERS_REQUEST_MESSAGE_TYPE;
}
