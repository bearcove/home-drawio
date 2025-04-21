import {
    mxUtils,
    mxSvgCanvas2D,
    defaultDrawioStyleSheet,
    Editor,
    document,
} from "./codegen/drawio-cinematic-universe.js";
import * as base64 from "base64-arraybuffer";
import { inflateRaw } from "pako";
import { log, verbose } from "./lib.js";

/**
 * @typedef {Object} ToSvgOptions
 * @property {boolean} minify
 */

/**
 * @param {string} inputBuffer
 * @param {ToSvgOptions} options
 * @returns {string}
 */
export function toSvg(inputBuffer, options) {
    // Let's patch mxSvgCanvas2D to not create alternate content — this
    // gets rid of `switch` nodes.
    mxSvgCanvas2D.prototype.createAlternateContent = function () {
        return null;
    };

    const parseXmlStart = performance.now();
    let xmlDoc = mxUtils.parseXml(inputBuffer);
    const parseXmlEnd = performance.now();
    log(`Parse XML took ${(parseXmlEnd - parseXmlStart).toFixed(2)}ms`);

    const diagramStart = performance.now();
    let diagramNode = xmlDoc.querySelector("diagram");
    const diagramEnd = performance.now();
    log(`Select diagram took ${(diagramEnd - diagramStart).toFixed(2)}ms`);
    if (!diagramNode) {
        throw new Error("Input is not a Draw.io diagram file!");
    }

    /** @type {Element} */
    let xmlRoot;

    // If it has an `mxGraphModel` child, then it's uncompressed and we can use that
    // directly:
    if (diagramNode.querySelector("mxGraphModel")) {
        log("Diagram is uncompressed, using as is");
        let model = diagramNode.querySelector("mxGraphModel");
        if (!model) {
            throw new Error("Diagram has no mxGraphModel element");
        }
        xmlRoot = model;
    } else {
        if (!diagramNode.textContent) {
            throw new Error(
                "Diagram has no mxGraphModel (uncompressed) nor text content (compressed) — is it a draw.io file at all?",
            );
        }

        const start1 = performance.now();
        let compressed = base64.decode(diagramNode.textContent);
        const end1 = performance.now();
        log(`Base64 decode took ${(end1 - start1).toFixed(2)}ms`);

        const start2 = performance.now();
        let diagram = inflateRaw(compressed, { to: "string" });
        const end2 = performance.now();
        log(`Inflate took ${(end2 - start2).toFixed(2)}ms`);

        const start3 = performance.now();
        // for some reason, this is URI-encoded.
        diagram = decodeURIComponent(diagram);
        const end3 = performance.now();
        log(`URI decode took ${(end3 - start3).toFixed(2)}ms`);

        if (verbose) {
            log("Decompressed diagram:", diagram);
        } else {
            log("Decompressed diagram, set DRAWIO_VERBOSE=1 to see it");
        }

        // Now parse XML again from the diagram content
        const start4 = performance.now();
        xmlRoot = mxUtils.parseXml(diagram).documentElement;
        const end4 = performance.now();
        log(`XML parse took ${(end4 - start4).toFixed(2)}ms`);
    }

    // @ts-ignore
    let editor = new Editor(true, null, null, null, null);
    editor.graph.container = document.createElement("svg");
    editor.graph.view.createHtml();
    editor.graph.stylesheet = defaultDrawioStyleSheet;
    editor.setGraphXml(xmlRoot);

    const getSvgStart = performance.now();
    /** @type {Element} */
    let svg = editor.graph.getSvg();
    const getSvgEnd = performance.now();
    log(`Get SVG took ${(getSvgEnd - getSvgStart).toFixed(2)}ms`);
    if (options.minify) {
        const minifyStart = performance.now();
        minify(svg);
        const minifyEnd = performance.now();
        log(`SVG minification took ${(minifyEnd - minifyStart).toFixed(2)}ms`);
    }

    const xmlStart = performance.now();
    const result = mxUtils.getXml(svg);
    const xmlEnd = performance.now();
    log(`Get XML took ${(xmlEnd - xmlStart).toFixed(2)}ms`);
    return result;
}

// TODO: a bunch of these could probably be rewritten in Rust actually?
/**
 * @param {Element} svg
 */
function minify(svg) {
    //-----------------------------------

    /**
     * @param {Element} node
     */
    function replaceFontWithSpan(node) {
        if (node.tagName === "foreignObject") {
            const fontElements = node.querySelectorAll("font");
            fontElements.forEach((fontNode) => {
                const spanNode = document.createElement("span");
                Array.from(fontNode.attributes).forEach((attr) => {
                    spanNode.setAttribute(attr.name, attr.value);
                });
                spanNode.innerHTML = fontNode.innerHTML;
                fontNode.replaceWith(spanNode);
            });
        }

        node.childNodes.forEach((child) => {
            if (child.nodeType === 1) {
                replaceFontWithSpan(/** @type {Element} */ (child));
            }
        });
    }

    replaceFontWithSpan(svg);

    //-----------------------------------

    const attributesToTransform = ["color", "fill", "stroke", "stroke-width", "opacity"];

    /**
     * @param {Element} node
     */
    function transformAttributesToStyle(node) {
        attributesToTransform.forEach((attr) => {
            if (node.hasAttribute(attr)) {
                let attrValue = node.getAttribute(attr);
                node.removeAttribute(attr);

                let currentStyle = node.getAttribute("style") || "";
                let newStyle = `${currentStyle};${attr}:${attrValue}`;
                // trim leading `;`
                newStyle = newStyle.replace(/^;/, "");
                node.setAttribute("style", newStyle);
            }
        });

        node.childNodes.forEach((child) => {
            if (child.nodeType === 1) {
                transformAttributesToStyle(/** @type {Element} */ (child));
            }
        });
    }

    transformAttributesToStyle(svg);

    //-----------------------------------
    // Remove `xmlns` for nodes under foreignObject
    /**
     * @param {Element} node
     * @param {boolean} [isInForeignObject=false]
     */
    function removeXmlnsUnderForeignObject(node, isInForeignObject = false) {
        if (isInForeignObject && node.hasAttribute("xmlns")) {
            node.removeAttribute("xmlns");
        }

        if (node.tagName === "foreignObject") {
            isInForeignObject = true;
        }

        node.childNodes.forEach((child) => {
            if (child.nodeType === 1) {
                removeXmlnsUnderForeignObject(/** @type {Element} */ (child), isInForeignObject);
            }
        });
    }

    removeXmlnsUnderForeignObject(svg);

    //-----------------------------------
    // Lift styles into classes

    /** @type {{ [key: string]: string }} */
    const classStyles = {};
    let classCounter = 0;

    /**
     * @returns {string}
     */
    function generateClassName() {
        const alphabet = "abcdefghijklmnopqrstuvwxyz";
        let name = "";
        let tempCounter = classCounter;
        do {
            name = alphabet[tempCounter % alphabet.length] + name;
            tempCounter = Math.floor(tempCounter / alphabet.length) - 1;
        } while (tempCounter >= 0);
        classCounter++;
        return name;
    }

    /**
     * @param {string} fontName
     * @returns {boolean}
     */
    function isIosevka(fontName) {
        return fontName.startsWith("Iosevka");
    }

    /**
     * @param {string} fontName
     * @returns {string}
     */
    function renameFonts(fontName) {
        if (isIosevka(fontName)) {
            return "IosevkaFtl";
        } else {
            return fontName;
        }
    }

    /**
     * @param {Element} node
     */
    function walkAndReplaceStyles(node) {
        if (node.hasAttribute("style")) {
            let styleValue = node.getAttribute("style");

            let cssDirectives = styleValue.split(";");
            // ignore empty directives
            cssDirectives = cssDirectives.filter((s) => s.length > 0);
            let cssDirectiveKeyValuePairs = cssDirectives.map((s) => s.split(":"));

            // trim whitespace for keys and values
            for (let pair of cssDirectiveKeyValuePairs) {
                pair[0] = pair[0].trim();
                pair[1] = pair[1].trim();

                if (pair[0] === "font-family") {
                    pair[1] = renameFonts(pair[1]);
                }
            }

            // sort key-pairs by key name
            cssDirectiveKeyValuePairs.sort((a, b) => a[0].localeCompare(b[0]));

            // build up the style string again
            styleValue = cssDirectiveKeyValuePairs.map((pair) => pair.join(":")).join(";");

            let className = Object.keys(classStyles).find((key) => classStyles[key] === styleValue);

            if (!className) {
                className = generateClassName();
                classStyles[className] = styleValue;
            }

            node.removeAttribute("style");
            node.setAttribute("class", className);
        }

        node.childNodes.forEach((child) => {
            if (child.nodeType === 1) {
                walkAndReplaceStyles(/** @type {Element} */ (child));
            }
        });
    }

    walkAndReplaceStyles(svg);

    let styleBuffer = Object.entries(classStyles)
        .map(([className, style]) => {
            return `.${className} { ${style} }`;
        })
        .join("");

    // add some generic styles
    styleBuffer += `
        foreignObject{pointer-events: none;}
      `;

    const collectedStyleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
    collectedStyleElement.textContent = styleBuffer;
    svg.insertBefore(collectedStyleElement, svg.firstChild);

    //-----------------------------------

    /**
     * @param {Element} node
     */
    function removeDataAttributes(node) {
        Array.from(node.attributes).forEach((attr) => {
            if (attr.name.startsWith("data-")) {
                node.removeAttribute(attr.name);
            }
            if (attr.name === "pointer-events") {
                node.removeAttribute(attr.name);
            }
        });

        node.childNodes.forEach((child) => {
            if (child.nodeType === 1) {
                removeDataAttributes(/** @type {Element} */ (child));
            }
        });
    }

    removeDataAttributes(svg);

    //-----------------------------------
    // Make selection behave nicely in the browser

    svg.setAttribute("pointer-events", "all");

    //-----------------------------------
    // Remove unnecessary groups

    /**
     * @param {Element} node
     */
    function removeUnnecessaryGroups(node) {
        if (node.tagName === "g" && node.attributes.length === 0 && node.childNodes.length === 1) {
            const childNode = node.firstChild;
            if (childNode && childNode.nodeType === 1) {
                node.replaceWith(/** @type {Element} */ (childNode));
            }
        }

        node.childNodes.forEach((child) => {
            if (child.nodeType === 1) {
                removeUnnecessaryGroups(/** @type {Element} */ (child));
            }
        });
    }

    removeUnnecessaryGroups(svg);

    //-----------------------------------

    // note: we don't run svgo because of this bug:
    // https://github.com/svg/svgo/issues/1678
}
