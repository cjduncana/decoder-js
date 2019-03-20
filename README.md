# Decoder.js

Turn arbitrary JavaScript values into valid TypeScript values. Inspired by [Elm's JSON Decoder library][elm-decode].

This library is great at the edges of your program when you want to validate the structure of data not created by your program (for example: HTTP responses, user input, functions that return `any`).

To find an example of this library used for an HTTP response, check the `example` directory. It is OK to to transform the input into a data structure that makes more sense for your application. For example, the data returned by the CDC in the `example` directory is an array with the values in different indexes. You can transform that array of values into a structured object. It also returns number as strings, which you can change as well.

``` typescript
import Decoder, { Decoded } from 'decoder-js';

const idDecoder: Decoder<number> = Decoder.number();

const successfulResult: Decoded<number> = idDecoder.run(1);
// successfulResult = success(1)

const failedResult: Decoded<number> = idDecoder.run('1');
// failedResult = failure(nonEmptyArray.of('Value must be a number, found "string" instead'))
```

**Note:** This library uses [Giulio Canti's functional library][fp-ts] to provide different data structures like `Option` and `NonEmptyArray`. Let me know if you need any help with this library.

## Primitives

### Type Decoder

A value that knows how to turn unknown inputs into typed outputs.

### Boolean: `() => Decoder<boolean>`

Succeeds with a boolean value.

``` typescript
import Decoder from 'decoder-js';

Decoder.boolean().run(true);
// Success: true
Decoder.boolean().run(false);
// Success: false
Decoder.boolean().run(10);
// Failure
Decoder.boolean().run('string');
// Failure
```

### Number: `() => Decoder<number>`

Succeeds with a number value.

``` typescript
import Decoder from 'decoder-js';

Decoder.number().run(10);
// Success: 10
Decoder.number().run(false);
// Failure
Decoder.number().run('string');
// Failure
```

### String: `() => Decoder<string>`

Succeeds with a string value.

``` typescript
import Decoder from 'decoder-js';

Decoder.string().run('string');
// Success: 'string'
Decoder.string().run(false);
// Failure
Decoder.string().run(10);
// Failure
```

## Data Structures

### Array: `(Decoder<a>) => Decoder<a[]>`

Succeeds with an array of values.

``` typescript
import Decoder from 'decoder-js';

Decoder.array(Decoder.boolean()).run([true, false, true]);
// Success: [true, false, true]
Decoder.array(Decoder.number()).run([10, 11, 12]);
// Success: [10, 11, 12]
```

### Non-Empty Array: `(Decoder<a>) => Decoder<NonEmptyArray<a>>`

Succeeds with a non-empty array of values. This decoders guarantees at least one value in the array.

``` typescript
import Decoder from 'decoder-js';

Decoder.nonEmptyArray(Decoder.boolean()).run([true, false, true]);
// Success: NonEmptyArray(true, [false, true])
Decoder.nonEmptyArray(Decoder.boolean()).run([]);
// Failure
```

### Nullable: `(Decoder<a>) => Decoder<Option<a>>`

Succeeds with null or a value.

``` typescript
import Decoder from 'decoder-js';

Decoder.nullable(Decoder.boolean()).run(null);
// Success: None
Decoder.nullable(Decoder.boolean()).run(true);
// Success: Some(true)
Decoder.nullable(Decoder.boolean()).run('string');
// Failure
```

## Object Primitives

### Field: `(string, Decoder<a>) => Decoder<a>`

Succeeds when an object contains a certain field.

``` typescript
import Decoder from 'decoder-js';

Decoder.field('isAdult', Decoder.boolean()).run({ isAdult: true });
// Success: true
Decoder.field('isAdult', Decoder.boolean()).run({ isAdult: true, licenseState: 'California' });
// Success: true
Decoder.field('isAdult', Decoder.boolean()).run({ isAdult: 'true' });
// Failure
Decoder.field('isAdult', Decoder.boolean()).run({ licenseState: 'Vermont' });
// Failure
```

The object can have other fields. Lots of them! The only thing this decoder cares about is if `isAdult` is present and that the value there is a boolean.

Check out `map2` to see how to decode multiple fields!

### Optional Field: `(string, Decoder<a>) => Decoder<Option<a>>`

Similar to `field`, but succeeds whether the value is present or not.

``` typescript
import Decoder from 'decoder-js';

Decoder.optionalField('isAdult', Decoder.boolean()).run({ isAdult: true });
// Success: Some(true)
Decoder.optionalField('isAdult', Decoder.boolean()).run({ isAdult: true, licenseState: 'California' });
// Success: Some(true)
Decoder.optionalField('isAdult', Decoder.boolean()).run({ isAdult: 'true' });
// Failure
Decoder.optionalField('isAdult', Decoder.boolean()).run({ licenseState: 'Vermont' });
// Success: None
```

### At: `(string[], Decoder<a>) => Decoder<a>`

Succeeds when an object contains nested fields.

``` typescript
import Decoder from 'decoder-js';

const person = { name: 'Jane Doe', info: { isAdult: true, height: 161.8 } };

Decoder.at(['info', 'isAdult'], Decoder.boolean()).run(person);
// Success: true
Decoder.at(['info', 'height'], Decoder.number()).run(person);
// Success: 161.8
```

This is really just a shorthand for saying things like:

``` typescript
Decoder.field('info', Decoder.field('isAdult', Decoder.boolean())).run(person);
```

### Index: `(number, Decoder<a>) => Decoder<a>`

Succeeds when an array contains a certain index.

``` typescript
import Decoder from 'decoder-js';

const names = ['Alice', 'Bob', 'Chuck'];

Decoder.index(0, Decoder.string()).run(names);
// Success: 'Alice'
Decoder.index(1, Decoder.string()).run(names);
// Success: 'Bob'
Decoder.index(2, Decoder.string()).run(names);
// Success: 'Chuck'
Decoder.index(3, Decoder.string()).run(names);
// Failure
```

## Inconsistent Structure

### One Of: `(NonEmptyArray<Decoder<a>>) => Decoder<a>`

Try a bunch of different decoders. This can be useful if the input may come in a couple different formats. For example, say you want to read an array of numbers, but some of them are null.

``` typescript
import Decoder from 'decoder-js';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';

const badNumbers = [1, 2, null, 4];

const badNumberDecoder = Decoder.oneOf(
  new NonEmptyArray(Decoder.number(), [Decoder.null(0)])
);

Decoder.list(badNumberDecoder).run(badNumbers);
// Success: [1, 2, 0, 4]
```

Why would someone generate data like this? Questions like this are not good for your health. The point is that you can use `oneOf` to handle situations like this!

You could also use `oneOf` to help version your data. Try the latest format, then a few older ones that you still support. You could use `andThen` to be even more particular if you wanted.

## Mapping

### Map: `((a) => b, Decoder<a>) => Decoder<b>`

Transform a decoder. Maybe you just want to know an unsigned number:

``` typescript
import Decoder from 'decoder-js';

const unsignedNumberDecoder: Decoder<number> = Decoder.map(Math.abs, Decoder.number());

unsignedNumberDecoder.run(-1);
// Success: 1
```

It is often helpful to use map with oneOf, like when defining `nullable`:

``` typescript
import Decoder from 'decoder-js';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';

function nullable<a>(decoder: Decoder<a>): Decoder<Option<a>> {
  const decoders = new NonEmptyArray(
    Decoder.null(OptionFn.none),
    [Decoder.map<a, Option<a>>(OptionFn.some, decoder)],
  );

  return Decoder.oneOf(decoders);
}
```

### Map2: `((a, b) => c, Decoder<a>, Decoder<b>) => Decoder<c>`

Try two decoders and then combine the result. We can use this to decode objects with many fields:

``` typescript
import Decoder from 'decoder-js';

interface IPoint {
  x: number;
  y: number;
}

function point(x: number, y: number): IPoint {
  return { x, y };
}

const pointDecoder = Decoder.map2(
  point,
  Decoder.field('x', Decoder.number()),
  Decoder.field('y', Decoder.number()),
);

pointDecoder.run({ x: 2, y: 4 });
// Success: IPoint { x: 2, y: 4 }
```

It tries each individual decoder and puts the result together with the `point` function.

### Map3: `((a, b, c) => d, Decoder<a>, Decoder<b>, Decoder<c>) => Decoder<d>`

Try three decoders and then combine the result. We can use this to decode objects with many fields:

``` typescript
import Decoder from 'decoder-js';

interface IPerson {
  name: string;
  height: number;
  isAdult: boolean;
}

function person(name: string, height: number, isAdult: boolean): IPerson {
  return { name, height, isAdult };
}

const personDecoder = Decoder.map3(
  person,
  Decoder.field('name', Decoder.string()),
  Decoder.at(['info', 'height'], Decoder.number()),
  Decoder.at(['info', 'isAdult'], Decoder.boolean()),
);

personDecoder.run({ name: 'Tester', info: { height: 1.8, isAdult: true } });
// Success: IPerson { name: 'Tester', height: 1.8, isAdult: true }
```

Like `map2`, it tries each decoder and then give the results to the `person` function. That can be any function though!

### AndMap: `Decoder<a> => Decoder<a => b> => Decoder<b>`

When you want to try more than three decoders, you can use `andMap` to partially decode a large function of arbitrary length.

``` typescript
import { Curried3, curry, pipe } from 'fp-ts/lib/function';
import Decoder from 'decoder-js';

interface IUser {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
}

function user(id: number, username: string, email: string, isAdmin: boolean): IUser {
  return { id, username, email, isAdmin };
}

type FirstDecoder = Curried3<string, string, boolean, IUser>;

const userDecoder = pipe(
  Decoder.andMap<number, FirstDecoder>(Decoder.field('id', Decoder.number())),
  Decoder.andMap(Decoder.field('username', Decoder.string())),
  Decoder.andMap(Decoder.field('email', Decoder.string())),
  Decoder.andMap(Decoder.field('isAdmin', Decoder.boolean())),
)(Decoder.succeed(curry(user)));

userDecoder.run({ id: 0, username: 'username', email: 'email', isAdmin: true });
// Success: IUser { id: 0, username: 'username', email: 'email', isAdmin: true }
```

**Note**: `andMap` is meant to be used with `succeed` and `fp-ts`'s `curry` and `pipe` functions.

## Fancy Decoding

### Unknown: `() => Decoder<unknown>`

Do not do anything with the input. This can be useful if you have particularly complex data that you would like to deal with later, or if you are going to send it out and do not care about its structure.

### Null: `(a) => Decoder<a>`

Decode a `null` value into some other value.

``` typescript
import Decoder from 'decoder-js';

Decoder.null(false).run(null);
// Success: false
Decoder.null(42).run(null);
// Success: 42
Decoder.null(42).run(42);
// Failure
Decoder.null(42).run(false);
// Failure
```

So if you ever see a `null`, this will return whatever value you specified.

### Succeed: `(a) => Decoder<a>`

Ignore the input and produce a certain output.

``` typescript
import Decoder from 'decoder-js';

Decoder.succeed(42).run(true);
// Success: 42
Decoder.succeed(42).run([1, 2, 3]);
// Success: 42
Decoder.succeed(42).run('hello');
// Success: 42
Decoder.succeed(42).run({ x: 1, y: 2 });
// Success: 42
```

This is handy when used with `oneOf` or `andThen`.

### Fail: `(string) => Decoder<a>`

Ignore the input and make the decoder fail. This is handy when used with `oneOf` or `andThen` where you want to give a custom error message in some case.

See the `andThen` docs for an example.

### And Then: `((a) => Decoder<b>, Decoder<a>) => Decoder<b>`

Create decoders that depend on previous results. If you are creating a Direction decoder, you might do something like this:

``` typescript
import Decoder from 'decoder-js';

enum Direction {
  Up,
  Down,
  Left,
  Right,
}

function directionDecoder(type: string): Decoder<Direction> {
  switch (type) {
    case 'Up':
      return Decoder.succeed(Direction.Up);

    case 'Down':
      return Decoder.succeed(Direction.Down);

    case 'Left':
      return Decoder.succeed(Direction.Left);

    case 'Right':
      return Decoder.succeed(Direction.Right);

    default:
      return Decoder.fail(`Value "${type}" is not a valid Direction: "Up", "Down", "Left", "Right"`);
  }
}

Decoder.andThen(directionDecoder, Decoder.string()).run('Up');
// Succeed: Direction.Up
```

[elm-decode]: https://package.elm-lang.org/packages/elm/json/latest/Json-Decode  "Elm's Json.Decode"
[elm-decode-pipeline]: https://package.elm-lang.org/packages/NoRedInk/elm-decode-pipeline/latest  "NoRedInk's Json.Decode.Pipeline"
[fp-ts]: https://github.com/gcanti/fp-ts "Functional programming in TypeScript"
