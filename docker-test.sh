#!/bin/bash

if [ "$#" == "0" ]; then
  docker run --rm $(docker build . |& tail -n1 | cut -d' ' -f3)
else
  docker run -it --rm $(docker build . |& tail -n1 | cut -d' ' -f3) "$@"
fi
