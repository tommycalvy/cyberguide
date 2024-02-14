import type { Component } from 'solid-js';
import { JSX } from 'solid-js';
import styles from './creator-widget.module.css';

interface CreatorWidgetProps {
    closeWidget: () => void;
}

function CreatorWidget(props: CreatorWidgetProps): JSX.Element {

    return (
        <div class={styles.widget}>
            <button class={styles.move}>M</button>
            <button class={styles.record}>Record</button>
            <button 
                class={styles.close}
                onClick={props.closeWidget}
            >
                X
            </button>
        </div>
    );
}

export default CreatorWidget;
