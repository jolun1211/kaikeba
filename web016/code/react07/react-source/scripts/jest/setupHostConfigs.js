'use strict';

const inlinedHostConfigs = require('../shared/inlinedHostConfigs');

// When testing the custom renderer code path through `react-reconciler`,
// turn the export into a function, and use the argument as host config.
const shimHostConfigPath = 'react-reconciler/src/ReactFiberHostConfig';
jest.mock('react-reconciler', () => {
  return config => {
    jest.mock(shimHostConfigPath, () => config);
    return require.requireActual('react-reconciler');
  };
});
const shimServerHostConfigPath = 'react-server/src/ReactServerHostConfig';
const shimServerFormatConfigPath = 'react-server/src/ReactServerFormatConfig';
jest.mock('react-server', () => {
  return config => {
    jest.mock(shimServerHostConfigPath, () => config);
    jest.mock(shimServerFormatConfigPath, () => config);
    return require.requireActual('react-server');
  };
});
jest.mock('react-server/flight', () => {
  return config => {
    jest.mock(shimServerHostConfigPath, () => config);
    jest.mock(shimServerFormatConfigPath, () => config);
    return require.requireActual('react-server/flight');
  };
});
const shimFlightClientHostConfigPath =
  'react-flight/src/ReactFlightClientHostConfig';
jest.mock('react-flight', () => {
  return config => {
    jest.mock(shimFlightClientHostConfigPath, () => config);
    return require.requireActual('react-flight');
  };
});

const configPaths = [
  'react-reconciler/src/ReactFiberHostConfig',
  'react-flight/src/ReactFlightClientHostConfig',
  'react-server/src/ReactServerHostConfig',
  'react-server/src/ReactServerFormatConfig',
];

function mockAllConfigs(rendererInfo) {
  configPaths.forEach(path => {
    // We want the reconciler to pick up the host config for this renderer.
    jest.mock(path, () => {
      let idx = path.lastIndexOf('/');
      let forkPath = path.substr(0, idx) + '/forks' + path.substr(idx);
      return require.requireActual(`${forkPath}.${rendererInfo.shortName}.js`);
    });
  });
}

// But for inlined host configs (such as React DOM, Native, etc), we
// mock their named entry points to establish a host config mapping.
inlinedHostConfigs.forEach(rendererInfo => {
  if (rendererInfo.shortName === 'custom') {
    // There is no inline entry point for the custom renderers.
    // Instead, it's handled by the generic `react-reconciler` entry point above.
    return;
  }
  rendererInfo.entryPoints.forEach(entryPoint => {
    jest.mock(entryPoint, () => {
      mockAllConfigs(rendererInfo);
      return require.requireActual(entryPoint);
    });
  });
});

// Make it possible to import this module inside
// the React package itself.
jest.mock('shared/ReactSharedInternals', () =>
  require.requireActual('react/src/ReactSharedInternals')
);

jest.mock('scheduler', () => require.requireActual('scheduler/unstable_mock'));
jest.mock('scheduler/src/SchedulerHostConfig', () =>
  require.requireActual('scheduler/src/forks/SchedulerHostConfig.mock.js')
);