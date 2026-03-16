#!/bin/sh

# Remplace les variables d'environnement dans le fichier Angular
envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js

# Exécute la commande par défaut du conteneur
exec "$@"