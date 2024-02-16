import GuideCreator from "./guide-creator";
import { render } from "solid-js/web";
import creatorWidgetSyles from "./components/creator-widget.module.css?inline";
import modernNormalizeStyles from "../styles/modern-normalize.css?inline";
import recordingCountdownStyles from "./components/recording-countdown.module.css?inline";

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

shadowRoot.adoptedStyleSheets = [
    modernNormalizeSheet,
    creatorWidgetSheet,
    recordingCountdownSheet,
];
document.body.append(shadowHost);

render(() => <GuideCreator />, shadowRoot);
