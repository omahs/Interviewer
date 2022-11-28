import Monitor, { useMonitor } from './Monitor';

const defaultMonitorProps = {
  isDragging: false,
  meta: {},
};

const getMonitorProps = (state) => {
  const { source } = state;

  if (!source) { return { ...defaultMonitorProps }; }

  const monitorProps = {
    isDragging: true,
    meta: { ...source.meta },
  };

  return monitorProps;
};

const MonitorDragSource = (types) => Monitor(getMonitorProps, types);

// Hook version of the above using useMonitor:
export const useDragMonitor = (types) => useMonitor(getMonitorProps, types);

export default MonitorDragSource;
