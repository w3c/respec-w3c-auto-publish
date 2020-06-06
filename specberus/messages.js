// @ts-check
// Based on https://github.com/w3c/specberus/blob/master/lib/l10n.js

const allRules = require('./rules.json');
const { messages } = require('./l10n-en_GB.js');

const rules = {};
for (const [type, entry] of Object.entries(allRules)) {
  if (type === '*') {
    rules[type] = entry;
  } else if (entry.profiles) {
    for (const [profile, data] of Object.entries(entry.profiles)) {
      rules[profile] = data;
    }
  }
}

exports.getMessage = (profileCode, rule, key, extra) => {
  const result = {};
  // Corner case: if the profile is unknown, let's assume 'WD' (most common).
  const profile = profileCode ? profileCode.replace('-Echidna', '') : 'WD';
  const name = typeof rule === 'string' ? rule : rule.name;

  if (profile in rules === false) {
    throw new Error(`Unknown profile code "${profile}"`);
  }

  result.title = result.message = messages[`${name}.${key}`];

  if (extra) {
    result.message = result.message.replace(
      /\$\{([^}]+)\}/g,
      function interpolate(m, p1) {
        if (Object.prototype.hasOwnProperty.call(extra, p1)) return extra[p1];
        else return `[unknown ${p1}]`;
      },
    );
  }

  if (rule.section && rule.rule) {
    result.id = rule.rule;
    result.name = rule.name;

    let selector;
    if (rules[profile].sections[rule.section]) {
      const ruleSection = rules[profile].sections[rule.section];
      if (ruleSection.rules[rule.rule]) {
        if ('boolean' === typeof ruleSection.rules[rule.rule]) {
          // Common rule, with no parameters
          result.quote = rules['*'].sections[rule.section].rules[rule.rule];
        } else if ('string' === typeof ruleSection.rules[rule.rule]) {
          // Specific rule
          result.quote = ruleSection.rules[rule.rule];
        } else if ('object' === typeof ruleSection.rules[rule.rule]) {
          // Array (common rule with parameters)
          const values = ruleSection.rules[rule.rule];
          let template = rules['*'].sections[rule.section].rules[rule.rule];
          for (let p = 0; p < values.length; p++)
            template = template.replace(
              new RegExp(`@{param${p + 1}}`, 'g'),
              values[p],
            );
          result.quote = template;
        } else {
          // Error
          selector = encodeURIComponent(
            `[${profile}][${rule.section}][${rule.rule}].text`,
          );
        }
      } else
        selector = encodeURIComponent(
          `[${profile}][${rule.section}][${rule.rule}]`,
        );
    } else {
      selector = encodeURIComponent(`[${profile}][${rule.section}]`);
    }
    result.selector = selector;
  }

  return result;
};
