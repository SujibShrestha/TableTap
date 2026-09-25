FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN DIRECT_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run build

EXPOSE 3000


CMD ["npm", "start"]