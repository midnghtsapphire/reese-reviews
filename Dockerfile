FROM node:20-alpine AS builder
WORKDIR /app

# Accept VITE_ env vars as build args so they are available during npm run build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_OPENROUTER_API_KEY
ARG VITE_FALLBACK_PASSWORD

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_OPENROUTER_API_KEY=$VITE_OPENROUTER_API_KEY
ENV VITE_FALLBACK_PASSWORD=$VITE_FALLBACK_PASSWORD

COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
# Git-Master (issue #99 follow-up, Trivy DS-0002): run as the non-root `nginx` user
# (uid 101) that the nginx:alpine image already ships. Port 8080 is above 1024, so no
# root is needed to bind it. nginx writes only to its cache dir and its pid file:
# the cache dir is chowned to nginx, and the pid file moves from /var/run to /tmp
# (the `user` directive is commented out because it only works for a root master).
RUN chown -R nginx:nginx /var/cache/nginx \
    && sed -i -E 's#^pid[[:space:]]+/var/run/nginx.pid;#pid /tmp/nginx.pid;#; s/^(user[[:space:]]+nginx;)/# \1/' /etc/nginx/nginx.conf
EXPOSE 8080
USER nginx
CMD ["nginx", "-g", "daemon off;"]
