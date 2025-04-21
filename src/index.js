
import { toSvg } from "./toSvg.js";
import { runServer } from "./lib.js";

const fs = require("fs");

function showHelp() {
    console.log("Usage:");
    console.log("  convert <file> [options]  Convert file to SVG");
    console.log("  serve                     Start HTTP server");
    console.log("\nOptions:");
    console.log("  --output, -o <file>  Output file");
    console.log("  --minify, -m         Whether to minify the output or not");
    console.log("  --help               Show this help message");
}

function convertCommand(args) {
    let inputFile = "-";
    let outputFile;
    let minify = false;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--output" || args[i] === "-o") {
            outputFile = args[++i];
        } else if (args[i] === "--minify" || args[i] === "-m") {
            minify = true;
        } else if (args[i].startsWith("-") && args[i] !== "-") {
            console.error(`Unknown option: ${args[i]}`);
            process.exit(1);
        } else {
            inputFile = args[i];
        }
    }

    let data;
    if (inputFile === "-") {
        data = fs.readFileSync(0, "utf8"); // 0 is stdin file descriptor
    } else {
        data = fs.readFileSync(inputFile, "utf8");
    }

    const svg = toSvg(data, { minify });
    if (outputFile) {
        fs.writeFileSync(outputFile, svg);
    } else {
        console.log(svg);
    }
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help")) {
    showHelp();
} else if (args[0] === "convert") {
    convertCommand(args.slice(1));
} else if (args[0] === "serve") {
    runServer();
} else {
    console.error("Unknown command. Use --help for usage information.");
    process.exit(1);
}
