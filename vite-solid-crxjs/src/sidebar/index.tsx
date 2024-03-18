import { render } from 'solid-js/web';
import Sidebar from './sidebar';
import { SidebarProvider } from './provider';
import '../styles/modern-normalize.css';
import './index.css';

const root = document.getElementById('root');

render(
    () => (
        <SidebarProvider>
            <Sidebar />
        </SidebarProvider>
    ), 
    root!
);

