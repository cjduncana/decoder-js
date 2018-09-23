import { nonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as ValidationFn from 'fp-ts/lib/Validation';

import Decoder, { Decoded } from './Decoder';

export default class NullD<a> extends Decoder<a> {
  private value: a;

  constructor(value: a) {
    super();
    this.value = value;
  }

  public run(value: unknown): Decoded<a> {
    if (value === null) {
      return ValidationFn.success(this.value);
    }

    const message = `Value must be a null, found "${typeof value}" instead`;
    return ValidationFn.failure(nonEmptyArray.of(message));
  }
}
