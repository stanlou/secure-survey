# Use node as the base image
FROM node:20-alpine3.20

# Update npm to version 7
RUN npm i -g npm
RUN npm install -g nodemon ts-node

WORKDIR /app


COPY package.json  ./


RUN npm install --check-files;


COPY prisma/schema.prisma ./prisma/


RUN npx prisma generate

COPY . .

EXPOSE 3005


CMD ["npm", "run" ,"dev"]
