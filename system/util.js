export function css(strings, ...values) {
  return strings.reduce((result, str, i) => result + str + (values[i] ?? ""), "");
}

export function html(strings, ...values) {
  return strings.reduce((result, str, i) => result + str + (values[i] ?? ""), "");
}
