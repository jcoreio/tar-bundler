/* @flow */

import assert from 'assert'
import fs from 'fs'

import compressjs from 'compressjs'
import { remove } from 'fs-extra'
import logger from 'log4jcore'
import { spawn } from 'promisify-child-process'
import tar from 'tar-fs'

const log = logger('tar-bundler')

export async function bundle({
  srcDir,
  destFile,
}: {
  srcDir: string,
  destFile: string,
}): Promise<void> {
  assert(srcDir, 'srcDir is required')
  assert(destFile, 'destFile is required')
  const tarFile =
    (destFile.endsWith('.bz2') && destFile.substring(0, destFile.length - 4)) ||
    `${destFile}.tar`
  const tarStream = tar.pack(srcDir).pipe(fs.createWriteStream(tarFile))
  await waitForStream(tarStream, 'close')

  try {
    log.info('compressing with system bzip2...')
    await remove(destFile)
    await spawn('bzip2', [tarFile], { stdio: 'inherit' })
  } catch (err) {
    log.info('system bzip2 did not work, trying built-in bzip2...')
    const readFd = fs.openSync(tarFile, 'r')
    const writeFd = fs.openSync(destFile, 'w')
    compressjs.Bzip2.compressFile(makeInStream(readFd), makeOutStream(writeFd))
    fs.closeSync(readFd)
    fs.closeSync(writeFd)
  }
}

async function waitForStream(
  stream: Object,
  doneEvent: string = 'close'
): Promise<void> {
  await new Promise((resolve: Function, reject: Function) => {
    stream.on(doneEvent || 'finish', resolve)
    stream.on('error', (err: any) => reject(err))
  })
}

function makeInStream(in_fd: number): Object {
  var stream = new compressjs.Stream()
  var stat = fs.fstatSync(in_fd)
  if (stat.size) {
    stream.size = stat.size
  }
  stream.buffer = new Buffer(4096)
  stream.filePos = null
  stream.pos = 0
  stream.end = 0
  stream._fillBuffer = function() {
    this.end = fs.readSync(
      in_fd,
      this.buffer,
      0,
      this.buffer.length,
      this.filePos
    )
    this.pos = 0
    if (this.filePos !== null && this.end > 0) {
      this.filePos += this.end
    }
  }
  stream.readByte = function(): number {
    if (this.pos >= this.end) {
      this._fillBuffer()
    }
    if (this.pos < this.end) {
      return this.buffer[this.pos++]
    }
    return -1
  }
  stream.read = function(
    buffer: Buffer,
    bufOffset: number,
    length: number
  ): number {
    if (this.pos >= this.end) {
      this._fillBuffer()
    }
    var bytesRead = 0
    while (bytesRead < length && this.pos < this.end) {
      buffer[bufOffset++] = this.buffer[this.pos++]
      bytesRead++
    }
    return bytesRead
  }
  stream.seek = function(seek_pos: number) {
    this.filePos = seek_pos
    this.pos = this.end = 0
  }
  stream.eof = function(): boolean {
    if (this.pos >= this.end) {
      this._fillBuffer()
    }
    return this.pos >= this.end
  }
  stream.buffer.fill(0)
  return stream
}

function makeOutStream(out_fd: number): Object {
  var stream = new compressjs.Stream()
  stream.buffer = new Buffer(4096)
  stream.pos = 0
  stream.flush = function() {
    fs.writeSync(out_fd, this.buffer, 0, this.pos)
    this.pos = 0
  }
  stream.writeByte = function(_byte: number) {
    if (this.pos >= this.buffer.length) {
      this.flush()
    }
    this.buffer[this.pos++] = _byte
  }
  stream.buffer.fill(0)
  return stream
}
