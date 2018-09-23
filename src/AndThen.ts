import * as ValidationFn from 'fp-ts/lib/Validation';

import Decoder, { Decoded } from './Decoder';

export default class AndThen<a, b> extends Decoder<b> {
  private decoderFn: (value: a) => Decoder<b>;
  private decoder: Decoder<a>;

  constructor(decoderFn: (value: a) => Decoder<b>, decoder: Decoder<a>) {
    super();
    this.decoder = decoder;
    this.decoderFn = decoderFn;
  }

  public run(value: unknown): Decoded<b> {
    return this.decoder.run(value).fold(
      (errors) => ValidationFn.failure(errors),
      (success) => this.decoderFn(success).run(value),
    );
  }
}
