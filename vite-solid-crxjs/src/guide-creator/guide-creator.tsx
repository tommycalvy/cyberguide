import type { Component } from 'solid-js';
import { createSignal, Show, createEffect } from 'solid-js';
import CreatorWidget from "./components/creator-widget";

const GuideCreator: Component = () => {
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
