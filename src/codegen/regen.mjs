#!/usr/bin/env node

import fs from "fs";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

let outputPath = path.resolve(__dirname, "drawio-cinematic-universe.js");
console.log(`Generating ${outputPath}`);

let buffer = "";

buffer += `
import { JSDOM } from "jsdom";
let dom = new JSDOM("<html><head></head><body></body></html>");

global.window = dom.window;
Object.getOwnPropertyNames(window).forEach((prop) => {
  if (typeof global[prop] === "undefined") {
    if (prop === "undefined") {
      return;
    }

    Object.defineProperty(global, prop, {
      get: () => window[prop],
      set: (value) => {
        window[prop] = value;
      },
      configurable: true,
      enumerable: true,
    });
  }
});

navigator.appVersion = "5.0";
navigator.appName = "Netscape";
export const document = dom.window.document;

let mxIsElectron = false;
let mxLoadResources = false;
let mxForceIncludes = false;
let mxResourceExtension = false;
let mxCellEditorGetInitialValue = false;
let mxCellEditorGetCurrentValue = false;
let mxLoadStylesheets = false;
let mxGraphHandlerIsValidDropTarget = false;
let urlParams = {};
let Graph;
let Editor;
let HoverIcons;
let OpenFile;
`;

let numFilesMixed = 0;

function mix(filePath, exports) {
    numFilesMixed++;
    const absolutePath = path.resolve(__dirname, "input", filePath);
    const content = fs.readFileSync(absolutePath, "utf-8");
    buffer += `/** mixed in from ${absolutePath} */`;
    buffer += content + "\n";

    let automaticExport = filePath.split("/").pop().replace(".js", "");
    buffer += `
    if (typeof ${automaticExport} !== "undefined") {
      global.${automaticExport} = ${automaticExport};
      window.${automaticExport} = ${automaticExport};
    }
  `;

    (exports || []).forEach((exp) => {
        buffer += `
        export { ${exp} };
    `;
    });
}

// mxgraph/src

function mx(relPath, globals) {
    mix(`mxgraph/src/${relPath}`, globals);
}

mx("mxClient.js");
mx("util/mxLog.js");
mx("util/mxObjectIdentity.js");
mx("util/mxDictionary.js");
mx("util/mxResources.js");
mx("util/mxPoint.js");
mx("util/mxRectangle.js");
mx("util/mxEffects.js");
mx("util/mxUtils.js", ["mxUtils"]);
mx("util/mxConstants.js");
mx("util/mxEventObject.js");
mx("util/mxMouseEvent.js");
mx("util/mxEventSource.js");
mx("util/mxEvent.js");
mx("util/mxXmlRequest.js");
mx("util/mxClipboard.js");
mx("util/mxWindow.js");
mx("util/mxForm.js");
mx("util/mxImage.js");
mx("util/mxDivResizer.js");
mx("util/mxDragSource.js");
mx("util/mxToolbar.js");
mx("util/mxUndoableEdit.js");
mx("util/mxUndoManager.js");
mx("util/mxUrlConverter.js");
mx("util/mxPanningManager.js");
mx("util/mxPopupMenu.js");
mx("util/mxAutoSaveManager.js");
mx("util/mxAnimation.js");
mx("util/mxMorphing.js");
mx("util/mxImageBundle.js");
mx("util/mxImageExport.js");
mx("util/mxAbstractCanvas2D.js");
mx("util/mxXmlCanvas2D.js");
mx("util/mxSvgCanvas2D.js", ["mxSvgCanvas2D"]);
mx("util/mxGuide.js");
mx("shape/mxShape.js");
mx("shape/mxStencil.js");
mx("shape/mxStencilRegistry.js");
mx("shape/mxMarker.js");
mx("shape/mxActor.js");
mx("shape/mxCloud.js");
mx("shape/mxRectangleShape.js");
mx("shape/mxEllipse.js");
mx("shape/mxDoubleEllipse.js");
mx("shape/mxRhombus.js");
mx("shape/mxPolyline.js");
mx("shape/mxArrow.js");
mx("shape/mxArrowConnector.js");
mx("shape/mxText.js");
mx("shape/mxTriangle.js");
mx("shape/mxHexagon.js");
mx("shape/mxLine.js");
mx("shape/mxImageShape.js");
mx("shape/mxLabel.js");
mx("shape/mxCylinder.js");
mx("shape/mxConnector.js");
mx("shape/mxSwimlane.js");
mx("layout/mxGraphLayout.js");
mx("layout/mxStackLayout.js");
mx("layout/mxPartitionLayout.js");
mx("layout/mxCompactTreeLayout.js");
mx("layout/mxRadialTreeLayout.js");
mx("layout/mxFastOrganicLayout.js");
mx("layout/mxCircleLayout.js");
mx("layout/mxParallelEdgeLayout.js");
mx("layout/mxCompositeLayout.js");
mx("layout/mxEdgeLabelLayout.js");
mx("layout/hierarchical/model/mxGraphAbstractHierarchyCell.js");
mx("layout/hierarchical/model/mxGraphHierarchyNode.js");
mx("layout/hierarchical/model/mxGraphHierarchyEdge.js");
mx("layout/hierarchical/model/mxGraphHierarchyModel.js");
mx("layout/hierarchical/model/mxSwimlaneModel.js");
mx("layout/hierarchical/stage/mxHierarchicalLayoutStage.js");
mx("layout/hierarchical/stage/mxMedianHybridCrossingReduction.js");
mx("layout/hierarchical/stage/mxMinimumCycleRemover.js");
mx("layout/hierarchical/stage/mxCoordinateAssignment.js");
mx("layout/hierarchical/stage/mxSwimlaneOrdering.js");
mx("layout/hierarchical/mxHierarchicalLayout.js", ["mxHierarchicalEdgeStyle"]);
mx("layout/hierarchical/mxSwimlaneLayout.js");
mx("model/mxGraphModel.js", [
    "mxRootChange",
    "mxChildChange",
    "mxCollapseChange",
    "mxTerminalChange",
    "mxValueChange",
    "mxStyleChange",
    "mxGeometryChange",
    "mxVisibleChange",
    "mxCellAttributeChange",
]);
mx("model/mxCell.js");
mx("model/mxGeometry.js");
mx("model/mxCellPath.js");
mx("view/mxPerimeter.js");
mx("view/mxPrintPreview.js");
mx("view/mxStylesheet.js");
mx("view/mxCellState.js");
mx("view/mxGraphSelectionModel.js");
mx("view/mxCellEditor.js");
mx("view/mxCellRenderer.js");
mx("view/mxEdgeStyle.js");
mx("view/mxStyleRegistry.js");
mx("view/mxGraphView.js");
mx("view/mxGraph.js");
mx("view/mxCellOverlay.js");
mx("view/mxOutline.js");
mx("view/mxMultiplicity.js");
mx("view/mxLayoutManager.js");
mx("view/mxSwimlaneManager.js");
mx("view/mxTemporaryCellStates.js");
mx("view/mxCellStatePreview.js");
mx("view/mxConnectionConstraint.js");
mx("handler/mxGraphHandler.js");
mx("handler/mxPanningHandler.js");
mx("handler/mxPopupMenuHandler.js");
mx("handler/mxCellMarker.js");
mx("handler/mxSelectionCellsHandler.js");
mx("handler/mxConnectionHandler.js");
mx("handler/mxConstraintHandler.js");
mx("handler/mxRubberband.js");
mx("handler/mxHandle.js");
mx("handler/mxVertexHandler.js");
mx("handler/mxEdgeHandler.js");
mx("handler/mxElbowEdgeHandler.js");
mx("handler/mxEdgeSegmentHandler.js");
mx("handler/mxKeyHandler.js");
mx("handler/mxTooltipHandler.js");
mx("handler/mxCellTracker.js");
mx("handler/mxCellHighlight.js");
mx("io/mxCodecRegistry.js");
mx("io/mxCodec.js");
mx("io/mxObjectCodec.js");
mx("io/mxCellCodec.js");
mx("io/mxModelCodec.js");
mx("io/mxRootChangeCodec.js");
mx("io/mxChildChangeCodec.js");
mx("io/mxTerminalChangeCodec.js");
mx("io/mxGenericChangeCodec.js");
mx("io/mxGraphCodec.js");
mx("io/mxGraphViewCodec.js");
mx("io/mxStylesheetCodec.js");

// grapheditor

buffer += `
let uiTheme = {};
let STENCIL_PATH = {};
let GRAPH_IMAGE_PATH = "";
let IMAGE_PATH = "";
let STYLE_PATH = "";
let SHAPES_PATH = "";

global.DOMPurify = {
  sanitize: (html) => html,
  addHook: () => {},
};
window.DOMPurify = global.DOMPurify;
window.DOM_PURIFY_CONFIG = {};

mxGraphView.prototype.redrawEnumerationState = function (state) {
  // yolo
};
`;

mix("grapheditor/Graph.js", ["Graph"]);
mix("grapheditor/Editor.js", ["Editor"]);
mix("grapheditor/Shapes.js", []);

// styles

let defaultStylePath = path.resolve(__dirname, "input/styles/default.xml");
let defaultStylePayload = fs.readFileSync(defaultStylePath, "utf-8");

buffer += `
  let defaultStylePayload = \`${defaultStylePayload}\`;
  let defaultStyleXml = mxUtils.parseXml(defaultStylePayload);
  let styleDec = new mxCodec();
  let stylesheet = new mxStylesheet();
  styleDec.decode(defaultStyleXml.documentElement, stylesheet );
  export const defaultDrawioStyleSheet = stylesheet;
`;

fs.writeFileSync(outputPath, buffer, "utf-8");
console.log(`Generated ${outputPath} with ${numFilesMixed} files mixed.`);
