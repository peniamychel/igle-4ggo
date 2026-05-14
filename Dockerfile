# Usamos una imagen ligera de Nginx
FROM nginx:alpine

# ELIMINAMOS la etapa de compilación de Node porque ya tienes el 'dist'
# NOTA: Asegúrate de que la ruta './dist/nombre-de-tu-app' sea la correcta.
# En Angular, IntelliJ suele dejarlo en dist/nombre-del-proyecto
COPY ./dist/igle-4/browser /usr/share/nginx/html

# Copiamos la configuración para que las rutas de Angular funcionen (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
