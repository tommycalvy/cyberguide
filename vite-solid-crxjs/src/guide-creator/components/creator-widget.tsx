import type { Component } from 'solid-js';
import styles from './creator-widget.module.css';

const CreatorWidget: Component = () => {
    return (
        <div class={styles.widget}>
            <button class={styles.move}>M</button>
            <button class={styles.record}>Record</button>
            <button class={styles.close}>X</button>
        </div>
    );
}

export default CreatorWidget;
