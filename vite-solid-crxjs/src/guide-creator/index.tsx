import CreatorWidget from "./components/creator-widget";
import { render } from "solid-js/web";
import styles from "./components/creator-widget.module.css?inline";
console.log("Hello from GuideCreator.tsx");

const shadowHost = document.createElement("div");
shadowHost.id = "Cyber_Guide_Creator";
const shadowRoot = shadowHost.attachShadow({ mode: "open" });

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);
shadowRoot.adoptedStyleSheets = [sheet];
document.body.append(shadowHost);

render(() => <CreatorWidget/>, shadowRoot);
