import { nonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as ValidationFn from 'fp-ts/lib/Validation';

import Decoder, { Decoded } from './Decoder';

export default class NumberD extends Decoder<number> {
  public run(value: unknown): Decoded<number> {
    if (typeof value === 'number') {
      return ValidationFn.success(value);
    }

    const message = `Value must be a number, found "${typeof value}" instead`;
    return ValidationFn.failure(nonEmptyArray.of(message));
  }
}
