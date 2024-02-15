import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';
import CreatorWidget from "./components/creator-widget";
import browser from 'webextension-polyfill';

const GuideCreator: Component = () => {
    const [widgetOpen, setWidgetOpen] = createSignal(true);

    const bport = browser.runtime.connect({name: "gc"});
    bport.postMessage({type: "init"});
    bport.onMessage.addListener((msg) => {
        if (msg.type === "init") {
            console.log("Background.ts sent state: ", msg);
        } else if (msg.type === "show-widget") {
            setWidgetOpen(true);
        }
    });

    function closeWidget() {
        setWidgetOpen(false);
    }

    return (
        <Show when={widgetOpen()}>
            <CreatorWidget closeWidget={closeWidget}/>
        </Show>
    );
}

export default GuideCreator;
