FROM node:0.10-slim
RUN apt-get update && \
		apt-get install -y \
						build-essential ca-certificates git-core ssh libmysqld-dev python \
						redis-server
WORKDIR /srv
RUN rm -fr *
ADD . .
CMD ["bash", "-c", "(redis-server &) ; exec npm test"]