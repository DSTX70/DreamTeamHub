
const plugin = require('tailwindcss/plugin');
const pods = require('./pod-colors.json');

function toKey(name){
  return name.toLowerCase().replace(/&/g,'and').replace(/[^\w]+/g,'-').replace(/-+/g,'-').replace(/^-|-$|/g,'');
}

module.exports = plugin(function({ addUtilities, addVariant }){
  const utils = {};
  Object.entries(pods).forEach(([name, hex]) => {
    const key = toKey(name);
    utils[`.text-pod-${key}`] = { color: hex };
    utils[`.bg-pod-${key}`]   = { backgroundColor: hex };
    utils[`.border-pod-${key}`] = { borderColor: hex };
    utils[`.ring-pod-${key}`] = { '--tw-ring-color': hex };
  });
  addUtilities(utils, ['responsive','hover','focus']);
  addVariant('pod', '&[data-pod]');
});
