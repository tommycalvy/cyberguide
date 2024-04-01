class BackgroundManager {
    constructor() {
        this.backgrounds = [];
    }

    addBackground(background) {
        this.backgrounds.push(background);
    }

    getBackgrounds() {
        return this.backgrounds;
    }
}
