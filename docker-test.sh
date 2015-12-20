#!/bin/bash

docker run $(docker build . |& tail -n1 | cut -d' ' -f3)
