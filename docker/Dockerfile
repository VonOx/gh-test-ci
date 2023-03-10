ARG TARGET
ARG VERSION
ARG BUILD_DATE

FROM $TARGET/node:14-alpine

LABEL \
  org.label-schema.build-date=$BUILD_DATE \
  org.label-schema.version=$VERSION

COPY qemu-* /usr/bin/

# System dependencies
RUN apk add --no-cache tzdata nmap ffmpeg sqlite openssl gzip eudev

WORKDIR /tmp

# Install OZW in a dedicated RUN to benefit from Docker cache on local dev'
RUN apk add --no-cache --virtual .build-deps make g++ git coreutils \
    # Install OZW 1.6 - Commit 5d18bbfb21d8cdc61ee6baae6f478c963297dfc5 - March, 5th 2020
    && git clone https://github.com/OpenZWave/open-zwave.git \
    && cd open-zwave \
    && git checkout 5d18bbfb21d8cdc61ee6baae6f478c963297dfc5 \
    && make \
    && make install \
    && apk del .build-deps \
    && cd /tmp \
    && rm -rf /tmp/open-zwave

# Install Bluez dependencies
RUN apk add --no-cache bluez

# Install Gladys
RUN mkdir /src
WORKDIR /src
ADD . /src
COPY ./static /src/server/static
WORKDIR /src/server
RUN apk add --no-cache --virtual .build-deps make gcc g++ python3 git libffi-dev linux-headers \
    && ln -s /usr/bin/python3 /usr/bin/python && ln -s /usr/bin/pip3 /usr/bin/pip \
    && npm ci --unsafe-perm --production \
    && npm cache clean --force \
    && apk del .build-deps

ENV NODE_ENV production
ENV SERVER_PORT 80

# Export listening port
EXPOSE 80

CMD ["npm" ,"run", "start:prod"]
