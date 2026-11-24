import { HttpContextToken, type HttpInterceptorFn } from '@angular/common/http';
import { httpErrorInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-error';

export const ROUTE_OWNS_HTTP_ERROR = new HttpContextToken<boolean>(() => false);

export const routeOwnedHttpErrorInterceptor: HttpInterceptorFn = (request, next) =>
  request.context.get(ROUTE_OWNS_HTTP_ERROR) ? next(request) : httpErrorInterceptor(request, next);
