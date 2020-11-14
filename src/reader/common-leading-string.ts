export function commonLeadingString(first: string, second: string) {
  const splitIndex = first
    .split('')
    .findIndex((value, index) => value !== second[index])

  if (splitIndex === -1) {
    return first
  }

  return first.slice(0, splitIndex)
}
