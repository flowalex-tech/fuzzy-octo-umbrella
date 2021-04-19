---
title: 'Old Docker Compose Config'
author: Alex Wolf
image: /assets/img/2020-04/image-my-post.jpg
description: 'Old docker-compose configs'
tags:
  - docker
favorite: false
---

Old config that was used for plex, wordpress, grafana, and a few other tools for monitoring that is no longer in use
```yaml
version: "2"

services:

  nginx-proxy:
    image: jwilder/nginx-proxy
    container_name: proxy
    ports:
      - 80:80
      - 443:443
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - /etc/nginx/vhost.d
      - /location/for/certs:/etc/nginx/certs:ro
      - /usr/share/nginx/html
    networks:
      - proxy_net
      - monitor_net
    labels:
      - com.github.jrcs.letsencrypt_nginx_proxy_companion.nginx_proxy

  letsencrypt:
    image: jrcs/letsencrypt-nginx-proxy-companion
    container_name: encrypt
    depends_on:
      - nginx-proxy
    volumes:
      - /location/for/certs:/etc/nginx/certs:rw
      - /var/run/docker.sock:/var/run/docker.sock:ro
    volumes_from:
      - nginx-proxy
    networks:
      - proxy_net
      - monitor_net

  certs:
    image: tutum/apache-php
    container_name: certs
    environment:
      - VIRTUAL_HOST=example.com,www.example.com,test.example.com,other.example.com
      - LETSENCRYPT_HOST=example.com,www.example.com,test.example.com,other.example.com
      - LETSENCRYPT_EMAIL=certs@example.com
    networks:
      - cert_net

  plex:
    container_name: plex
    image: plexinc/pms-docker:latest
    networks:
      - proxy_net
      - monitor_net
    environment:
      - PLEX_UID=${USER_ID}
      - PLEX_GID=${GROUP_ID}
      - VIRTUAL_HOST=plex.alexanderwolf.io
    volumes:
      - /home/videos/TV_Shows:/tv_shows
      - /home/videos/Movies:/movies
      - /home/music:/music
      - ./media/plex/config/:/config
      - /home/videos/Music_Videos:/music_videos
    depends_on:
      - nginx-proxy
      - letsencrypt
    restart: always
  db:
     image: mysql:5.7
     volumes:
       - db_data:/var/lib/mysql
     restart: always
     networks:
      - proxy_net
      - monitor_net
     environment:
       MYSQL_ROOT_PASSWORD: wordpress
       MYSQL_DATABASE: wordpress
       MYSQL_USER: wordpress
       MYSQL_PASSWORD: wordpress
  wordpress_cookbook:
     depends_on:
       - db
       - nginx-proxy
       - letsencrypt
     image: wordpress:latest
     ports:
       - "8000:80"
     restart: always
     networks:
      - proxy_net
      - monitor_net
     environment:
       WORDPRESS_DB_HOST: db:3306
       WORDPRESS_DB_USER: wordpress
       WORDPRESS_DB_PASSWORD: wordpress
       WORDPRESS_DB_NAME: wordpress
       VIRTUAL_HOST: cookbook.alexanderwolf.io
  prometheus:
    image: prom/prometheus:v2.11.1
    container_name: prometheus
    volumes:
      - ./prometheus/:/etc/prometheus/
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    restart: unless-stopped
    expose:
      - 9090
    networks:
      - monitor_net
    labels:
      org.label-schema.group: "monitoring"


  alertmanager:
    image: prom/alertmanager:v0.18.0
    container_name: alertmanager
    volumes:
      - ./alertmanager/:/etc/alertmanager/
    command:
      - '--config.file=/etc/alertmanager/config.yml'
      - '--storage.path=/alertmanager'
    restart: unless-stopped
    expose:
      - 9093
    networks:
      - monitor_net
    labels:
      org.label-schema.group: "monitoring"

  nodeexporter:
    image: prom/node-exporter:v0.18.1
    container_name: nodeexporter
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped
    expose:
      - 9100
    networks:
      - monitor_net
    labels:
      org.label-schema.group: "monitoring"

  cadvisor:
    image: google/cadvisor:v0.33.0
    container_name: cadvisor
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      #- /cgroup:/cgroup:ro #doesn't work on MacOS only for Linux
    restart: unless-stopped
    expose:
      - 8080
    networks:
      - monitor_net
    labels:
      org.label-schema.group: "monitoring"

  grafana:
    image: grafana/grafana:6.2.5
    container_name: grafana
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/datasources:/etc/grafana/datasources
      - ./grafana/dashboards:/etc/grafana/dashboards
      - ./grafana/setup.sh:/setup.sh
    environment:
      - VIRTUAL_HOST=grafana.alexanderwolf.io
      - GF_SECURITY_ADMIN_USER=flowalex
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    restart: unless-stopped
    expose:
      - 3000
    networks:
      - monitor_net
      - proxy_net
    depends_on:
      - nginx-proxy
      - letsencrypt

  bitwarden:
    image: bitwardenrs/server
    container_name: bitwarden.alexanderwolf.io
    restart: always
    volumes:
      - ./bw-data:/data
    depends_on:
      - nginx-proxy
      - letsencrypt
    environment:
      - WEBSOCKET_ENABLED=true # Required to use websockets
      - SIGNUPS_ALLOWED=true # set to false to disable signups
      - VIRTUAL_HOST=bitwarden.alexanderwolf.io
    networks:
      - monitor_net
      - proxy_net

  pushgateway:
    image: prom/pushgateway:v0.8.0
    container_name: pushgateway
    restart: unless-stopped
    expose:
      - 9094
    networks:
      - monitor_net
    labels:
      org.label-schema.group: "monitoring"

  caddy:
    image: stefanprodan/caddy
    container_name: caddy
    ports:
      - "3001:3000"
      - "9092:9090"
      - "9093:9093"
      - "9091:9091"
    volumes:
      - ./caddy/:/etc/caddy/
    environment:
      - ADMIN_USER=admin
      - ADMIN_PASSWORD=admin
    restart: unless-stopped
    networks:
      - monitor_net
    labels:
      org.label-schema.group: "monitoring"
  default:
    image: mikeq/hello-world:latest
    container_name: www
    depends_on:
      - nginx-proxy
      - letsencrypt
    environment:
      - VIRTUAL_HOST=alexanderwolf.io,www.alexanderwolf.io
    networks:
      - proxy_net
      - monitor_net

volumes:
  db_data:
  prometheus_data: {}
  grafana_data: {}
networks:
  cert_net:
    driver: bridge
  proxy_net:
    driver: bridge
  monitor_net:
    driver: bridge

```


- Author: {{ $page.git.author }}
- Last Update: {{ $page.git.updated }}
- Last Commit: {{ $page.git.commits[0].fullHash }}
