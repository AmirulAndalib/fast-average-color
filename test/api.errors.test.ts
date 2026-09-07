import 'jest-canvas-mock';
import { FastAverageColor, FastAverageColorOptions } from '../src/index';

describe('Public API: processing errors', () => {
    let fac: FastAverageColor;
    let resource: HTMLCanvasElement;
    let context: CanvasRenderingContext2D;
    let consoleError: jest.SpyInstance;

    beforeEach(() => {
        fac = new FastAverageColor();
        resource = document.createElement('canvas');
        resource.width = resource.height = 1;
        fac.canvas = document.createElement('canvas');
        context = fac.canvas.getContext('2d')!;
        consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        fac.destroy();
        jest.restoreAllMocks();
    });

    it.each([
        { options: { step: -1 }, message: 'step must be a positive safe integer' },
        { options: { algorithm: 'unknown' }, message: 'unknown is unknown algorithm' },
    ])('preserves the validation error: $message', ({ options, message }) => {
        const result = fac.getColor(resource, {
            ...options as FastAverageColorOptions,
            defaultColor: [10, 20, 30, 255],
        });

        expect(result.error?.message).toBe('FastAverageColor: ' + message);
        expect(result.value).toEqual([10, 20, 30, 255]);
        expect(consoleError).toHaveBeenCalledTimes(1);
        expect(consoleError).toHaveBeenCalledWith(result.error);
    });

    it.each([
        new Error('Drawing failed'),
        new DOMException('Frame is closed', 'InvalidStateError'),
    ])('preserves the original drawing error: %s', error => {
        jest.spyOn(context, 'drawImage').mockImplementationOnce(() => { throw error; });

        expect(fac.getColor(resource).error).toBe(error);
        expect(consoleError).toHaveBeenCalledTimes(1);
        expect(consoleError).toHaveBeenCalledWith(error);
    });

    it('preserves a SecurityError and logs it once', () => {
        const error = new DOMException('Canvas is tainted', 'SecurityError');
        jest.spyOn(context, 'getImageData').mockImplementationOnce(() => { throw error; });

        expect(fac.getColor(resource).error).toBe(error);
        expect(consoleError).toHaveBeenCalledTimes(1);
        expect(consoleError).toHaveBeenCalledWith(error);
    });

    it.each([
        new Error('Drawing failed'),
        new DOMException('Canvas is tainted', 'SecurityError'),
    ])('preserves errors without logging in silent mode: %s', error => {
        jest.spyOn(context, 'drawImage').mockImplementationOnce(() => { throw error; });

        expect(fac.getColor(resource, { silent: true }).error).toBe(error);
        expect(consoleError).not.toHaveBeenCalled();
    });

    it('preserves a SecurityError created in another window', () => {
        const iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        try {
            const view = iframe.contentWindow as Window & typeof globalThis;
            const error = new view.DOMException('Canvas is tainted', 'SecurityError');
            jest.spyOn(context, 'getImageData').mockImplementationOnce(() => { throw error; });

            expect(fac.getColor(resource).error).toBe(error);
            expect(consoleError).toHaveBeenCalledTimes(1);
            expect(consoleError).toHaveBeenCalledWith(error);
        } finally {
            iframe.remove();
        }
    });

    it('rejects getColorAsync with the original processing error', async () => {
        const error = new Error('Drawing failed');
        jest.spyOn(context, 'drawImage').mockImplementationOnce(() => { throw error; });

        await expect(fac.getColorAsync(resource, { silent: true })).rejects.toBe(error);
    });

    it('rejects with the original processing error after an image loads', async () => {
        const image = new Image();
        image.src = 'image.png';
        Object.defineProperties(image, {
            naturalWidth: { value: 1 },
            naturalHeight: { value: 1 },
        });
        const error = new Error('Drawing failed after load');
        jest.spyOn(context, 'drawImage').mockImplementationOnce(() => { throw error; });

        const promise = fac.getColorAsync(image, { silent: true });
        image.dispatchEvent(new Event('load'));

        await expect(promise).rejects.toBe(error);
    });
});
