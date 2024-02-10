import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import logo from '../logo.svg';
import styles from './App.module.css';

const App: Component = () => {

    const [count, setCount] = createSignal(0);
    setInterval(() => setCount(c => c + 1), 10);
    return (
        <div class={styles.App}>
            <header class={styles.header}>
                <img src={logo} class={styles.logo} alt="logo" />
                <p>
                    Edit <code>src/App.tsx</code> and save to reload.
                </p>
                <a class={styles.link} href="https://github.com/solidjs/solid"
                    target="_blank" rel="noopener noreferrer"
                >
                    Learn Solid
                </a>
                <h1>Hello World</h1>
                <h2>Count: {count()}</h2>
            </header>
        </div>
    );
};

export default App;
