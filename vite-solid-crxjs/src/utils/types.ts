export interface Message {
    type: string;
    message?: string;
    data?: any;
}

export interface Action {
    type: string;
    url: string;
    elt: Element;
};
