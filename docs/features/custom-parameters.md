# Custom Parameters

## Goal

Let a host page pass arbitrary runtime context into the embedded configurator — e.g. a
configuration model id, a region, or whether the configurator runs inside a webshop. Parameters
are declared as `data-*` attributes on the web component, **hot-reload** at runtime (no page
reload), and behave identically whether the configurator is embedded in **native** or **isolated
(iframe)** mode.

This package is responsible only for **forwarding** the parameters to the embedded app. Reading
them on the other side is done in `@viamedici-spc/configurator-framer` via the
`useHostParameters` / `useHostParameter` hooks.

## User-visible behavior

```html
<spc-embedded-configurator
        src="https://example.framer.app"
        data-configuration-model-id="123"
        data-region="eu"
        data-webshop="true"/>
```

- Any `data-*` attribute is forwarded as a parameter. The `data-` prefix is stripped to form the
  key, so `data-region="eu"` becomes `region: "eu"`.
- Keys are lowercased by the browser (HTML attribute names are case-insensitive), so they always
  arrive lowercase, e.g. `configuration-model-id`.
- Values are plain strings.
- Adding, changing, or removing a `data-*` attribute at runtime propagates to the configurator
  without reloading the page.
- Works on all three custom elements: `spc-embedded-configurator` (strategy) forwards parameters
  to whichever child it creates; `spc-embedded-configurator-native` and
  `spc-embedded-configurator-iframe` also work when used directly.

## Edge cases / rules

- **Every `data-*` is a parameter** — including generic ones such as `data-testid`. There is no
  separate namespace; the `data-` prefix is the only filter.
- **Arbitrary names cannot be observed via `observedAttributes`** (it must be a static list), so a
  `MutationObserver` is used for the `data-*` family. It is scoped strictly to `data-*` so it never
  overlaps with `attributeChangedCallback`, which keeps owning the known attributes (`src`,
  `isolated`, `no-auto-height`, `proxy-base-url`).
- **Native mode** leaves the parameters as attributes on the `spc-embedded-configurator-native`
  element; the embedded app reads them directly (`closest(...)`). No messaging is involved.
- **Iframe mode** posts parameters via `postMessage`. The target origin is **derived from `src`**
  (never `"*"`), and inbound handshake requests are validated by frame identity
  (`event.source === iframe.contentWindow`). No origin configuration is required.
- **`isolated` toggle at runtime** recreates the child; the current parameters are re-copied to the
  new child, and the strategy's observer keeps forwarding to whichever child currently exists.
- **Attribute removal** sends/leaves the full current parameter set without the removed key; the
  consumer treats the received map as authoritative (full snapshot, not a delta).
- **Multiple instances** on one page are isolated: each element has its own observer/handler, and
  the iframe `event.source` check prevents cross-talk.
- **Invalid `src`** → no derivable origin → iframe parameter posting (and height sync) are disabled.
- A runtime `src` change on the iframe fast-path now recomputes the allowed origin, so parameter
  posting (and height sync) target the new origin.

## Data model impact

No persistence. The contract is the in-memory parameter map and the postMessage wire protocol,
both defined in `src/parameters.ts`:

- Prefix: `data-`
- `spc.configurator.parameters` — host → child, payload `{ parameters: Record<string,string> }`
  (push and handshake reply)
- `spc.configurator.parameters.request` — child → host, the app asks for the current parameters

> These constants are duplicated in `@viamedici-spc/configurator-framer`
> (`src/common/hostParametersStore.ts`) because the packages share no module. Change both together.

## Flow (sequence)

Native:

```
host sets data-* on <spc-embedded-configurator>
  → Strategy MutationObserver (data-* only) forwards to <…-native>
  → embedded app: closest("…-native") reads attributes + observes for changes
```

Iframe:

```
host sets data-* on <spc-embedded-configurator>
  → Strategy forwards to <…-iframe>
  → on app mount: app posts {type:"…parameters.request"} to window.parent
  → IFrame element replies postMessage({type:"…parameters", parameters}, allowedOrigin)
  → on later data-* change: IFrame MutationObserver pushes the full map again (hot-reload)
  (plus a best-effort push on iframe "load")
```

The handshake is **hybrid**: the request guarantees correct initial delivery (sent only after the
app's listener is attached), the observer push guarantees hot-reload, and the load push is a
belt-and-suspenders fallback. `postParameters()` always sends the full current map (idempotent).

## Rollout / migration notes

- **Backward compatible**: purely additive. Existing embeds without `data-*` attributes are
  unaffected; `EmbeddedConfiguratorNative` needed no changes.
- **Requires a matching consumer**: parameters only become visible if the embedded Framer app uses
  the `useHostParameters` hooks from a `@viamedici-spc/configurator-framer` build that includes the
  feature. Older configurator builds simply ignore the forwarded attributes/messages.

## Links

- Implementation: `src/parameters.ts`, `src/EmbeddedConfiguratorStrategy.ts`,
  `src/EmbeddedConfiguratorIFrame.ts`
- README: "Custom Parameters" section
- Consumer side: `@viamedici-spc/configurator-framer` → `docs/features/host-parameters.md`
