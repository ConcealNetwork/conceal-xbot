CCX pools info

{{#each .}}
```css
  Name: {{this.info.name}}
  Height: {{this.network.height}}
  Hashrate: {{this.pool.hashrate}}
  Miners: {{this.pool.miners}}
  Payment Threshold: {{this.config.minPaymentThreshold}}
  Pool Free: {{this.config.poolFee}}
```
{{/each}}
