import * as ValidationFn from 'fp-ts/lib/Validation';

import Decoder, { Decoded } from './Decoder';

export default class Map3<a, b, c, d> extends Decoder<d> {
  private fn: (valueA: a, valueB: b, valueC: c) => d;
  private decoderA: Decoder<a>;
  private decoderB: Decoder<b>;
  private decoderC: Decoder<c>;

  constructor(
    fn: (value: a, valueB: b, valueC: c) => d,
    decoderA: Decoder<a>,
    decoderB: Decoder<b>,
    decoderC: Decoder<c>,
  ) {
    super();
    this.decoderA = decoderA;
    this.decoderB = decoderB;
    this.decoderC = decoderC;
    this.fn = fn;
  }

  public run(value: unknown): Decoded<d> {
    const decoderA = this.decoderA;
    const decoderB = this.decoderB;
    const decoderC = this.decoderC;
    const fn = this.fn;

    return decoderA.run(value).fold(
      (errorsA) => ValidationFn.failure(errorsA),
      (successA) => decoderB.run(value).fold(
        (errorsB) => ValidationFn.failure(errorsB),
        (successB) => decoderC.run(value).fold(
          (errorsC) => ValidationFn.failure(errorsC),
          (successC) => ValidationFn.success(fn(successA, successB, successC)),
        ),
      ),
    );
  }
}
