FROM chrisoei/ubuntu

RUN     apt-get update && \
        apt-get install -y 'nodejs=0.10.24-1chl1~precise1' && \
        apt-get clean && \
        npm install -g kvtdb

EXPOSE  63446

CMD     [ "kvtdb" ]


# sudo docker build -t chrisoei/kvtdb .
# sudo docker push chrisoei/kvtdb
# sudo docker run -d -p 63446:63446 chrisoei/kvtdb

# vim: et ft=text sts=8 sw=8 ts=8
