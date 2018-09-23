import * as ValidationFn from 'fp-ts/lib/Validation';

import Decoder, { Decoded } from './Decoder';

export default class Unknown extends Decoder<unknown> {
  public run(value: unknown): Decoded<unknown> {
    return ValidationFn.success(value);
  }
}
