import styles from './creator-widget.module.css';
import { draggable, type DraggableOptions } from '../../utils/draggable';
import { For } from 'solid-js';


interface RecordedElt {
    url: string;
    elt: Element;
}

interface CreatorWidgetProps {
    closeWidget: () => void;
    recording: () => boolean;
    startRecording: () => void;
    stopRecording: () => void;
    recordedElts: () => RecordedElt[];
}


function CreatorWidget(props: CreatorWidgetProps) {

    const draggableOptions: DraggableOptions = {
        handle: styles.move,
        pos: {
            x: 100,
            y: 100,
        }
    };
    return (
        <div class={styles.widget} use:draggable={draggableOptions}>
            <button class={styles.move}>M</button>
            <button 
                class={styles.record}
                onClick={() => props.recording() ? props.stopRecording() : props.startRecording()}
            >
                {props.recording() ? "Stop" : "Record"}
            </button>
            <For each={props.recordedElts()}>
                {recordedElt => (
                    <div>
                        <p>{recordedElt.url}</p>
                        <p>{recordedElt.elt.tagName}</p>
                    </div>
                )}
            </For>
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
