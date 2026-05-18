#!/bin/sh
set -e

# 1. Restaura la base de datos desde el bucket (si ya existe una copia).
#    En el primer arranque no hay copia: PocketBase la crea de cero.
litestream restore -if-replica-exists /pb/pb_data/data.db
litestream restore -if-replica-exists /pb/pb_data/auxiliary.db

# 2. Arranca PocketBase replicando en vivo al bucket.
#    Render inyecta el puerto en $PORT.
exec litestream replicate -exec "/pb/pocketbase serve --http=0.0.0.0:${PORT:-8080} --dir=/pb/pb_data"
