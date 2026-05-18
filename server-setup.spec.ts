import type { Express, RequestHandler } from 'express';
import { describe, expect, it, vi } from 'vitest';

const { opalApiProxyMock } = vi.hoisted(() => ({
  opalApiProxyMock: vi.fn((_url: string, _ipLoggingEnabled: boolean): RequestHandler => {
    return (_req, _res, next) => next();
  }),
}));

vi.mock('@hmcts/opal-frontend-common-node/proxy/opal-api-proxy', () => ({
  default: opalApiProxyMock,
}));

import { configureApiProxyRoutes, getRoutesConfig } from './server-setup';

describe('server setup', () => {
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
      expect(Object.hasOwn(routesConfig.proxyConfiguration, 'opalApiUrl')).toBe(false);
    });
  });

  describe('configureApiProxyRoutes', () => {
    it('does not configure the legacy /api proxy route', () => {
      const app = { use: vi.fn() } as unknown as Express;

      const proxyConfiguration = {
        opalApiUrl: 'http://legacy-opal-api',
        opalFinesServiceUrl: 'http://opal-fines-service',
        opalUserServiceUrl: 'http://opal-user-service',
        opalRmServiceUrl: 'http://opal-rm-service',
      } as Parameters<typeof configureApiProxyRoutes>[1] & { opalApiUrl: string };

      configureApiProxyRoutes(app, proxyConfiguration);

      expect(app.use).toHaveBeenCalledTimes(3);
      expect(app.use).toHaveBeenCalledWith('/opal-fines-service', expect.any(Function));
      expect(app.use).toHaveBeenCalledWith('/opal-user-service', expect.any(Function));
      expect(app.use).toHaveBeenCalledWith('/opal-rm-service', expect.any(Function));
      expect(app.use).not.toHaveBeenCalledWith('/api', expect.any(Function));
      expect(opalApiProxyMock).not.toHaveBeenCalledWith('http://legacy-opal-api', expect.any(Boolean));
    });
  });
});
