export const operators = {
  Africell: { prefix: '87', starts: ['40', '41', '2', '7'] },
  QCell: { prefix: '83', starts: ['50', '51', '52', '53', '58', '59', '3'] },
  Comium: { prefix: '86', starts: ['6', '8'] },
} as const

export type Operator = keyof typeof operators
export type Inspection =
  | { status: 'convertible'; operator: Operator; digits: string; insertionAt: number }
  | { status: 'pending'; operator: 'Gamcel'; digits: string }
  | { status: 'unknown'; digits: string; insertionAt: number }
  | { status: 'unchanged' }

const punctuation = /[\s().-]/g

export function inspectNumber(value: string): Inspection {
  const compact = value.replace(punctuation, '')
  let local = compact
  let offsetDigits = 0
  if (compact.startsWith('+')) {
    if (!compact.startsWith('+220')) return { status: 'unchanged' }
    local = compact.slice(4); offsetDigits = 3
  } else if (compact.startsWith('00220')) {
    local = compact.slice(5); offsetDigits = 5
  } else if (compact.startsWith('220') && (compact.length === 10 || compact.length === 12)) {
    local = compact.slice(3); offsetDigits = 3
  }
  if (!/^\d{7}$/.test(local)) return { status: 'unchanged' }
  const insertionAt = rawIndexAfterDigits(value, offsetDigits)
  if (local.startsWith('9')) return { status: 'pending', operator: 'Gamcel', digits: local }
  for (const [operator, rule] of Object.entries(operators) as [Operator, (typeof operators)[Operator]][]) {
    if (rule.starts.some((start) => local.startsWith(start))) {
      return { status: 'convertible', operator, digits: `${rule.prefix}${local}`, insertionAt }
    }
  }
  return { status: 'unknown', digits: local, insertionAt }
}

function rawIndexAfterDigits(value: string, count: number) {
  let seen = 0
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) {
      if (seen === count) return index
      seen += 1
    }
  }
  return value.length
}

export function prefixNumber(value: string, inspection: Extract<Inspection, { status: 'convertible' | 'unknown' }>, operator?: Operator) {
  const prefix = inspection.status === 'convertible' ? operators[inspection.operator].prefix : operator ? operators[operator].prefix : undefined
  return prefix ? `${value.slice(0, inspection.insertionAt)}${prefix}${value.slice(inspection.insertionAt)}` : value
}
