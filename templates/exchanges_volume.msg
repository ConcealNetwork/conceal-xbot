[{{#each .}}
  {
    "name": "{{market.name}} ({{base}}/{{target}})",
    "value": "${{converted_volume.usd}}"
  }{{#unless @last}},{{/unless}}
{{/each}}]