import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { Option } from 'fp-ts/lib/Option';

import AndThenDecoder from './AndThen';
import ArrayDecoder from './Array';
import BooleanDecoder from './Boolean';
import Decoder from './Decoder';
import FailDecoder from './Fail';
import FieldDecoder from './Field';
import MapDecoder from './Map';
import Map2Decoder from './Map2';
import Map3Decoder from './Map3';
import NullDecoder from './Null';
import NullableDecoder from './Nullable';
import NumberDecoder from './Number';
import OneOfDecoder from './OneOf';
import StringDecoder from './String';
import SucceedDecoder from './Succeed';
import UnknownDecoder from './Unknown';

export type Decoder<a> = Decoder<a>;

export function andThen<a, b>(decoderFn: (value: a) => Decoder<b>, decoder: Decoder<a>): Decoder<b> {
  return new AndThenDecoder(decoderFn, decoder);
}

export function array<a>(decoder: Decoder<a>): Decoder<a[]> {
  return new ArrayDecoder(decoder);
}

export function at<a>(keys: string[], decoder: Decoder<a>): Decoder<a> {
  return keys.reduceRight((decoders, key) => field(key, decoders), decoder);
}

export function boolean(): Decoder<boolean> {
  return new BooleanDecoder();
}

export function fail<a>(message: string): Decoder<a> {
  return new FailDecoder(message);
}

export function field<a>(key: string, decoder: Decoder<a>): Decoder<a> {
  return new FieldDecoder(key, decoder);
}

export function index<a>(key: number, decoder: Decoder<a>): Decoder<a> {
  return field(`${key}`, decoder);
}

export function map<a, b>(fn: (value: a) => b, decoder: Decoder<a>): Decoder<b> {
  return new MapDecoder(fn, decoder);
}

export function map2<a, b, c>(fn: (valueA: a, valueB: b) => c, decoderA: Decoder<a>, decoderB: Decoder<b>): Decoder<c> {
  return new Map2Decoder(fn, decoderA, decoderB);
}

export function map3<a, b, c, d>(
  fn: (valueA: a, valueB: b, valueC: c) => d,
  decoderA: Decoder<a>,
  decoderB: Decoder<b>,
  decoderC: Decoder<c>,
): Decoder<d> {
  return new Map3Decoder(fn, decoderA, decoderB, decoderC);
}

export function nullD<a>(value: a): Decoder<a> {
  return new NullDecoder(value);
}

export function nullable<a>(decoder: Decoder<a>): Decoder<Option<a>> {
  return new NullableDecoder(decoder);
}

export function number(): Decoder<number> {
  return new NumberDecoder();
}

export function oneOf<a>(decoders: NonEmptyArray<Decoder<a>>): Decoder<a> {
  return new OneOfDecoder(decoders);
}

export function string(): Decoder<string> {
  return new StringDecoder();
}

export function succeed<a>(value: a): Decoder<a> {
  return new SucceedDecoder(value);
}

export function unknown(): Decoder<unknown> {
  return new UnknownDecoder();
}
