import { isRegExp } from './is-regexp'

describe('is-regexp', () => {
  it('is true for regular expressions', () => {
    expect(isRegExp(/potato/)).toBe(true)
    expect(isRegExp(/./)).toBe(true)
    expect(isRegExp(/po(ta)to/)).toBe(true)
    expect(isRegExp(/potato/g)).toBe(true)
    expect(isRegExp(/potato/m)).toBe(true)
    expect(isRegExp(new RegExp('potato'))).toBe(true)
  })

  it('is false otherwise', () => {
    expect(isRegExp('potato')).toBe(false)
    expect(isRegExp(null)).toBe(false)
    expect(isRegExp(undefined)).toBe(false)
    expect(isRegExp(3)).toBe(false)
    expect(isRegExp({ imRegexp: true })).toBe(false)
    expect(isRegExp(['regexp'])).toBe(false)

    // Don't be fooled by false saints
    class RegExp {}
    expect(isRegExp(new RegExp())).toBe(false)
  })
})
