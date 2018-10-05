/* tslint:disable:max-classes-per-file */

import { NonEmptyArray, nonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { Option } from 'fp-ts/lib/Option';
import * as OptionFn from 'fp-ts/lib/Option';
import { Validation } from 'fp-ts/lib/Validation';
import * as ValidationFn from 'fp-ts/lib/Validation';

export default class Decoder<a> {
  public static andThen<a, b>(decoderFn: (value: a) => Decoder<b>, decoder: Decoder<a>): Decoder<b> {
    return new AndThenD(decoderFn, decoder);
  }

  public static array<a>(decoder: Decoder<a>): Decoder<a[]> {
    return new ArrayD(decoder);
  }

  public static at<a>(keys: string[], decoder: Decoder<a>): Decoder<a> {
    return keys.reduceRight((decoders, key) => Decoder.field(key, decoders), decoder);
  }

  public static boolean(): Decoder<boolean> {
    return new BooleanD();
  }

  public static fail<a>(message: string): Decoder<a> {
    return new FailD(message);
  }

  public static field<a>(key: string, decoder: Decoder<a>): Decoder<a> {
    return new FieldD(key, decoder);
  }

  public static index<a>(key: number, decoder: Decoder<a>): Decoder<a> {
    return new IndexD(key, decoder);
  }

  public static map<a, b>(fn: (value: a) => b, decoder: Decoder<a>): Decoder<b> {
    return new MapD(fn, decoder);
  }

  public static map2<a, b, c>(fn: (valueA: a, valueB: b) => c, decoderA: Decoder<a>, decoderB: Decoder<b>): Decoder<c> {
    return new Map2D(fn, decoderA, decoderB);
  }

  public static map3<a, b, c, d>(
    fn: (valueA: a, valueB: b, valueC: c) => d,
    decoderA: Decoder<a>,
    decoderB: Decoder<b>,
    decoderC: Decoder<c>,
  ): Decoder<d> {
    return new Map3D(fn, decoderA, decoderB, decoderC);
  }

  public static null<a>(value: a): Decoder<a> {
    return new NullD(value);
  }

  public static nullable<a>(decoder: Decoder<a>): Decoder<Option<a>> {
    return new NullableD(decoder);
  }

  public static number(): Decoder<number> {
    return new NumberD();
  }

  public static oneOf<a>(decoders: NonEmptyArray<Decoder<a>>): Decoder<a> {
    return new OneOfD(decoders);
  }

  public static string(): Decoder<string> {
    return new StringD();
  }

  public static succeed<a>(value: a): Decoder<a> {
    return new SucceedD(value);
  }

  public static unknown(): Decoder<unknown> {
    return new UnknownD();
  }

  public run(value: unknown): Decoded<a> {
    throw new Error('This method has to be implemented');
  }
}

export type Decoded<a> = Validation<NonEmptyArray<string>, a>;

class AndThenD<a, b> extends Decoder<b> {
  private decoderFn: (value: a) => Decoder<b>;
  private decoder: Decoder<a>;

  constructor(decoderFn: (value: a) => Decoder<b>, decoder: Decoder<a>) {
    super();
    this.decoder = decoder;
    this.decoderFn = decoderFn;
  }

  public run(value: unknown): Decoded<b> {
    return this.decoder
      .run(value)
      .fold(errors => ValidationFn.failure(errors), success => this.decoderFn(success).run(value));
  }
}

class ArrayD<a> extends Decoder<a[]> {
  private decoder: Decoder<a>;

  constructor(decoder: Decoder<a>) {
    super();
    this.decoder = decoder;
  }

  public run(valueArray: unknown): Decoded<a[]> {
    if (isArray(valueArray)) {
      return valueArray.reduce((validated: Decoded<a[]>, nextValue: unknown, indexN: number): Decoded<a[]> => {
        const validatedValue = this.decoder.run(nextValue);

        return validatedValue.fold(
          errorsFromValue => {
            const errors = errorsFromValue.map(errorText => `${errorText} at index #${indexN}`);

            return validated.fold(
              errorsFromValidated => ValidationFn.failure(errorsFromValidated.concat(errors)),
              () => ValidationFn.failure(errors),
            );
          },
          successFromValue => validated.map(successes => [...successes, successFromValue]),
        );
      }, ValidationFn.success([]));
    }

    const message = `Value must be an array, found "${typeof valueArray}" instead`;
    return ValidationFn.failure(nonEmptyArray.of(message));
  }
}

class BooleanD extends Decoder<boolean> {
  public run(value: unknown): Decoded<boolean> {
    if (typeof value === 'boolean') {
      return ValidationFn.success(value);
    }

    const message = `Value must be a boolean, found "${typeof value}" instead`;
    return ValidationFn.failure(nonEmptyArray.of(message));
  }
}

class FailD<a> extends Decoder<a> {
  private message: string;

  constructor(message: string) {
    super();
    this.message = message;
  }

  public run(): Decoded<a> {
    return ValidationFn.failure(nonEmptyArray.of(this.message));
  }
}

class FieldD<a> extends Decoder<a> {
  private decoder: Decoder<a>;
  private field: string;

  constructor(fieldS: string, decoder: Decoder<a>) {
    super();
    this.decoder = decoder;
    this.field = fieldS;
  }

  public run(valueObject: unknown): Decoded<a> {
    if (isObject(valueObject)) {
      if (this.field in valueObject) {
        return this.decoder
          .run(valueObject[this.field])
          .mapFailure(errors => errors.map(error => `${error} at key "${this.field}"`));
      }

      const noFieldMsg = `Object missing value at key "${this.field}"`;
      return ValidationFn.failure(nonEmptyArray.of(noFieldMsg));
    }

    const notObjectMsg = `Value must be an object, found "${typeof valueObject}" instead`;
    return ValidationFn.failure(nonEmptyArray.of(notObjectMsg));
  }
}

class IndexD<a> extends Decoder<a> {
  private decoder: Decoder<a>;
  private indexN: number;

  constructor(indexN: number, decoder: Decoder<a>) {
    super();
    this.decoder = decoder;
    this.indexN = indexN;
  }

  public run(valueArray: unknown): Decoded<a> {
    if (isArray(valueArray)) {
      if (valueArray[this.indexN]) {
        return this.decoder
          .run(valueArray[this.indexN])
          .mapFailure(errors => errors.map(error => `${error} at index #${this.indexN}`));
      }

      const noIndexMsg = `Array missing value at index #${this.indexN}`;
      return ValidationFn.failure(nonEmptyArray.of(noIndexMsg));
    }

    const notArrayMsg = `Value must be an array, found "${typeof valueArray}" instead`;
    return ValidationFn.failure(nonEmptyArray.of(notArrayMsg));
  }
}

class MapD<a, b> extends Decoder<b> {
  private fn: (value: a) => b;
  private decoder: Decoder<a>;

  constructor(fn: (value: a) => b, decoder: Decoder<a>) {
    super();
    this.decoder = decoder;
    this.fn = fn;
  }

  public run(value: unknown): Decoded<b> {
    return this.decoder.run(value).map(this.fn);
  }
}

class Map2D<a, b, c> extends Decoder<c> {
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

    return decoderA
      .run(value)
      .fold(
        errorsA => ValidationFn.failure(errorsA),
        successA =>
          decoderB
            .run(value)
            .fold(errorsB => ValidationFn.failure(errorsB), successB => ValidationFn.success(fn(successA, successB))),
      );
  }
}

class Map3D<a, b, c, d> extends Decoder<d> {
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

    return decoderA
      .run(value)
      .fold(
        errorsA => ValidationFn.failure(errorsA),
        successA =>
          decoderB
            .run(value)
            .fold(
              errorsB => ValidationFn.failure(errorsB),
              successB =>
                decoderC
                  .run(value)
                  .fold(
                    errorsC => ValidationFn.failure(errorsC),
                    successC => ValidationFn.success(fn(successA, successB, successC)),
                  ),
            ),
      );
  }
}

class NullD<a> extends Decoder<a> {
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

class NullableD<a> extends Decoder<Option<a>> {
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

class NumberD extends Decoder<number> {
  public run(value: unknown): Decoded<number> {
    if (typeof value === 'number') {
      return ValidationFn.success(value);
    }

    const message = `Value must be a number, found "${typeof value}" instead`;
    return ValidationFn.failure(nonEmptyArray.of(message));
  }
}

class OneOfD<a> extends Decoder<a> {
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

class StringD extends Decoder<string> {
  public run(value: unknown): Decoded<string> {
    if (typeof value === 'string') {
      return ValidationFn.success(value);
    }

    const message = `Value must be a string, found "${typeof value}" instead`;
    return ValidationFn.failure(nonEmptyArray.of(message));
  }
}

class SucceedD<a> extends Decoder<a> {
  private value: a;

  constructor(value: a) {
    super();
    this.value = value;
  }

  public run(): Decoded<a> {
    return ValidationFn.success(this.value);
  }
}

class UnknownD extends Decoder<unknown> {
  public run(value: unknown): Decoded<unknown> {
    return ValidationFn.success(value);
  }
}

function isArray(value: unknown): value is Array<unknown> {
  return Array.isArray(value);
}

function isObject(value: unknown): value is { [prop: string]: unknown } {
  return typeof value === 'object';
}
