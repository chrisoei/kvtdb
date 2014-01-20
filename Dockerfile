FROM ubuntu:12.04

RUN     apt-get update
RUN     DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
        build-essential \
        curl \
        git 

RUN     echo 'deb http://archive.ubuntu.com/ubuntu precise-updates main' >> /etc/apt/sources.list

RUN     echo 'deb http://archive.ubuntu.com/ubuntu/ precise universe' >> /etc/apt/sources.list
RUN     echo 'deb http://archive.ubuntu.com/ubuntu/ precise-updates universe' >> /etc/apt/sources.list
RUN     echo 'deb http://archive.ubuntu.com/ubuntu/ precise multiverse' >> /etc/apt/sources.list
RUN     echo 'deb http://archive.ubuntu.com/ubuntu/ precise-updates multiverse' >> /etc/apt/sources.list

RUN     echo 'deb http://ppa.launchpad.net/chris-lea/node.js/ubuntu precise main' > /etc/apt/sources.list.d/nodejs.list
RUN     apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 136221ee520ddfaf0a905689b9316a7bc7917b12
RUN     apt-get update
RUN     apt-get install -y 'nodejs=0.10.24-1chl1~precise1'
RUN     npm install -g kvtdb

EXPOSE  63446

CMD     [ "kvtdb" ]


# sudo docker build -t chrisoei/kvtdb .
# sudo docker push chrisoei/kvtdb
# sudo docker run -d -p 63446:63446 chrisoei/kvtdb

# vim: et ft=text sts=8 sw=8 ts=8
