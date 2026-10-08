# tracker asks for this, local dev runs vite directly so it stays dormant
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
# baked at build time, pass real urls through compose args in deploy
ARG VITE_API_URL=http://localhost:8080/api/v1
ARG VITE_WS_URL=http://localhost:8080/ws
ARG VITE_CPUT_EMERGENCY_PHONE=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_CPUT_EMERGENCY_PHONE=$VITE_CPUT_EMERGENCY_PHONE
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
