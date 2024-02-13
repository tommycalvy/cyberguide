import type { Component } from 'solid-js';
import '../styles/modern-normalize.css';
import '../styles/button.css';
import styles from './Popup.module.css';

const App: Component = () => {

    return (
        <div class={styles.Popup}>
            <h1>CyberGuide</h1>
            <div class={styles.buttons}>
                <button class={styles.record}>Record</button>
                <button class={styles.widget}>Widget</button>
                <button class={styles.settings}>Settings</button>
            </div>
            <div>
                <p>Version: 0.0.1</p>
            </div>
        </div>
    );
};

export default App;
