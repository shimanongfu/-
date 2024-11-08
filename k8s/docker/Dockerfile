FROM node:16-alpine
WORKDIR /app
COPY ./node_modules ./node_modules
COPY ./dist ./dist
COPY ./package*.json ./
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "run", "start"]