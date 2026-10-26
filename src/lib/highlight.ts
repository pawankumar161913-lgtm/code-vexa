/**
 * A deliberately small, dependency-free syntax highlighter.
 *
 * Security note: we NEVER inject highlighted HTML into the DOM. This returns an
 * array of typed tokens and the editor renders them as React text nodes, so any
 * `<script>` inside a user's code is displayed literally, never parsed.
 */
import type { LanguageId } from './types'

export type TokenType = 'plain' | 'comment' | 'string' | 'number' | 'keyword' | 'function' | 'tag' | 'attr' | 'operator'

export interface Token {
  text: string
  type: TokenType
}

const KEYWORDS: Record<string, string[]> = {
  javascript: 'const let var function return if else for while do switch case break continue new class extends super this typeof instanceof in of async await try catch finally throw import from export default null undefined true false void delete yield static get set'.split(' '),
  typescript: 'const let var function return if else for while do switch case break continue new class extends super this typeof instanceof in of async await try catch finally throw import from export default null undefined true false void delete yield static get set interface type enum implements readonly public private protected declare as satisfies keyof'.split(' '),
  python: 'def class return if elif else for while in not and or is None True False import from as try except finally raise with lambda pass break continue global nonlocal yield async await assert del match case'.split(' '),
  java: 'public private protected class interface extends implements return if else for while do switch case break continue new static final void int long double float boolean char byte short String this super try catch finally throw throws import package null true false instanceof enum abstract synchronized volatile transient native default record var'.split(' '),
  c: 'int char float double void long short unsigned signed struct union enum typedef return if else for while do switch case break continue goto sizeof static const extern volatile register NULL true false include define'.split(' '),
  cpp: 'int char float double void long short unsigned signed struct class union enum typedef return if else for while do switch case break continue goto sizeof static const constexpr extern volatile register nullptr true false namespace using template typename public private protected virtual override final new delete this auto try catch throw include define std'.split(' '),
  php: 'function return if else elseif for foreach while do switch case break continue new class extends implements public private protected static const echo print require include try catch finally throw namespace use null true false array as match fn'.split(' '),
  sql: 'select from where join left right inner outer on group by order having limit offset insert into values update set delete create table alter drop index view as and or not null is in like between distinct union all case when then else end count sum avg min max group_concat primary key foreign references'.split(' '),
  html: [],
  css: [],
}

const PATTERNS: Record<string, RegExp> = {
  javascript: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\b(0x[\da-fA-F]+|\d+(?:\.\d+)?)\b|\b([A-Za-z_$][\w$]*)\b|([{}()[\];,.+\-*/%=<>!&|?:]+)/g,
  typescript: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\b(0x[\da-fA-F]+|\d+(?:\.\d+)?)\b|\b([A-Za-z_$][\w$]*)\b|([{}()[\];,.+\-*/%=<>!&|?:]+)/g,
  python: /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_][\w]*)\b|([{}()[\];,.+\-*/%=<>!&|^~:]+)/g,
  java: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(\d+(?:\.\d+)?[fFdDlL]?)\b|([A-Za-z_$][\w$]*)|([{}()[\];,.+\-*/%=<>!&|?:]+)/g,
  c: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(0x[\da-fA-F]+|\d+(?:\.\d+)?[uUlLfF]*)\b|\b([A-Za-z_]\w*)\b|([{}()[\];,.+\-*/%=<>!&|?:#]+)/g,
  cpp: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(0x[\da-fA-F]+|\d+(?:\.\d+)?[uUlLfF]*)\b|\b([A-Za-z_]\w*)\b|([{}()[\];,.+\-*/%=<>!&|?:#]+)/g,
  php: /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(\d+(?:\.\d+)?)\b|(\$[A-Za-z_]\w*|[A-Za-z_]\w*)|([{}()[\];,.+\-*/%=<>!&|?:]+)/g,
  sql: /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:''|\\.|[^'\\])*')|\b(\d+(?:\.\d+)?)\b|([A-Za-z_]\w*)|([{}()[\];,.+\-*/%=<>!&|?:]+)/g,
}

function tokenizeGeneric(code: string, language: string): Token[] {
  const pattern = PATTERNS[language] || PATTERNS.javascript
  const keywords = new Set((KEYWORDS[language] || []).map((k) => k.toLowerCase()))
  const tokens: Token[] = []
  let last = 0
  let match: RegExpExecArray | null
  pattern.lastIndex = 0

  while ((match = pattern.exec(code)) !== null) {
    if (match.index > last) tokens.push({ text: code.slice(last, match.index), type: 'plain' })
    const [full, comment, str, num, word, op] = match
    if (comment) tokens.push({ text: full, type: 'comment' })
    else if (str) tokens.push({ text: full, type: 'string' })
    else if (num) tokens.push({ text: full, type: 'number' })
    else if (word) {
      const after = code.slice(match.index + full.length).match(/^\s*\(/)
      if (keywords.has(word.toLowerCase())) tokens.push({ text: full, type: 'keyword' })
      else if (after) tokens.push({ text: full, type: 'function' })
      else tokens.push({ text: full, type: 'plain' })
    } else if (op) tokens.push({ text: full, type: 'operator' })
    else tokens.push({ text: full, type: 'plain' })
    last = match.index + full.length
  }
  if (last < code.length) tokens.push({ text: code.slice(last), type: 'plain' })
  return tokens
}

function tokenizeHtml(code: string): Token[] {
  const tokens: Token[] = []
  const re = /(<!--[\s\S]*?-->)|(<\/?)([A-Za-z][\w:-]*)((?:\s+[\w:@.-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)(\s*\/?>)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) tokens.push({ text: code.slice(last, m.index), type: 'plain' })
    if (m[1]) tokens.push({ text: m[1], type: 'comment' })
    else {
      tokens.push({ text: m[2], type: 'operator' })
      tokens.push({ text: m[3], type: 'tag' })
      if (m[4]) {
        const attrRe = /(\s+)([\w:@.-]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)?/g
        let a: RegExpExecArray | null
        let consumed = 0
        while ((a = attrRe.exec(m[4])) !== null) {
          if (a.index > consumed) tokens.push({ text: m[4].slice(consumed, a.index), type: 'plain' })
          tokens.push({ text: a[1], type: 'plain' })
          tokens.push({ text: a[2], type: 'attr' })
          if (a[3]) tokens.push({ text: a[3], type: 'operator' })
          if (a[4]) tokens.push({ text: a[4], type: 'string' })
          consumed = a.index + a[0].length
        }
        if (consumed < m[4].length) tokens.push({ text: m[4].slice(consumed), type: 'plain' })
      }
      tokens.push({ text: m[5], type: 'operator' })
    }
    last = m.index + m[0].length
  }
  if (last < code.length) tokens.push({ text: code.slice(last), type: 'plain' })
  return tokens
}

function tokenizeCss(code: string): Token[] {
  const tokens: Token[] = []
  const re = /(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(@[\w-]+)|(#[0-9a-fA-F]{3,8}\b)|([\w-]+)(?=\s*:)|([{}();:,>+~]|\.[\w-]+)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) tokens.push({ text: code.slice(last, m.index), type: 'plain' })
    if (m[1]) tokens.push({ text: m[1], type: 'comment' })
    else if (m[2]) tokens.push({ text: m[2], type: 'string' })
    else if (m[3]) tokens.push({ text: m[3], type: 'keyword' })
    else if (m[4]) tokens.push({ text: m[4], type: 'number' })
    else if (m[5]) tokens.push({ text: m[5], type: 'attr' })
    else tokens.push({ text: m[0], type: 'operator' })
    last = m.index + m[0].length
  }
  if (last < code.length) tokens.push({ text: code.slice(last), type: 'plain' })
  return tokens
}

export function highlight(code: string, language: LanguageId | string): Token[] {
  if (language === 'html') return tokenizeHtml(code)
  if (language === 'css') return tokenizeCss(code)
  return tokenizeGeneric(code, language)
}

export const TOKEN_CLASS: Record<TokenType, string> = {
  plain: 'text-slate-200',
  comment: 'text-slate-500 italic',
  string: 'text-emerald-300',
  number: 'text-amber-300',
  keyword: 'text-violet-300',
  function: 'text-electric-300',
  tag: 'text-electric-300',
  attr: 'text-sky-300',
  operator: 'text-slate-400',
}
