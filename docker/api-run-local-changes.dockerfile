# Build and deploy the api!
# [[host:port/]registry/]name[:tag][@digest]
FROM howdju/premiser-api-base

# Copy local changes
COPY premiser-api /howdju/premiser-api
COPY howdju-ops /howdju/howdju-ops
COPY howdju-common /howdju/howdju-common
COPY howdju-service-common /howdju/howdju-service-common

WORKDIR /howdju/premiser-api

RUN \
  yarn add /howdju/howdju-ops && \
  yarn add /howdju/howdju-common && \
  yarn add /howdju/howdju-service-common && \
  yarn install

CMD yarn run local
