import * as fs from "fs";
import { toSvg } from "./toSvg.js";

let inputFile = "sample.drawio";
let outputFile = "/tmp/sample.svg";

fs.readFile(inputFile, "utf8", (err, data) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    const svg = toSvg(data, { minify: true });
    if (outputFile) {
        fs.writeFile(outputFile, svg, (err) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
        });
    } else {
        console.log(svg);
    }
});
