import Redis from 'ioredis'
import { RedisValueNativeType, RedisModel, RedisValueType } from '../db/redis'

export interface AtonalListOptions<T extends RedisValueType> {
  name: string
  type: T
  defaultValues?: RedisValueNativeType<T>[]
}

export class AtonalList<T extends RedisValueType> extends RedisModel<T> {
  constructor(private readonly opts: AtonalListOptions<T>) {
    super(opts.name, opts.type)
  }

  protected async _init(client: Redis) {
    await super._init(client)

    if (this.opts.defaultValues) {
      const existing = await client.exists(this.key)

      if (!existing) {
        await this.push(...this.opts.defaultValues)
      }
    }
  }

  async at<R = RedisValueNativeType<T>>(index: number) {
    const value = await this.client.lindex(this.key, index)

    if (value === null) {
      return null
    }

    return this.parse(value) as R
  }

  async indexOf(value: RedisValueNativeType<T>) {
    const index = await this.client.lpos(this.key, this.stringify(value))

    if (index === null) {
      return -1
    }

    return index
  }

  async length() {
    return this.client.llen(this.key)
  }

  async values<R = RedisValueNativeType<T>>() {
    const values = await this.client.lrange(this.key, 0, -1)

    return this.parseMany(values) as R[]
  }

  async slice<R = RedisValueNativeType<T>>(start: number, end?: number) {
    const values = await this.client.lrange(this.key, start, end ? end - 1 : -1)

    return this.parseMany(values) as R[]
  }

  async push(...values: RedisValueNativeType<T>[]) {
    return this.client.rpush(this.key, ...this.stringifyMany(values))
  }

  async pop<R = RedisValueNativeType<T>>() {
    const value = await this.client.rpop(this.key)

    if (value === null) {
      return null
    }

    return this.parse(value) as R
  }

  async unshift(...values: RedisValueNativeType<T>[]) {
    return this.client.lpush(this.key, ...this.stringifyMany(values))
  }

  async shift<R = RedisValueNativeType<T>>() {
    const value = await this.client.lpop(this.key)

    if (value === null) {
      return null
    }

    return this.parse(value) as R
  }

  async removeFirst(value: RedisValueNativeType<T>) {
    return this.client.lrem(this.key, 1, this.stringify(value))
  }

  async removeAll(value: RedisValueNativeType<T>) {
    return this.client.lrem(this.key, 0, this.stringify(value))
  }

  async clear() {
    return this.client.del(this.key)
  }
}

export const useList = <T extends RedisValueType>(opts: AtonalListOptions<T>) =>
  new AtonalList(opts)
