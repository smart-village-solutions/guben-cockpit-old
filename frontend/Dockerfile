FROM node:22-alpine

ARG VITE_STRAPI_URL
ENV VITE_STRAPI_URL=$VITE_STRAPI_URL

ARG VITE_CONTENT_GATEWAY_URL
ENV VITE_CONTENT_GATEWAY_URL=$VITE_CONTENT_GATEWAY_URL

ARG VITE_BOOKING_SDK
ENV VITE_BOOKING_SDK=$VITE_BOOKING_SDK

ARG VITE_BOOKING_URL
ENV VITE_BOOKING_URL=$VITE_BOOKING_URL

ARG VITE_BOOKING_LOGIN
ENV VITE_BOOKING_LOGIN=$VITE_BOOKING_LOGIN

ARG VITE_TRANSLATE_URL
ENV VITE_TRANSLATE_URL=$VITE_TRANSLATE_URL

ARG VITE_TRANSLATE_API_KEY
ENV VITE_TRANSLATE_API_KEY=$VITE_TRANSLATE_API_KEY

ARG VITE_MATOMO_JS
ENV VITE_MATOMO_JS=$VITE_MATOMO_JS

WORKDIR /app/frontend
COPY frontend/package.json .
COPY frontend/package-lock.json .

RUN npm ci
RUN ln -s /app/frontend/node_modules /app/node_modules

COPY frontend .
COPY shared ../shared
COPY frontend/docker/start-frontend.sh /usr/local/bin/start-frontend
COPY frontend/docker/start-frontend-live.sh /usr/local/bin/start-frontend-live
COPY frontend/docker/serve-dist.mjs /app/docker/serve-dist.mjs
RUN chmod +x /usr/local/bin/start-frontend /usr/local/bin/start-frontend-live

EXPOSE 3000

CMD [ "start-frontend" ]
