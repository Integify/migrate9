import { describe, expect, it } from 'vitest'
import { inspectNumber } from './numbering'

describe('inspectNumber', () => {
  it.each([
    ['2112345', 'Africell', '872112345'],
    ['7112345', 'Africell', '877112345'],
    ['4012345', 'Africell', '874012345'],
    ['4112345', 'Africell', '874112345'],
    ['3112345', 'QCell', '833112345'],
    ['5012345', 'QCell', '835012345'],
    ['5312345', 'QCell', '835312345'],
    ['5912345', 'QCell', '835912345'],
    ['6112345', 'Comium', '866112345'],
    ['8112345', 'Comium', '868112345'],
  ])('converts %s for %s', (input, operator, output) => {
    expect(inspectNumber(input)).toMatchObject({ status: 'convertible', operator, digits: output })
  })

  it.each(['4212345', '5412345', '5512345', '5612345', '5712345'])('keeps unallocated %s unknown', (input) => {
    expect(inspectNumber(input)).toMatchObject({ status: 'unknown', digits: input })
  })

  it('marks Gamcel pending without a manual operator', () => {
    expect(inspectNumber('9123456')).toMatchObject({ status: 'pending', digits: '9123456', operator: 'Gamcel' })
  })

  it.each(['872112345', '+220 87 211 2345', '00220872112345'])('leaves nine-digit values alone', (input) => {
    expect(inspectNumber(input)).toMatchObject({ status: 'unchanged' })
  })

  it.each(['+220 40-123.45', '00220 (50) 12345', '220 6 123 456'])('detects Gambian dialling prefixes and separators', (input) => {
    expect(inspectNumber(input)).toMatchObject({ status: 'convertible' })
  })

  it.each(['+221 2112345', '+44 2012345', '12345', '', 'hello'])('leaves foreign, empty, and malformed values alone', (input) => {
    expect(inspectNumber(input)).toMatchObject({ status: 'unchanged' })
  })
})
