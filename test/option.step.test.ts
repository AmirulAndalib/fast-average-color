import { FastAverageColor } from '../src/index';

const { runInNewContext } = jest.requireActual('node:vm');

describe('Options: step', () => {
    const fac = new FastAverageColor();

    describe.each(['simple', 'sqrt', 'dominant'] as const)('%s algorithm', algorithm => {
        it.each([0, -1, 0.5, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])(
            'rejects invalid step %s', step => {
                // A VM timeout keeps a regression from hanging the test runner.
                expect(() => runInNewContext(
                    'fac.getColorFromArray4(pixels, { algorithm, step })',
                    { fac, pixels: [255, 0, 0, 255], algorithm, step },
                    { timeout: 250 }
                )).toThrow('FastAverageColor: step must be a positive safe integer');
            }
        );

        it.each([undefined, 1, Number.MAX_SAFE_INTEGER])('accepts step %s', step => {
            expect(fac.getColorFromArray4([255, 0, 0, 255], { algorithm, step }))
                .toEqual([255, 0, 0, 255]);
        });

        it('samples every second pixel', () => {
            expect(fac.getColorFromArray4([
                255, 0, 0, 255,
                0, 0, 255, 255,
                255, 0, 0, 255,
                0, 0, 255, 255,
            ], { algorithm, step: 2 })).toEqual([255, 0, 0, 255]);
        });
    });

    it('should return average color with step', () => {
        const color = fac.getColorFromArray4(
            [
                100, 100, 100, 100,
                200, 200, 200, 200,
                150, 150, 150, 150,
                50, 50, 50, 50
            ],
            { step: 2 }
        );

        expect(color).toEqual([132, 132, 132, 125]);
    });
});
