FROM node:0.10-slim
RUN apt-get update && \
		apt-get install -y \
						build-essential ca-certificates git-core ssh libmysqld-dev python \
						inotify-tools cron \
						vim emacs-nox
WORKDIR /srv
RUN rm -fr *
ADD . .
RUN npm install
CMD npm test