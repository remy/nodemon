FROM ubuntu:12.04
MAINTAINER Remy Sharp <remy@leftlogic.com>

RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt-get update && apt-get install curl npm -y

ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION iojs
ENV NVM_VERSION 0.26.1
ENV TRAVIS TRUE

# # Install nvm with node and npm
RUN curl https://raw.githubusercontent.com/creationix/nvm/v$NVM_VERSION/install.sh | bash \
    && source $NVM_DIR/nvm.sh \
    && nvm install 0.10 \
    && nvm install 0.12 \
    && nvm install iojs-v1 \
    && nvm install iojs-v2 \
    && nvm install iojs-v3 \
    && nvm install 4.0 \
    && nvm alias default $NODE_VERSION \
    && nvm use default
