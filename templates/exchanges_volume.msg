[{{#each .}}
  {
    "name": "{{market.name}}",
    "value": "${{converted_volume.usd}}"
  }{{#unless @last}},{{/unless}}
{{/each}}]