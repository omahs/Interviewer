import { useRef, useCallback } from 'react';
import Hammer from 'hammerjs';
import getAbsoluteBoundingRect from '../../utils/getAbsoluteBoundingRect';

// -1000 - 1000 space, 0,0 center
const LAYOUT_SPACE = 2000;

const useViewport = () => {
  const state = useRef({
    zoom: 1,
    center: { x: 0.5, y: 0.5 },
    screen: { width: 0, height: 0 },
  });

  const zoomViewport = useCallback((factor = 1.5) => {
    state.current.zoom *= factor;
  }, []);

  const moveViewport = useCallback((x = 0, y = 0) => {
    state.current.center = {
      x: state.current.center.x + (x / state.current.zoom),
      y: state.current.center.y + (y / state.current.zoom),
    };
  }, []);

  const initializeViewport = useCallback((el) => {
    state.current.screen = getAbsoluteBoundingRect(el);
    // TODO: watch for resize??
    // Bind drag events?
    // el.addEventListener('mousemove', () => console.log('view port'));

    const mc = new Hammer.Manager(el);
    const pinch = new Hammer.Pinch();
    const pan = new Hammer.Pan();

    // add to the Manager
    mc.add([pinch, pan]);

    mc.get('pan').set({ direction: Hammer.DIRECTION_ALL });

    mc.on('panleft panright panup pandown pinch', (e) => {
      switch (e.type) {
        case 'panleft':
        case 'panright':
        case 'pandown':
        case 'panup':
          console.log('pan', { e, dx: e.velocityX / state.current.zoom, dy: e.velocityY / state.current.zoom });
          moveViewport(e.velocityX / (100 * state.current.zoom), e.velocityY / (100 * state.current.zoom));
          return;
        default:
          console.log('viewport hammer', e.type);
      }
    });
    console.log({ screen: state.current.screen });
  }, [moveViewport, zoomViewport]);

  // Convert relative coordinates (0-1) into pixel coordinates for d3-force
  // -1000 - -1000 space, 0,0 center
  const calculateLayoutCoords = useCallback(({ x, y }) => ({
    x: (x - 0.5) * LAYOUT_SPACE,
    y: (y - 0.5) * LAYOUT_SPACE,
  }), []);

  // Convert pixel coordinates into relative coordinates (0-1)
  const calculateRelativeCoords = useCallback(({ x, y }) => ({
    x: (x / LAYOUT_SPACE) + 0.5,
    y: (y / LAYOUT_SPACE) + 0.5,
  }), []);

  // Calculate relative position accounting for viewport
  const calculateViewportRelativeCoords = useCallback(({ x, y }) => {
    const { center, zoom } = state.current;

    return {
      x: (((x - center.x) * zoom) + 0.5),
      y: (((y - center.y) * zoom) + 0.5),
    };
  }, []);

  // Convert a relative coordinate into position on the screen accounting for viewport
  const calculateViewportScreenCoords = useCallback(({ x, y }) => {
    const { center, zoom, screen: { width, height } } = state.current;

    return {
      x: (((x - center.x) * zoom * width) + (0.5 * width)),
      y: (((y - center.y) * zoom * height) + (0.5 * height)),
    };
  }, []);

  return [
    state,
    initializeViewport,
    moveViewport,
    zoomViewport,
    calculateLayoutCoords,
    calculateRelativeCoords,
    calculateViewportRelativeCoords,
    calculateViewportScreenCoords,
  ];
};

export default useViewport;
