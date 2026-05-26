FROM alpine:latest

ARG PB_VERSION=0.38.1

RUN apk add --no-cache unzip ca-certificates

# Descarga la versión Linux de PocketBase (la .exe es solo para Windows/local)
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

EXPOSE 8080

# pb_data se monta como volumen persistente (los datos sobreviven reinicios/deploys)
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=/pb/pb_data"]
