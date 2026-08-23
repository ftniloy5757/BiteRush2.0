// src/lib/crypto/math.ts
import { randomBigIntRange } from "./random";

/**
 * Small primes list for fast pre-filtering in primality tests.
 */
const SMALL_PRIMES = [
  2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n, 53n,
  59n, 61n, 67n, 71n, 73n, 79n, 83n, 89n, 97n, 101n, 103n, 107n, 109n, 113n,
  127n, 131n, 137n, 139n, 149n, 151n, 157n, 163n, 167n, 173n, 179n, 181n, 191n,
  193n, 197n, 199n, 211n, 223n, 227n, 229n, 233n, 239n, 241n, 251n, 257n, 263n,
  269n, 271n, 277n, 281n, 283n, 293n, 307n, 311n, 313n, 317n, 331n, 337n, 347n,
  349n, 353n, 359n, 367n, 373n, 379n, 383n, 389n, 397n, 401n, 409n, 419n, 421n,
  431n, 433n, 439n, 443n, 449n, 457n, 461n, 463n, 467n, 479n, 487n, 491n, 499n,
  503n, 509n, 521n, 523n, 541n, 547n, 557n, 563n, 569n, 571n, 577n, 587n, 593n,
  599n, 601n, 607n, 613n, 617n, 619n, 631n, 641n, 643n, 647n, 653n, 659n, 661n,
  673n, 677n, 683n, 691n, 701n, 709n, 719n, 727n, 733n, 739n, 743n, 751n, 757n,
  761n, 769n, 773n, 787n, 797n, 809n, 811n, 821n, 823n, 827n, 829n, 839n, 853n,
  857n, 859n, 863n, 877n, 881n, 883n, 887n, 907n, 911n, 919n, 929n, 937n, 941n,
  947n, 953n, 967n, 971n, 977n, 983n, 991n, 997n,
];

/**
 * Standard positive modulo operation: n mod m >= 0
 */
export function mod(n: bigint, m: bigint): bigint {
  if (m <= 0n) {
    throw new Error("Modulus must be positive");
  }
  const result = n % m;
  return result < 0n ? result + m : result;
}

/**
 * Computes Greatest Common Divisor using the Euclidean algorithm.
 */
export function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x;
}

/**
 * Extended Euclidean Algorithm.
 * Returns { gcd, x, y } such that a*x + b*y = gcd(a, b).
 */
export function extendedGCD(
  a: bigint,
  b: bigint
): { gcd: bigint; x: bigint; y: bigint } {
  let oldR = a,
    r = b;
  let oldS = 1n,
    s = 0n;
  let oldT = 0n,
    t = 1n;

  while (r !== 0n) {
    const quotient = oldR / r;

    let temp = oldR - quotient * r;
    oldR = r;
    r = temp;

    temp = oldS - quotient * s;
    oldS = s;
    s = temp;

    temp = oldT - quotient * t;
    oldT = t;
    t = temp;
  }

  return { gcd: oldR, x: oldS, y: oldT };
}

/**
 * Modular multiplicative inverse: a^-1 mod m
 */
export function modInverse(a: bigint, m: bigint): bigint {
  const { gcd: g, x } = extendedGCD(mod(a, m), m);
  if (g !== 1n) {
    throw new Error(`Modular inverse does not exist for ${a} mod ${m}`);
  }
  return mod(x, m);
}

/**
 * Modular Exponentiation: (base^exponent) mod modulus
 * Implemented using binary square-and-multiply algorithm.
 */
export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === 1n) return 0n;
  if (exponent < 0n) {
    base = modInverse(base, modulus);
    exponent = -exponent;
  }

  let result = 1n;
  let b = mod(base, modulus);
  let e = exponent;

  while (e > 0n) {
    if (e & 1n) {
      result = (result * b) % modulus;
    }
    b = (b * b) % modulus;
    e >>= 1n;
  }

  return result;
}

/**
 * Miller-Rabin Probabilistic Primality Test.
 */
export function millerRabin(n: bigint, iterations: number = 25): boolean {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;

  // Small prime pre-filtering
  for (let i = 0; i < SMALL_PRIMES.length; i++) {
    const p = SMALL_PRIMES[i];
    if (n === p) return true;
    if (n % p === 0n) return false;
  }

  // Write n - 1 as d * 2^s with d odd
  let d = n - 1n;
  let s = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    s += 1n;
  }

  // Witness loop
  for (let i = 0; i < iterations; i++) {
    const a = randomBigIntRange(2n, n - 2n);
    let x = modPow(a, d, n);

    if (x === 1n || x === n - 1n) {
      continue;
    }

    let composite = true;
    for (let r = 1n; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        composite = false;
        break;
      }
    }

    if (composite) {
      return false;
    }
  }

  return true;
}

/**
 * Generates a cryptographically strong probable prime of exact bit length.
 */
export function randomPrime(bitLength: number, iterations: number = 25): bigint {
  if (bitLength < 2) {
    throw new Error("Bit length must be at least 2");
  }
  if (bitLength === 2) {
    return Math.random() < 0.5 ? 2n : 3n;
  }

  const min = 1n << BigInt(bitLength - 1);
  const max = (1n << BigInt(bitLength)) - 1n;

  while (true) {
    let candidate = randomBigIntRange(min, max);
    // Ensure candidate is odd and has highest bit set
    candidate |= 1n;
    candidate |= 1n << BigInt(bitLength - 1);

    if (millerRabin(candidate, iterations)) {
      return candidate;
    }
  }
}

/**
 * Computes the Legendre symbol (a / p) using Euler's criterion: a^((p-1)/2) mod p
 * Returns:
 *   1 if a is a quadratic residue modulo p
 *  -1 if a is a quadratic non-residue modulo p
 *   0 if a = 0 mod p
 */
export function legendreSymbol(a: bigint, p: bigint): bigint {
  const rem = modPow(a, (p - 1n) / 2n, p);
  if (rem === p - 1n) return -1n;
  return rem;
}

/**
 * Tonelli-Shanks Algorithm: Computes r such that r^2 = n mod p.
 * Requires p to be an odd prime.
 */
export function tonelliShanks(n: bigint, p: bigint): bigint {
  n = mod(n, p);
  if (n === 0n) return 0n;
  if (p === 2n) return n;

  if (legendreSymbol(n, p) !== 1n) {
    throw new Error(`${n} is not a quadratic residue modulo ${p}`);
  }

  // Fast path for p = 3 mod 4
  if (p % 4n === 3n) {
    return modPow(n, (p + 1n) / 4n, p);
  }

  // Factor p - 1 as q * 2^s with q odd
  let q = p - 1n;
  let s = 0n;
  while (q % 2n === 0n) {
    q /= 2n;
    s += 1n;
  }

  // Find a quadratic non-residue z mod p
  let z = 2n;
  while (legendreSymbol(z, p) !== -1n) {
    z += 1n;
  }

  let m = s;
  let c = modPow(z, q, p);
  let t = modPow(n, q, p);
  let r = modPow(n, (q + 1n) / 2n, p);

  while (t !== 0n && t !== 1n) {
    let t2 = t;
    let i = 0n;
    for (i = 1n; i < m; i++) {
      t2 = (t2 * t2) % p;
      if (t2 === 1n) break;
    }

    if (i === m) {
      throw new Error("Tonelli-Shanks algorithm failed to converge");
    }

    const b = modPow(c, 1n << (m - i - 1n), p);
    m = i;
    c = (b * b) % p;
    t = (t * c) % p;
    r = (r * b) % p;
  }

  return r;
}
