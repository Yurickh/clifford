import { commonLeadingString } from './common-leading-string'

describe('common-leading-string', () => {
  it('returns the common leading string between two strings', () => {
    expect(commonLeadingString('potato is solid', 'potatoes are awesome')).toBe(
      'potato',
    )
  })

  it('returns empty string if there is no common leading string', () => {
    expect(commonLeadingString('one', 'two')).toBe('')
  })

  it('returns whole string if both are the same', () => {
    expect(commonLeadingString('common', 'common')).toBe('common')
  })

  it('returns the whole of first if it is contained inside second', () => {
    expect(commonLeadingString('potato', 'potato is solid')).toBe('potato')
  })

  it('returns the whole of second if it is contained within first', () => {
    expect(commonLeadingString('potato is solid', 'potato')).toBe('potato')
  })
})
