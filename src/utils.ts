

/**
 * Returns `true` if the given value is truthy or has any kind of content
 * @example
 * import hasContent from "has-content"
 * const result = hasContent(" ")
 * result === false
 * @example
 * import hasContent from "has-content"
 * const result = hasContent("a")
 * result === true
 * @function default
 * @param {*} value
 * @returns {boolean} `true` if `value` is truthy or has content
 */

export const insertStringAfter = (haystack: string, needle: string, insertedString: string) => {
  if (!insertedString) {
    return haystack
  }
  const needleString = String(needle)
  const index = haystack.indexOf(needleString)
  if (index === -1) {
    return haystack
  }
  const endIndex = index + needleString.length
  return haystack.slice(0, endIndex) + insertedString + haystack.slice(endIndex)
}