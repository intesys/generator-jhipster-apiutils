# generator-jhipster-apiutils
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
> A Jhipster module with some utilities for api first development

# Introduction

This is a [JHipster](http://jhipster.github.io/) module, that is meant to be used in a JHipster application. 
Thanks to this module its possibile to:
- when `enableSwaggerCodegen=true` the api.yml file can be served statically by a dedicated endpoint
- add `api` to service discovery tags in order to expose api version
- integration with [Fabio](https://fabiolb.net/) load balancer, when consul is enabled
- replace swagger ui 2 with the new swagger ui 3 (BETA, works only with JWT authentication)

# Prerequisites

As this is a [JHipster](http://jhipster.github.io/) module, we expect you have JHipster and its related tools already installed:

- [Installing JHipster](https://jhipster.github.io/installation.html)

# Installation

## With Yarn

To install this module:

```bash
yarn global add generator-jhipster-apiutils
```

To update this module:

```bash
yarn global upgrade generator-jhipster-apiutils
```

## With NPM

To install this module:

```bash
npm install -g generator-jhipster-apiutils
```

To update this module:

```bash
npm update -g generator-jhipster-apiutils
```

# Usage

# License

Apache-2.0 © [Enrico Costanzi]()


[npm-image]: https://img.shields.io/npm/v/generator-jhipster-apiutils.svg
[npm-url]: https://npmjs.org/package/generator-jhipster-apiutils
[travis-image]: https://travis-ci.org/intesys/generator-jhipster-apiutils.svg?branch=master
[travis-url]: https://travis-ci.org/intesys/generator-jhipster-apiutils
[daviddm-image]: https://david-dm.org/intesys/generator-jhipster-apiutils.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/intesys/generator-jhipster-apiutils
