import config from 'config';
import type { Express, RequestHandler } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { opalApiProxyMock, sessionStorageEnableForMock } = vi.hoisted(() => ({
  opalApiProxyMock: vi.fn((): RequestHandler => {
    return (_req, _res, next) => next();
  }),
  sessionStorageEnableForMock: vi.fn(),
}));

vi.mock('@hmcts/opal-frontend-common-node/proxy/opal-api-proxy', () => ({
  default: opalApiProxyMock,
}));

vi.mock('@hmcts/opal-frontend-common-node/session/session-storage', () => ({
  default: class {
    enableFor = sessionStorageEnableForMock;
  },
}));

import { configureApiProxyRoutes, configureSession, getRoutesConfig } from '../server-setup';

describe('server setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRoutesConfig', () => {
    it('configures the common-node user state route', () => {
      const routesConfig = getRoutesConfig() as ReturnType<typeof getRoutesConfig> & {
        userStateConfiguration?: {
          cacheKeyPrefix: string;
          routePath: string;
          tokenClaim: string;
        };
      };

      expect(routesConfig.opalUserServiceConfiguration.userStateUrl).toBe('/v2/users/0/state');
      expect(routesConfig.userStateConfiguration).toEqual({
        cacheKeyPrefix: 'USER_STATE_',
        routePath: '/api/user-state',
        tokenClaim: 'sub',
      });
      expect(routesConfig.proxyConfiguration.opalRmServiceUrl).toBe('http://localhost:4556');
      expect(routesConfig.proxyConfiguration.timeoutInMilliseconds).toBe(
        config.get<number>('opal-api.timeoutInMilliseconds'),
      );
      expect(Object.hasOwn(routesConfig.proxyConfiguration, 'opalApiUrl')).toBe(false);
    });
  });

  describe('configureApiProxyRoutes', () => {
    it('does not configure the legacy /api proxy route', () => {
      const app = { use: vi.fn() } as unknown as Express;
      const timeoutInMilliseconds = 30_000;

      const proxyConfiguration = {
        opalApiUrl: 'http://legacy-opal-api',
        opalFinesServiceUrl: 'http://opal-fines-service',
        opalUserServiceUrl: 'http://opal-user-service',
        opalRmServiceUrl: 'http://opal-rm-service',
        timeoutInMilliseconds,
      } as Parameters<typeof configureApiProxyRoutes>[1] & { opalApiUrl: string };

      configureApiProxyRoutes(app, proxyConfiguration);

      expect(app.use).toHaveBeenCalledTimes(3);
      expect(app.use).toHaveBeenCalledWith('/opal-fines-service', expect.any(Function));
      expect(app.use).toHaveBeenCalledWith('/opal-user-service', expect.any(Function));
      expect(app.use).toHaveBeenCalledWith('/opal-rm-service', expect.any(Function));
      expect(app.use).not.toHaveBeenCalledWith('/api', expect.any(Function));
      expect(opalApiProxyMock).not.toHaveBeenCalledWith('http://legacy-opal-api', expect.any(Boolean));
      expect(opalApiProxyMock).toHaveBeenNthCalledWith(
        1,
        'http://opal-fines-service',
        config.get<boolean>('features.ip-logging.enabled'),
        timeoutInMilliseconds,
      );
      expect(opalApiProxyMock).toHaveBeenNthCalledWith(
        2,
        'http://opal-user-service',
        config.get<boolean>('features.ip-logging.enabled'),
        timeoutInMilliseconds,
      );
      expect(opalApiProxyMock).toHaveBeenNthCalledWith(
        3,
        'http://opal-rm-service',
        config.get<boolean>('features.ip-logging.enabled'),
        timeoutInMilliseconds,
      );
    });

    it('fails before configuring API proxy routes when the timeout is missing', () => {
      const app = { use: vi.fn() } as unknown as Express;
      const proxyConfiguration = {
        opalFinesServiceUrl: 'http://opal-fines-service',
        opalUserServiceUrl: 'http://opal-user-service',
        opalRmServiceUrl: 'http://opal-rm-service',
        timeoutInMilliseconds: null,
      } as Parameters<typeof configureApiProxyRoutes>[1];

      expect(() => configureApiProxyRoutes(app, proxyConfiguration)).toThrow(
        'Missing opal-api.timeoutInMilliseconds configuration.',
      );
      expect(app.use).not.toHaveBeenCalled();
      expect(opalApiProxyMock).not.toHaveBeenCalled();
    });
  });

  describe('configureSession', () => {
    it('uses the managed Redis connection string from Key Vault', () => {
      expect(config.has('secrets.opal.managed-redis-connection-string')).toBe(true);
      expect(config.has('secrets.opal.redis-connection-string')).toBe(false);

      configureSession({} as Express);

      expect(sessionStorageEnableForMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          redisConnectionString: 'redis://localhost:6379',
        }),
      );
    });
  });
});
