FROM node:lts-alpine

# make the 'app' folder the current working directory
WORKDIR /app
RUN yarn global add pnpm
# copy both 'package.json' and 'package-lock.json' (if available)
COPY package.json ./
COPY scripts/prepare.ts ./scripts/prepare.ts

# install project dependencies
RUN pnpm install

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .

# build app for production with minification
RUN pnpm run build

EXPOSE 3000
CMD [ "pnpm", "run", "preview" ]
