import { Option } from 'fp-ts/lib/Option';
import * as OptionFn from 'fp-ts/lib/Option';
import * as ValidationFn from 'fp-ts/lib/Validation';

import Decoder, { Decoded } from './Decoder';

export default class NullableD<a> extends Decoder<Option<a>> {
  private decoder: Decoder<a>;

  constructor(decoder: Decoder<a>) {
    super();
    this.decoder = decoder;
  }

  public run(maybeValue: unknown): Decoded<Option<a>> {
    if (maybeValue === null) {
      return ValidationFn.success(OptionFn.none);
    }

    return this.decoder.run(maybeValue).map(OptionFn.some);
  }
}
