import { describe, expect, it } from 'vitest'
import { convertVcard } from './vcard'

const fixture = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Áwa Jallow\r\nTEL;TYPE=CELL:+220 40-12345\r\nTEL;TYPE=HOME:9123456\r\nPHOTO;ENCODING=b:abcd\r\nNOTE:keep this byte-identical\r\nX-CUSTOM:yes\r\nEND:VCARD\r\nBEGIN:VCARD\r\nVERSION:2.1\r\nFN:Test\r\nTEL:5412345\r\nTEL:3112345\r\nEND:VCARD\r\n'

describe('vCard conversion', () => {
  it('keeps legacy TEL values and adds nine-digit companions', () => {
    const result = convertVcard(fixture, { 2: 'QCell' })
    expect(result.output).toContain('TEL;TYPE=CELL:+220 40-12345\r\nTEL;TYPE=CELL:+220 8740-12345\r\n')
    expect(result.output).toContain('TEL;TYPE=HOME:9123456\r\n')
    expect(result.output).toContain('TEL:5412345\r\nTEL:835412345\r\n')
    expect(result.output).toContain('TEL:3112345\r\nTEL:833112345\r\n')
    expect(result.output).toContain('FN:Áwa Jallow\r\n')
    expect(result.output).toContain('PHOTO;ENCODING=b:abcd\r\nNOTE:keep this byte-identical\r\nX-CUSTOM:yes')
    expect(result.reviews.filter((item) => item.before === '+220 40-12345')).toMatchObject([{ name: 'Áwa Jallow', after: '+220 8740-12345' }])
    expect(result.reviews.filter((item) => item.before === '3112345')).toMatchObject([{ name: 'Test', after: '833112345' }])
  })

  it('uses the structured name when FN is absent', () => {
    expect(convertVcard('BEGIN:VCARD\nN:Jallow;Fatou\nTEL:2112345\nEND:VCARD\n').reviews).toMatchObject([{ name: 'Fatou Jallow' }])
  })

  it('is idempotent after conversion', () => {
    const once = convertVcard(fixture, { 2: 'QCell' }).output
    expect(convertVcard(once).output).toBe(once)
  })
})
