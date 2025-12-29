FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

ARG VITE_USERNAME
ARG VITE_PASSWORD
ARG VITE_API_BASE

ENV VITE_USERNAME=$VITE_USERNAME
ENV VITE_PASSWORD=$VITE_PASSWORD
ENV VITE_API_BASE=$VITE_API_BASE

RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]