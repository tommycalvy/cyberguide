import GuideCreator from "./guide-creator";
import { render } from "solid-js/web";
import creatorWidgetSyles from "./components/creator-widget.module.css?inline";
import modernNormalizeStyles from "../styles/modern-normalize.css?inline";
import recordingCountdownStyles from "./components/recording-countdown.module.css?inline";
import fireRingClickStyles from "./components/fire-ring-click.module.css?inline";
import previewGuideStyles from "./components/preview-guide.module.css?inline";

console.log("Hello from GuideCreator.tsx");

const shadowHost = document.createElement("div");
shadowHost.id = "Cyber_Guide_Creator";
const shadowRoot = shadowHost.attachShadow({ mode: "open" });

const modernNormalizeSheet = new CSSStyleSheet();
modernNormalizeSheet.replaceSync(modernNormalizeStyles);

const creatorWidgetSheet = new CSSStyleSheet();
creatorWidgetSheet.replaceSync(creatorWidgetSyles);

const recordingCountdownSheet = new CSSStyleSheet();
recordingCountdownSheet.replaceSync(recordingCountdownStyles);

const fireRingClickSheet = new CSSStyleSheet();
fireRingClickSheet.replaceSync(fireRingClickStyles);

const previewGuideSheet = new CSSStyleSheet();
previewGuideSheet.replaceSync(previewGuideStyles);

shadowRoot.adoptedStyleSheets = [
    modernNormalizeSheet,
    creatorWidgetSheet,
    recordingCountdownSheet,
    fireRingClickSheet,
    previewGuideSheet,
];
document.body.append(shadowHost);

render(() => <GuideCreator />, shadowRoot);
