import * as ValidationFn from 'fp-ts/lib/Validation';

import Decoder, { Decoded } from './Decoder';

export default class Map2<a, b, c> extends Decoder<c> {
  private fn: (valueA: a, valueB: b) => c;
  private decoderA: Decoder<a>;
  private decoderB: Decoder<b>;

  constructor(fn: (value: a, valueB: b) => c, decoderA: Decoder<a>, decoderB: Decoder<b>) {
    super();
    this.decoderA = decoderA;
    this.decoderB = decoderB;
    this.fn = fn;
  }

  public run(value: unknown): Decoded<c> {
    const decoderA = this.decoderA;
    const decoderB = this.decoderB;
    const fn = this.fn;

    return decoderA.run(value).fold(
      (errorsA) => ValidationFn.failure(errorsA),
      (successA) => decoderB.run(value).fold(
        (errorsB) => ValidationFn.failure(errorsB),
        (successB) => ValidationFn.success(fn(successA, successB)),
      ),
    );
  }
}
