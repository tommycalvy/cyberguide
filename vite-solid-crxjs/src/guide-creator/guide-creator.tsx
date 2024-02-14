import type { Component } from 'solid-js';
import { createSignal, Show, createEffect } from 'solid-js';
import CreatorWidget from "./components/creator-widget";
import browser from 'webextension-polyfill';

const GuideCreator: Component = () => {
    const bport = browser.runtime.connect({name: "gc"});
    bport.postMessage({type: "init"});
    bport.onMessage.addListener((msg) => {
        console.log("Received message from background: ", msg);
    });
    const [widgetOpen, setWidgetOpen] = createSignal(true);

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
