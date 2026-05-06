
# --------- STAGE 1 : BUILD ---------
FROM node:20 AS build

WORKDIR /app

# Copier package.json et installer dépendances
COPY package*.json ./
RUN npm install

# Copier tout le projet
COPY . .

# Build Angular
RUN npm run build

# --------- STAGE 2 : PRODUCTION ---------
FROM nginx:alpine

# Copier build Angular vers nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exposer port
EXPOSE 80

# Lancer nginx
CMD ["nginx", "-g", "daemon off;"]
