import { Curried3, curry, pipe } from 'fp-ts/lib/function';
import { NonEmptyArray, nonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as OptionFn from 'fp-ts/lib/Option';
import * as ValidationFn from 'fp-ts/lib/Validation';

import Decoder from './index';

describe('AndThen Decoder', () => {
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

  it('should succeed if given valid values and decoder', () => {
    const directionT = Decoder.andThen(directionDecoder, Decoder.string()).run('Up');
    expect(directionT).toEqual(ValidationFn.success(Direction.Up));
  });

  describe('should fail', () => {
    it('if the original decoder fails', () => {
      const directionT = Decoder.andThen(directionDecoder, Decoder.string()).run(true);
      const failMsg = nonEmptyArray.of('Value must be a string, found "boolean" instead');
      expect(directionT).toEqual(ValidationFn.failure(failMsg));
    });

    it('if the decoder chooser fails', () => {
      const directionT = Decoder.andThen(directionDecoder, Decoder.string()).run('Forward');
      const failMsg = nonEmptyArray.of('Value "Forward" is not a valid Direction: "Up", "Down", "Left", "Right"');
      expect(directionT).toEqual(ValidationFn.failure(failMsg));
    });
  });
});

describe('AndMap Decoder', () => {

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

  it('should succeed if all decoders succeeded', () => {
    const userT = userDecoder.run({ id: 0, username: 'username', email: 'email', isAdmin: true });
    expect(userT).toEqual(ValidationFn.success({ id: 0, username: 'username', email: 'email', isAdmin: true }));
  });

  it('should provide four failures messages if all decoders failed', () => {
    const personT = userDecoder.run({});
    const failMsg = new NonEmptyArray(
      'Object missing value at key "isAdmin"',
      [
        'Object missing value at key "email"',
        'Object missing value at key "username"',
        'Object missing value at key "id"',
      ],
    );
    expect(personT).toEqual(ValidationFn.failure(failMsg));
  });
});

describe('Array Decoder', () => {
  describe('should succeed', () => {
    it('if given a boolean decoder and an array of booleans', () => {
      const booleans = Decoder.array(Decoder.boolean()).run([true]);
      expect(booleans).toEqual(ValidationFn.success([true]));
    });

    it('if given a number decoder and an array of numbers', () => {
      const numbers = Decoder.array(Decoder.number()).run([10]);
      expect(numbers).toEqual(ValidationFn.success([10]));
    });

    it('if given a string decoder and an array of strings', () => {
      const strings = Decoder.array(Decoder.string()).run(['string']);
      expect(strings).toEqual(ValidationFn.success(['string']));
    });
  });

  describe('should fail', () => {
    it('if given an undefined value', () => {
      const undefinedT = Decoder.array(Decoder.boolean()).run(undefined);
      const failMsg = nonEmptyArray.of('Value must be an array, found "undefined" instead');
      expect(undefinedT).toEqual(ValidationFn.failure(failMsg));
    });

    it('if given a boolean', () => {
      const booleanT = Decoder.array(Decoder.boolean()).run(true);
      const failMsg = nonEmptyArray.of('Value must be an array, found "boolean" instead');
      expect(booleanT).toEqual(ValidationFn.failure(failMsg));
    });

    it('if given a number', () => {
      const numberT = Decoder.array(Decoder.number()).run(10);
      const failMsg = nonEmptyArray.of('Value must be an array, found "number" instead');
      expect(numberT).toEqual(ValidationFn.failure(failMsg));
    });

    it('if given a string', () => {
      const stringT = Decoder.array(Decoder.string()).run('string');
      const failMsg = nonEmptyArray.of('Value must be an array, found "string" instead');
      expect(stringT).toEqual(ValidationFn.failure(failMsg));
    });

    it('if given an object', () => {
      const objectT = Decoder.array(Decoder.boolean()).run({});
      const failMsg = nonEmptyArray.of('Value must be an array, found "object" instead');
      expect(objectT).toEqual(ValidationFn.failure(failMsg));
    });

    it('if given a string decoder and an array of booleans', () => {
      const booleans = Decoder.array(Decoder.string()).run([true]);
      const failMsg = nonEmptyArray.of('Value must be a string, found "boolean" instead at index #0');
      expect(booleans).toEqual(ValidationFn.failure(failMsg));
    });

    it('if given a string decoder and an array of mixed values', () => {
      const booleans = Decoder.array(Decoder.string()).run([true, 10]);
      const firstFailMsg = nonEmptyArray.of('Value must be a string, found "boolean" instead at index #0');
      const secondFailMsg = nonEmptyArray.of('Value must be a string, found "number" instead at index #1');
      const failMsgs = firstFailMsg.concat(secondFailMsg);
      expect(booleans).toEqual(ValidationFn.failure(failMsgs));
    });
  });
});

describe('At Decoder', () => {
  it('should succeed if object has nested keys', () => {
    const booleanT = Decoder.at(['first', 'boolean'], Decoder.boolean()).run({ first: { boolean: true } });
    expect(booleanT).toEqual(ValidationFn.success(true));
  });
});

describe('Boolean Decoder', () => {
  it('should succeed if given a boolean', () => {
    const booleanT = Decoder.boolean().run(true);
    expect(booleanT).toEqual(ValidationFn.success(true));
  });

  it('should fail if given an undefined value', () => {
    const undefinedT = Decoder.boolean().run(undefined);
    const failMsg = nonEmptyArray.of('Value must be a boolean, found "undefined" instead');
    expect(undefinedT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should fail if given a number', () => {
    const numberT = Decoder.boolean().run(10);
    const failMsg = nonEmptyArray.of('Value must be a boolean, found "number" instead');
    expect(numberT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should fail if given a string', () => {
    const stringT = Decoder.boolean().run('string');
    const failMsg = nonEmptyArray.of('Value must be a boolean, found "string" instead');
    expect(stringT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should fail if given an object', () => {
    const objectT = Decoder.boolean().run({});
    const failMsg = nonEmptyArray.of('Value must be a boolean, found "object" instead');
    expect(objectT).toEqual(ValidationFn.failure(failMsg));
  });
});

describe('Fail Decoder', () => {
  it('should fail no matter what value is given', () => {
    const booleanT = Decoder.fail('Custom fail message').run([true]);
    const failMsg = nonEmptyArray.of('Custom fail message');
    expect(booleanT).toEqual(ValidationFn.failure(failMsg));
  });
});

describe('Field Decoder', () => {
  it('should succeed if given an object with a boolean', () => {
    const booleanT = Decoder.field('boolean', Decoder.boolean()).run({ boolean: true });
    expect(booleanT).toEqual(ValidationFn.success(true));
  });

  describe('should fail', () => {
    it('if given an object with another value', () => {
      const stringT = Decoder.field('boolean', Decoder.boolean()).run({ boolean: 'true' });
      const failMsg = nonEmptyArray.of('Value must be a boolean, found "string" instead at key "boolean"');
      expect(stringT).toEqual(ValidationFn.failure(failMsg));
    });

    it('if given an object with missing key', () => {
      const emptyT = Decoder.field('boolean', Decoder.boolean()).run({});
      const failMsg = nonEmptyArray.of('Object missing value at key "boolean"');
      expect(emptyT).toEqual(ValidationFn.failure(failMsg));
    });

    it('if given a boolean', () => {
      const booleanT = Decoder.field('boolean', Decoder.boolean()).run(true);
      const failMsg = nonEmptyArray.of('Value must be an object, found "boolean" instead');
      expect(booleanT).toEqual(ValidationFn.failure(failMsg));
    });
  });
});

describe('Index Decoder', () => {
  it('should succeed if given an array with a boolean', () => {
    const booleanT = Decoder.index(0, Decoder.boolean()).run([true]);
    expect(booleanT).toEqual(ValidationFn.success(true));
  });

  describe('should fail', () => {
    it('if given an array with another value at that index', () => {
      const stringT = Decoder.index(0, Decoder.boolean()).run(['true']);
      const failMsg = nonEmptyArray.of('Value must be a boolean, found "string" instead at index #0');
      expect(stringT).toEqual(ValidationFn.failure(failMsg));
    });

    it('if given an array with missing index', () => {
      const emptyT = Decoder.index(0, Decoder.boolean()).run([]);
      const failMsg = nonEmptyArray.of('Array missing value at index #0');
      expect(emptyT).toEqual(ValidationFn.failure(failMsg));
    });

    it('if given a boolean', () => {
      const booleanT = Decoder.index(0, Decoder.boolean()).run(true);
      const failMsg = nonEmptyArray.of('Value must be an array, found "boolean" instead');
      expect(booleanT).toEqual(ValidationFn.failure(failMsg));
    });
  });
});

describe('Map Decoder', () => {
  it('should return the transformed decoded value', () => {
    const numberT = Decoder.map(Math.abs, Decoder.number()).run(-3);
    expect(numberT).toEqual(ValidationFn.success(3));
  });
});

describe('Map2 Decoder', () => {
  interface IPoint {
    x: number;
    y: number;
  }

  function point(x: number, y: number): IPoint {
    return { x, y };
  }

  const pointDecoder = Decoder.map2(point, Decoder.field('x', Decoder.number()), Decoder.field('y', Decoder.number()));

  it('should succeed if all decoders succeeded', () => {
    const pointT = pointDecoder.run({ x: 2, y: 4 });
    expect(pointT).toEqual(ValidationFn.success({ x: 2, y: 4 }));
  });

  it('should fail if the first decoder failed', () => {
    const pointT = pointDecoder.run({ x: '2', y: 4 });
    const failMsg = nonEmptyArray.of('Value must be a number, found "string" instead at key "x"');
    expect(pointT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should fail if the second decoder failed', () => {
    const pointT = pointDecoder.run({ x: 2, y: '4' });
    const failMsg = nonEmptyArray.of('Value must be a number, found "string" instead at key "y"');
    expect(pointT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should provide two failures messages if all decoders failed', () => {
    const pointT = pointDecoder.run({ x: '2', y: '4' });
    const failMsg = new NonEmptyArray(
      'Value must be a number, found "string" instead at key "x"',
      ['Value must be a number, found "string" instead at key "y"'],
    );
    expect(pointT).toEqual(ValidationFn.failure(failMsg));
  });
});

describe('Map3 Decoder', () => {
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

  it('should succeed if all decoders succeeded', () => {
    const personT = personDecoder.run({ name: 'Tester', info: { height: 1.8, isAdult: true } });
    expect(personT).toEqual(ValidationFn.success({ name: 'Tester', height: 1.8, isAdult: true }));
  });

  it('should fail if the first decoder failed', () => {
    const personT = personDecoder.run({ info: { height: 1.8, isAdult: true } });
    const failMsg = nonEmptyArray.of('Object missing value at key "name"');
    expect(personT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should fail if the second decoder failed', () => {
    const personT = personDecoder.run({ name: 'Tester', info: { isAdult: true } });
    const failMsg = nonEmptyArray.of('Object missing value at key "height" at key "info"');
    expect(personT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should fail if the third decoder failed', () => {
    const personT = personDecoder.run({ name: 'Tester', info: { height: 1.8 } });
    const failMsg = nonEmptyArray.of('Object missing value at key "isAdult" at key "info"');
    expect(personT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should provide two failures messages if the first and second decoders failed', () => {
    const personT = personDecoder.run({ info: { isAdult: true } });
    const failMsg = new NonEmptyArray(
      'Object missing value at key "name"',
      ['Object missing value at key "height" at key "info"'],
    );
    expect(personT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should provide two failures messages if the first and third decoders failed', () => {
    const personT = personDecoder.run({ info: { height: 1.8 } });
    const failMsg = new NonEmptyArray(
      'Object missing value at key "name"',
      ['Object missing value at key "isAdult" at key "info"'],
    );
    expect(personT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should provide two failures messages if the second and third decoders failed', () => {
    const personT = personDecoder.run({ name: 'Tester', info: {} });
    const failMsg = new NonEmptyArray(
      'Object missing value at key "height" at key "info"',
      ['Object missing value at key "isAdult" at key "info"'],
    );
    expect(personT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should provide three failures messages if all decoders failed', () => {
    const personT = personDecoder.run({ info: {} });
    const failMsg = new NonEmptyArray(
      'Object missing value at key "name"',
      [
        'Object missing value at key "height" at key "info"',
        'Object missing value at key "isAdult" at key "info"',
      ],
    );
    expect(personT).toEqual(ValidationFn.failure(failMsg));
  });
});

describe('NonEmptyArray', () => {

  it('should succeed if given a boolean decoder and a non-empty array of booleans', () => {
    const booleansResult = Decoder.nonEmptyArray(Decoder.boolean()).run([true]);
    const booleans = nonEmptyArray.of(true);
    expect(booleansResult).toEqual(ValidationFn.success(booleans));
  });

  it('should fail if given an empty array', () => {
    const booleansResult = Decoder.nonEmptyArray(Decoder.boolean()).run([]);
    const failMsg = nonEmptyArray.of('Array must have at least one value');
    expect(booleansResult).toEqual(ValidationFn.failure(failMsg));
  });
});

describe('Null Decoder', () => {
  it('should succeed if given a null value', () => {
    const booleanT = Decoder.null(true).run(null);
    expect(booleanT).toEqual(ValidationFn.success(true));
  });

  it('should fail if given another value', () => {
    const booleanT = Decoder.null(true).run(true);
    const failMsg = nonEmptyArray.of('Value must be a null, found "boolean" instead');
    expect(booleanT).toEqual(ValidationFn.failure(failMsg));
  });
});

describe('Nullable Decoder', () => {
  describe('should succeed', () => {
    it('if given a null value', () => {
      const booleanT = Decoder.nullable(Decoder.boolean()).run(null);
      expect(booleanT).toEqual(ValidationFn.success(OptionFn.none));
    });

    it('if given a boolean decoder and a boolean', () => {
      const booleanT = Decoder.nullable(Decoder.boolean()).run(true);
      expect(booleanT).toEqual(ValidationFn.success(OptionFn.some(true)));
    });

    it('if given a number decoder and a number', () => {
      const numberT = Decoder.nullable(Decoder.number()).run(10);
      expect(numberT).toEqual(ValidationFn.success(OptionFn.some(10)));
    });

    it('if given a string decoder and a string', () => {
      const stringT = Decoder.nullable(Decoder.string()).run('string');
      expect(stringT).toEqual(ValidationFn.success(OptionFn.some('string')));
    });
  });

  describe('should fail', () => {
    it('if given an undefined value', () => {
      const undefinedT = Decoder.nullable(Decoder.boolean()).run(undefined);
      const failMsg = nonEmptyArray.of('Value must be a boolean, found "undefined" instead');
      expect(undefinedT).toEqual(ValidationFn.failure(failMsg));
    });

    it('if given an object', () => {
      const objectT = Decoder.nullable(Decoder.boolean()).run({});
      const failMsg = nonEmptyArray.of('Value must be a boolean, found "object" instead');
      expect(objectT).toEqual(ValidationFn.failure(failMsg));
    });
  });
});

describe('Number Decoder', () => {
  it('should succeed if given a decimal number', () => {
    const decimal = Decoder.number().run(3.1);
    expect(decimal).toEqual(ValidationFn.success(3.1));
  });

  it('should succeed if given a hexadecimal number', () => {
    const hexadecimal = Decoder.number().run(0xf00d);
    expect(hexadecimal).toEqual(ValidationFn.success(0xf00d));
  });

  it('should succeed if given a binary number', () => {
    const hexadecimal = Decoder.number().run(0b1010);
    expect(hexadecimal).toEqual(ValidationFn.success(0b1010));
  });

  it('should succeed if given an octal number', () => {
    const octal = Decoder.number().run(0o744);
    expect(octal).toEqual(ValidationFn.success(0o744));
  });

  it('should fail if given an undefined value', () => {
    const undefinedT = Decoder.number().run(undefined);
    const failMsg = nonEmptyArray.of('Value must be a number, found "undefined" instead');
    expect(undefinedT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should fail if given a boolean', () => {
    const booleanT = Decoder.number().run(true);
    const failMsg = nonEmptyArray.of('Value must be a number, found "boolean" instead');
    expect(booleanT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should fail if given a string', () => {
    const stringT = Decoder.number().run('string');
    const failMsg = nonEmptyArray.of('Value must be a number, found "string" instead');
    expect(stringT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should fail if given an object', () => {
    const objectT = Decoder.number().run({});
    const failMsg = nonEmptyArray.of('Value must be a number, found "object" instead');
    expect(objectT).toEqual(ValidationFn.failure(failMsg));
  });
});

describe('OneOf Decoder', () => {
  const numberDecoder = nonEmptyArray.of(Decoder.number());
  const nullDecoder = nonEmptyArray.of(Decoder.null(0));
  const failDecoder: NonEmptyArray<Decoder<number>> = nonEmptyArray.of(
    Decoder.fail('Expecting a number or a null value'),
  );
  const decoders = numberDecoder.concat(nullDecoder).concat(failDecoder);
  const badIntDecoder = Decoder.oneOf(decoders);

  it('should succeed if the first decoder succeeds', () => {
    const numberT = badIntDecoder.run(2);
    expect(numberT).toEqual(ValidationFn.success(2));
  });

  it('should succeed if the first decoder fails but the second succeeds', () => {
    const numberT = badIntDecoder.run(null);
    expect(numberT).toEqual(ValidationFn.success(0));
  });

  it('should fail if the first and second decoders fails', () => {
    const booleanT = badIntDecoder.run(true);
    const failMsg = nonEmptyArray.of('Expecting a number or a null value');
    expect(booleanT).toEqual(ValidationFn.failure(failMsg));
  });
});

describe('Optional Field Decoder', () => {

  describe('should succeed', () => {

    it('with some if given an object with the given field', () => {
      const booleanT = Decoder.optionalField('boolean', Decoder.boolean()).run({ boolean: true });
      expect(booleanT).toEqual(ValidationFn.success(OptionFn.some(true)));
    });

    it('with none if given an object with missing key', () => {
      const emptyT = Decoder.optionalField('boolean', Decoder.boolean()).run({});
      expect(emptyT).toEqual(ValidationFn.success(OptionFn.none));
    });
  });

  describe('should fail', () => {

    it('if given an object with another value', () => {
      const stringT = Decoder.optionalField('boolean', Decoder.boolean()).run({ boolean: 'true' });
      const failMsg = nonEmptyArray.of('Value must be a boolean, found "string" instead at key "boolean"');
      expect(stringT).toEqual(ValidationFn.failure(failMsg));
    });

    it('if given a boolean', () => {
      const booleanT = Decoder.optionalField('boolean', Decoder.boolean()).run(true);
      const failMsg = nonEmptyArray.of('Value must be an object, found "boolean" instead');
      expect(booleanT).toEqual(ValidationFn.failure(failMsg));
    });
  });
});

describe('String Decoder', () => {
  it('should succeed if given a string', () => {
    const stringT = Decoder.string().run('string');
    expect(stringT).toEqual(ValidationFn.success('string'));
  });

  it('should fail if given an undefined value', () => {
    const undefinedT = Decoder.string().run(undefined);
    const failMsg = nonEmptyArray.of('Value must be a string, found "undefined" instead');
    expect(undefinedT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should fail if given a boolean', () => {
    const booleanT = Decoder.string().run(true);
    const failMsg = nonEmptyArray.of('Value must be a string, found "boolean" instead');
    expect(booleanT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should fail if given a number', () => {
    const numberT = Decoder.string().run(10);
    const failMsg = nonEmptyArray.of('Value must be a string, found "number" instead');
    expect(numberT).toEqual(ValidationFn.failure(failMsg));
  });

  it('should fail if given an object', () => {
    const objectT = Decoder.string().run({});
    const failMsg = nonEmptyArray.of('Value must be a string, found "object" instead');
    expect(objectT).toEqual(ValidationFn.failure(failMsg));
  });
});

describe('Succeed Decoder', () => {
  it('should succeed no matter what value is given', () => {
    const booleanT = Decoder.succeed(0).run([true]);
    expect(booleanT).toEqual(ValidationFn.success(0));
  });
});

describe('Unknown Decoder', () => {
  it('should succeed while not transforming the value', () => {
    const booleanT = Decoder.unknown().run(true);
    expect(booleanT).toEqual(ValidationFn.success(true));
  });
});

describe('Abstract Decoder', () => {
  test('should throw if still abstract', () => {
    const decoder = new Decoder();
    expect(() => decoder.run({})).toThrow();
  });
});
