import { nonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as ValidationFn from 'fp-ts/lib/Validation';

import Decoder, { Decoded } from './Decoder';

export default class StringD extends Decoder<string> {
  public run(value: unknown): Decoded<string> {
    if (typeof value === 'string') {
      return ValidationFn.success(value);
    }

    const message = `Value must be a string, found "${typeof value}" instead`;
    return ValidationFn.failure(nonEmptyArray.of(message));
  }
}
