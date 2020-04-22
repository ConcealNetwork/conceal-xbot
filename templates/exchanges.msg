[{{#each .}}
  {
    "name": "{{this.name}}",
    "value": "{{this.url}}"
  }{{#unless @last}},{{/unless}}
{{/each}}]