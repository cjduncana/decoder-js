import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';

import Decoder, { Decoded } from './Decoder';

export default class OneOf<a> extends Decoder<a> {
  private decoders: NonEmptyArray<Decoder<a>>;

  constructor(decoders: NonEmptyArray<Decoder<a>>) {
    super();
    this.decoders = decoders;
  }

  public run(value: unknown): Decoded<a> {
    const firstResult = this.decoders.head.run(value);

    if (firstResult.isSuccess()) {
      return firstResult;
    }

    return this.decoders.tail.reduce((decoded: Decoded<a>, decoder: Decoder<a>) => {
      if (decoded.isSuccess()) {
        return decoded;
      }

      return decoder.run(value);
    }, firstResult);
  }
}
