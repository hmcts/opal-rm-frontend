FROM hmctsprod.azurecr.io/base/node:24-alpine AS build

WORKDIR /opt/app
USER hmcts

# The browser test binary is not needed to compile the application.
ENV CYPRESS_INSTALL_BINARY=0

COPY --chown=hmcts:hmcts . .

RUN test "$(node --version)" = "v$(cat .nvmrc)" \
    && corepack yarn install --immutable
RUN corepack yarn build:ssr \
    && mkdir runtime-metadata \
    && if [ -f version ]; then cp version runtime-metadata/; fi

FROM build AS production-dependencies

# The full install has already applied patches. Omit the workspace hook while
# pruning, because its patch-package executable is a development dependency.
RUN node -e "const fs = require('node:fs'); const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8')); delete manifest.scripts.postinstall; fs.writeFileSync('package.json', JSON.stringify(manifest));" \
    && corepack yarn workspaces focus --all --production

FROM hmctsprod.azurecr.io/base/node:24-alpine AS runtime

WORKDIR /opt/app
ENV NODE_ENV=production \
    PORT=5000

COPY --from=build --chown=hmcts:hmcts /opt/app/package.json ./
COPY --from=build --chown=hmcts:hmcts /opt/app/runtime-metadata/ ./
COPY --from=build --chown=hmcts:hmcts /opt/app/dist/opal-rm-frontend/browser ./dist/opal-rm-frontend/browser
COPY --from=build --chown=hmcts:hmcts /opt/app/dist/opal-rm-frontend/server ./dist/opal-rm-frontend/server
COPY --from=build --chown=hmcts:hmcts /opt/app/config/default.json /opt/app/config/production.json /opt/app/config/custom-environment-variables.json ./config/
COPY --from=production-dependencies --chown=hmcts:hmcts /opt/app/node_modules ./node_modules

USER hmcts
EXPOSE 5000
CMD ["node", "dist/opal-rm-frontend/server/main.js"]
