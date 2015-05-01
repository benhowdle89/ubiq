# Ubiq

Fairly standard Node.js/Express/Mongo setup.

## Install

`npm install` inside root

## Running

`foreman start -p 5000 -f Procfile.dev` to run

## Requirements

The web-app is deployed to Heroku, which is where the Rdio API key is held. To develop locally, create a `.env` file inside your project and fill in like so:

```
NODE_ENV=development
RDIO_KEY=xxx
RDIO_SECRET=xxx
```
