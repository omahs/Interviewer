FROM node:8.16 as base
RUN apt-get update
RUN apt-get install -y git
# RUN apt-get install -y build-essential
RUN apt-get install -y libavahi-compat-libdnssd-dev xvfb libxtst6 libxss1 libgtk2.0-0 libgtk3-0 libnss3 libasound2 libgconf-2-4
# RUN apt-get install g++-multilib lib32z1 lib32ncurses5 -y
# RUN apt-get install rpm fakeroot dpkg libdbus-1-dev libx11-dev -y
# RUN apt-get install libavahi-compat-libdnssd-dev g++ -y
# RUN apt-get install gcc-4.8-multilib g++-4.8-multilib -y
# RUN apt-get install libgtk2.0-0 libgtk2.0-dev xvfb -y
# RUN apt-get install libxtst6 -y
# RUN apt-get install libxss1 libnss3 libasound2 libgconf-2-4 -y

FROM base as environment
ENV ELECTRON_ENABLE_STACK_DUMPING true
ENV ELECTRON_ENABLE_LOGGING true
ENV DISPLAY :99.0
ENV SCREEN_GEOMETRY "1440x900x24"
# ENV CHROMEDRIVER_PORT 4444
ENV CHROMEDRIVER_WHITELISTED_IPS "127.0.0.1"
# ENV CHROMEDRIVER_URL_BASE ''
# ENV CHROMEDRIVER_EXTRA_ARGS ''

FROM environment as build
WORKDIR /app
COPY package.json /app
COPY package-lock.json /app
COPY cordova-plugin-network-canvas-client /app/cordova-plugin-network-canvas-client
# Normally these would be run in the docker-compose script, but whilst developing we can just
# use a cached build
RUN npm install
RUN npm build:ci

CMD ["/usr/bin/env bash"]
