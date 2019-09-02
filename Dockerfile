FROM ubuntu:xenial as ubuntu_node
RUN apt-get update
RUN apt-get install -y curl git build-essential libavahi-compat-libdnssd-dev xvfb libxtst6 libxss1 libgtk2.0-0 libnss3 libasound2 libgconf-2-4
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash
RUN apt-get install -y nodejs

FROM ubuntu_node
WORKDIR /app
# COPY cordova-plugin-network-canvas-client .
# COPY package.json .
# COPY package-lock.json .
# RUN npm install

# overwrite this with 'CMD []' in a dependent Dockerfile
CMD ["/usr/bin/env bash"]
