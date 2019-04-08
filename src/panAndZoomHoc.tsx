/*
  eslint-disable
  filenames/match-regex,
  filenames/match-exported,
  id-length
*/

import * as React from 'react';

const usePrevious = function <T>(value: T): T {
    const ref = React.useRef<T>();
    React.useEffect(() => {
        ref.current = value;
    });

    return ref.current!;
};

export default function panAndZoom<P>(
    WrappedComponent: React.SFC<P> |
        React.FunctionComponent<P> |
        React.ComponentClass<P> |
        string
): React.FunctionComponent<Overwrite<P, PanAndZoomHOCProps>> {
    const panAndZoomHOC = (
        {
            children,
            disableScrollZoom,
            ignorePanOutside,
            maxScale,
            minScale,
            onPanAndZoom,
            onPanEnd,
            onPanMove,
            onPanStart,
            onZoom,
            passOnProps,
            renderOnChange,
            scale,
            scaleFactor,
            x,
            y,
            ...other
        }: PanAndZoomHOCProps
    ): React.ReactElement | null => {
        const ref = React.useRef<HTMLElement>(null);

        const normalizeTouchPosition = (
            event: PointerEvent | WheelEvent
        ): {
            clientX: number;
            clientY: number;
        } => {
            const position = {
                clientX: event.clientX - ref.current!.getBoundingClientRect().left,
                clientY: event.clientY - ref.current!.getBoundingClientRect().top
            };

            return position;
        };

        const [
            // @ts-ignore
            _, // eslint-disable-line e,@typescript-eslint/no-unused-vars
            forceUpdate
        ] = React.useState();
        const diff = React.useRef({
            x: 0,
            y: 0,
            z: 0
        });
        const panning = React.useRef(false);
        const prev = React.useRef({
            x: 0,
            y: 0
        });

        const handlePointerDown = (
            event: PointerEvent
        ): void => {
            if (!panning.current) {
                const {
                    clientX,
                    clientY
                } = normalizeTouchPosition(event);
                prev.current.x = clientX;
                prev.current.y = clientY;
                panning.current = true;

                if (onPanStart) {
                    onPanStart(event);
                }

                if (!ignorePanOutside) {
                    // @ts-ignore
                    event.target.setPointerCapture(event.pointerId);
                }
            }
        };

        const handlePointerMove = (
            event: PointerEvent
        ): void => {
            if (panning.current) {
                if (x !== undefined && y !== undefined && scale !== undefined) {
                    const {
                        clientX,
                        clientY
                    } = normalizeTouchPosition(event);
                    const {
                        width,
                        height
                    } = ref.current!.getBoundingClientRect();

                    const dx = clientX - prev.current.x;
                    const dy = clientY - prev.current.y;
                    prev.current.x = clientX;
                    prev.current.y = clientY;
                    const sdx = dx / (width * (scale + diff.current.z));
                    const sdy = dy / (height * (scale + diff.current.z));
                    diff.current.x -= sdx;
                    diff.current.y -= sdy;

                    if (onPanMove) {
                        onPanMove(
                            x + diff.current.x,
                            y + diff.current.y,
                            event
                        );
                    }

                    if (renderOnChange) {
                        forceUpdate(null);
                    }
                }
            }
        };

        const handlePointerUp = (
            event: PointerEvent
        ): void => {
            if (
                panning.current &&
                x !== undefined &&
                y !== undefined &&
                scale !== undefined
            ) {
                try {
                    const {
                        clientX,
                        clientY
                    } = normalizeTouchPosition(event);
                    const {
                        width,
                        height
                    } = ref.current!.getBoundingClientRect();

                    if (
                        !ignorePanOutside ||
                        0 <= clientX &&
                        clientX <= width &&
                        0 <= clientY &&
                        clientY <= height
                    ) {
                        const dx = clientX - prev.current.x;
                        const dy = clientY - prev.current.y;
                        prev.current.x = clientX;
                        prev.current.y = clientY;
                        const sdx = dx / (width * (scale + diff.current.z));
                        const sdy = dy / (height * (scale + diff.current.z));
                        diff.current.x -= sdx;
                        diff.current.y -= sdy;
                    }
                } catch (error) {
                    // Happens when touches are used
                }

                panning.current = false;

                if (onPanEnd) {
                    onPanEnd(
                        x + diff.current.x,
                        y + diff.current.y,
                        event
                    );
                }

                if (renderOnChange) {
                    forceUpdate(null);
                }
            }
        };

        const handleWheel = (
            event: WheelEvent
        ): void => {
            if (disableScrollZoom) {
                return;
            }

            if (
                x !== undefined &&
                y !== undefined &&
                scale !== undefined &&
                scaleFactor !== undefined &&
                minScale !== undefined &&
                maxScale !== undefined
            ) {
                const { deltaY } = event;
                const newScale = deltaY < 0 ?
                    Math.min((scale + diff.current.z) * scaleFactor, maxScale) :
                    Math.max((scale + diff.current.z) / scaleFactor, minScale);
                const factor = newScale / (scale + diff.current.z);

                if (factor !== 1) {
                    const {
                        width,
                        height
                    } = ref.current!.getBoundingClientRect();
                    const {
                        clientX,
                        clientY
                    } = normalizeTouchPosition(event);
                    const dx = (clientX / width - 0.5) / (scale + diff.current.z);
                    const dy = (clientY / height - 0.5) / (scale + diff.current.z);
                    const sdx = dx * (1 - 1 / factor);
                    const sdy = dy * (1 - 1 / factor);

                    diff.current.x += sdx;
                    diff.current.y += sdy;
                    diff.current.z = newScale - scale;

                    if (onPanAndZoom) {
                        onPanAndZoom(
                            x + diff.current.x,
                            y + diff.current.y,
                            scale + diff.current.z,
                            event
                        );
                    }

                    if (onZoom) {
                        onZoom(x, y, scale, event);
                    }

                    if (renderOnChange) {
                        forceUpdate(null);
                    }
                }
            }
        };

        if (
            x !== undefined &&
            y !== undefined &&
            scale !== undefined
        ) {
            const prevDiff = usePrevious({
                x,
                y,
                z: scale
            });

            if (
                prevDiff &&
                (
                    x !== prevDiff.x ||
                    y !== prevDiff.y
                )
            ) {
                diff.current.x = 0;
                diff.current.y = 0;
            }
            if (
                prevDiff &&
                scale !== prevDiff.z
            ) {
                diff.current.z = 0;
            }

            const passedProps = passOnProps ?
                {
                    scale: scale + diff.current.z,
                    x: x + diff.current.x,
                    y: y + diff.current.y
                } :
                {};

            return (

                // @ts-ignore
                <WrappedComponent
                    {...passedProps}
                    {...other}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onWheel={handleWheel}
                    ref={ref}
                >
                    {children}
                </WrappedComponent>
            );
        } else {
            return null;
        }
    };

    panAndZoomHOC.defaultProps = {
        maxScale: Number.POSITIVE_INFINITY,
        minScale: Number.EPSILON,
        passOnProps: false,
        renderOnChange: false,
        scale: 1,
        scaleFactor: Math.sqrt(2),
        x: 0.5,
        y: 0.5
    };

    return panAndZoomHOC as unknown as React.FunctionComponent<Overwrite<P, PanAndZoomHOCProps>>;
}

export type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;

export interface PanAndZoomHOCProps {
    children: React.ReactElement | React.ReactElement[];
    disableScrollZoom?: boolean;
    ignorePanOutside?: boolean;
    maxScale?: number;
    minScale?: number;
    onPanAndZoom?: (x: number, y: number, scale: number, event: WheelEvent) => void;
    onPanEnd?: (x: number, y: number, event: MouseEvent | TouchEvent) => void;
    onPanMove?: (x: number, y: number, event: MouseEvent | TouchEvent) => void;
    onPanStart?: (event: MouseEvent | TouchEvent) => void;
    onZoom?: (x: number | undefined, y: number | undefined, scale: number | undefined, event: WheelEvent) => void;
    passOnProps?: boolean;
    renderOnChange?: boolean;
    scale?: number;
    scaleFactor?: number;
    x?: number;
    y?: number;
}
