import { toSvg } from "./toSvg.js";
import * as http from "http";

/** @type {number} */
let port = parseInt(process.env.PORT ?? "3000", 10);

/** @type {boolean} */
export let verbose = process.env.DRAWIO_VERBOSE === "1";
/** @type {boolean} */
export let quiet = process.env.DRAWIO_QUIET === "1";

/**
 * @param {...any} args
 * @return {void}
 */
export function log(...args) {
    if (!quiet) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}]`, ...args);
    }
}

export function runServer() {
    const server = http.createServer((req, res) => {
        if (req.method === "POST") {
            let body = "";
            const readStart = Date.now();
            req.on("data", (chunk) => {
                body += chunk.toString();
            });
            req.on("end", () => {
                const readDuration = Number((Date.now() - readStart).toFixed(2));
                try {
                    if (!req.url) {
                        throw new Error("URL is required");
                    }
                    const url = new URL(req.url, `http://${req.headers.host}`);
                    const minify = url.searchParams.get("minify") === "1";
                    const svgStart = Date.now();
                    const svg = toSvg(body, { minify });
                    const svgDuration = Number((Date.now() - svgStart).toFixed(2));
                    log(`Body read time: ${readDuration}ms`);
                    log(`SVG conversion time: ${svgDuration}ms`);
                    res.writeHead(200, { "Content-Type": "image/svg+xml" });
                    res.end(svg);
                } catch (err) {
                    res.writeHead(500, { "Content-Type": "text/plain" });
                    res.end(/** @type {Error} */ (err).stack);
                }
            });
        } else {
            res.writeHead(405, { "Content-Type": "text/plain" });
            res.end("Method Not Allowed");
        }
    });

    server.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}
