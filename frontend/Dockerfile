# Minduel Lite frontend — Vite dev server (university demo, not production nginx)
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 5173

# Bind to all interfaces so the host can reach the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
