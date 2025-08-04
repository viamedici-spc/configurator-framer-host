<div >
  <strong>Viamedici SPC</strong>
</div>

# Host Component for Framer Configurators

[![npm version](https://img.shields.io/npm/v/@viamedici-spc/configurator-framer-host)](https://www.npmjs.com/package/@viamedici-spc/configurator-framer-host)
[![license](https://img.shields.io/npm/l/@viamedici-spc/configurator-framer-host)](https://github.com/viamedici-spc/configurator-framer-host/blob/main/LICENSE)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/viamedici-spc/configurator-framer-host/main.yml?branch=main)](https://github.com/viamedici-spc/configurator-framer-host/actions/workflows/main.yml?query=branch%3Amain)

## Introduction

This package provides a Web Component that allows host applications to embed a Framer-based Viamedici SPC configurator.

It is designed to be used in any modern web environment (e.g. plain HTML, React, Vue, etc.) and enables seamless integration to provide the best user experience.

## Modes

### Native Mode

In native mode, the configurator is embedded directly into the host application DOM without an iframe. This allows for tight visual and layout integration, resulting in a more seamless user experience. However, since the configurator shares the same document context as the host, styling or DOM
conflicts can arise. Use this mode only when full control over the host environment is ensured.

### Isolated Mode

The isolated mode, enabled via `isolated="true"`, embeds the configurator within a sandboxed iframe. This ensures that both host and configurator remain fully decoupled, preventing style or JavaScript interference. To provide a native-feeling height behavior, the iframe automatically resizes based
on its content. This behavior can be disabled using the attribute: `no-auto-height`

## Installation

You can install the package via npm:

```bash
npm install @viamedici-spc/configurator-framer-host
```

Or use it directly via a CDN (e.g. jsDelivr):

```html

<script type="module" src="https://cdn.jsdelivr.net/npm/@viamedici-spc/configurator-framer-host@1.1.0"></script>
```

## Getting Started

Below is a minimal example of how to embed a Framer configurator using the `<spc-embedded-configurator>` Web Component:

### index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@viamedici-spc/configurator-framer-host@1.0.0"></script>
</head>
<body>
    <spc-embedded-configurator src="https://example.framer.app" isolated="true"/>
</body>
</html>
```

## Attributes

Attributes for `<spc-embedded-configurator>`

| Attribute                   | Type      | Description                                                                                                                                        | Example                                   |
|-----------------------------|-----------|----------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------|
| `src`                       | `string`  | URL of the Framer-based configurator to embed.
| `isolated`                  | `boolean` | If `true`, the configurator runs in sandboxed iframe mode.<br/>Default: `false`                                                                         | `true`, `false` or `undefined` |
| `no-auto-height`            | `boolean` | if true, it disables automatic resizing of the iframe to match the configurator's content height. Only applicable when `isolated` mode is enabled.<br/>Default: `false` | `true`, `false` or `undefined` |

## License

This project is licensed under the MIT License - see the LICENSE file for details.