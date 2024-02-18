import { render } from 'solid-js/web';
import Sidebar from './sidebar';
import '../styles/modern-normalize.css';
import './index.css';

const root = document.getElementById('root');

render(() => <Sidebar />, root!);

