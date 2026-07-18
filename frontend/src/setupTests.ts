import '@testing-library/jest-dom';

// Radix popovers measure/scroll elements that jsdom doesn't implement.
if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => { };
}
if (!(window as any).ResizeObserver) {
    (window as any).ResizeObserver = class {
        observe() { }
        unobserve() { }
        disconnect() { }
    };
}
if (!(window as any).PointerEvent) {
    (window as any).PointerEvent = class extends Event { } as any;
}
// jsdom lacks these Pointer Events APIs that Radix relies on for open/close.
if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => { };
}
if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => { };
}
