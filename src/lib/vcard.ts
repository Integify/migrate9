import { inspectNumber, prefixNumber, type Operator } from './numbering'

export type ReviewItem = { id: number; name: string; before: string; after: string; status: 'converted' | 'pending' | 'unknown'; operator: string }
export type Conversion = { source: string; reviews: ReviewItem[]; output: string }

const telLine = /^((?:TEL)(?:;[^:]+)?):([\s\S]*)$/i
const fnLine = /^FN(?:;[^:]+)?:([\s\S]*)$/i
const nLine = /^N(?:;[^:]+)?:([\s\S]*)$/i

function lineParts(line: string) {
  const ending = line.match(/\r\n|\n|\r$/)?.[0] ?? ''
  const body = ending ? line.slice(0, -ending.length) : line
  return { body, ending }
}

function telValuesInCard(lines: string[], start: number) {
  const values = new Set<string>()
  for (let index = start; index < lines.length; index += 1) {
    const { body } = lineParts(lines[index])
    if (/^END:VCARD$/i.test(body)) break
    const match = body.match(telLine)
    if (match) values.add(match[2])
  }
  return values
}

export function convertVcard(source: string, manual: Record<number, Operator> = {}): Conversion {
  let id = 0
  let name = 'Unnamed contact'
  let cardTels = new Set<string>()
  const reviews: ReviewItem[] = []
  const lines = source.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g) ?? []
  const output: string[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!line) continue
    const { body, ending } = lineParts(line)

    if (/^BEGIN:VCARD$/i.test(body)) {
      name = 'Unnamed contact'
      cardTels = telValuesInCard(lines, index + 1)
      output.push(line)
      continue
    }

    const fn = body.match(fnLine)
    if (fn) {
      name = fn[1] || 'Unnamed contact'
      output.push(line)
      continue
    }

    const structuredName = body.match(nLine)
    if (structuredName && name === 'Unnamed contact') {
      const [family = '', given = ''] = structuredName[1].split(';')
      name = [given, family].filter(Boolean).join(' ') || 'Unnamed contact'
      output.push(line)
      continue
    }

    const match = body.match(telLine)
    if (!match) {
      output.push(line)
      continue
    }

    const currentId = id++
    const before = match[2]
    const found = inspectNumber(before)

    if (found.status === 'convertible') {
      const after = prefixNumber(before, found)
      if (cardTels.has(after)) {
        output.push(line)
        continue
      }
      reviews.push({ id: currentId, name, before, after, status: 'converted', operator: found.operator })
      cardTels.add(after)
      output.push(line)
      output.push(`${match[1]}:${after}${ending}`)
      continue
    }

    if (found.status === 'pending') {
      reviews.push({ id: currentId, name, before, after: before, status: 'pending', operator: 'Gamcel — pending' })
      output.push(line)
      continue
    }

    if (found.status === 'unknown') {
      const operator = manual[currentId]
      const after = operator ? prefixNumber(before, found, operator) : before
      reviews.push({ id: currentId, name, before, after, status: 'unknown', operator: operator ?? 'Unknown' })
      if (operator && after !== before && !cardTels.has(after)) {
        cardTels.add(after)
        output.push(line)
        output.push(`${match[1]}:${after}${ending}`)
        continue
      }
      output.push(line)
      continue
    }

    output.push(line)
  }

  return { source, reviews, output: output.join('') }
}
