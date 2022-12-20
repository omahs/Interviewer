import { useState, useEffect } from 'react';
import useResizeObserver from '@react-hook/resize-observer';

const useSize = (target) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useResizeObserver(target, (entry) => setSize(entry.contentRect));
  return size;
};

export default useSize;
