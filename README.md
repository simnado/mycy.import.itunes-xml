# MyCy Importer

> this is an example for a working import service using the exported iTunes.xml
> format.

## Local setup

run `deno task dev`

## GraphQL API

run `deno task serve`

and visit the API under `http://localhost:8003/graphql`

## CLI

run `deno task cli <path to xml> [options]`

and the converted file will be stored in the `dist` folder

### Options

- `--updates <date>` will only output songs modified since `<date>`
