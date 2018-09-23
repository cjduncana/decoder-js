import { nonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as ValidationFn from 'fp-ts/lib/Validation';

import Decoder, { Decoded } from './Decoder';

export default class BooleanD extends Decoder<boolean> {
  public run(value: unknown): Decoded<boolean> {
    if (typeof value === 'boolean') {
      return ValidationFn.success(value);
    }

    const message = `Value must be a boolean, found "${typeof value}" instead`;
    return ValidationFn.failure(nonEmptyArray.of(message));
  }
}
