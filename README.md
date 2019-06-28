# tar-bundler

[![CircleCI](https://circleci.com/gh/jcoreio/tar-bundler.svg?style=svg)](https://circleci.com/gh/jcoreio/tar-bundler)
[![Coverage Status](https://codecov.io/gh/jcoreio/tar-bundler/branch/master/graph/badge.svg)](https://codecov.io/gh/jcoreio/tar-bundler)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

Generate tar.bz bundles using system bzip2 if possible, or self-contained bzip2 if needed

## Installation

```sh
yarn add @jcoreio/tar-bundler
```

## Usage

```js
const { bundle } = require('@jcoreio/tar-bundler')

async function makeBundle() {
  await bundle({ srcDir: 'myDir', destFile: 'archive.tar.bz2' })
  console.log('successfully saved archive')
}
```
